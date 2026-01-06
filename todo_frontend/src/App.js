import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Header } from "./components/Header";
import { TodoInput } from "./components/TodoInput";
import { Filters } from "./components/Filters";
import { SearchBox } from "./components/SearchBox";
import { TodoList } from "./components/TodoList";
import { SettingsModal } from "./components/SettingsModal";
import {
  deleteTodo,
  exportTodosAsJson,
  getPreferredEngine,
  isIndexedDbAvailable,
  loadTodos,
  migrateTodos,
  replaceAllTodos,
  saveTodo,
  setPreferredEngine,
} from "./services/storage";

/**
 * Todo SPA (no backend). Data persists locally using IndexedDB when available,
 * with a LocalStorage fallback.
 */

function makeTodo(title) {
  const now = Date.now();
  const id =
    typeof window !== "undefined" && window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : `${now}_${Math.random().toString(16).slice(2)}`;

  return { id, title, completed: false, createdAt: now, updatedAt: now };
}

// PUBLIC_INTERFACE
function App() {
  /** Main application entry component. */
  const [engine, setEngine] = useState("indexeddb");
  const [engineAvailable, setEngineAvailable] = useState(true);

  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all"); // all | active | completed
  const [query, setQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Initial engine selection: prefer IndexedDB when available; allow user override from saved preference.
  useEffect(() => {
    let mounted = true;

    async function init() {
      const idbOk = await isIndexedDbAvailable();
      if (!mounted) return;

      setEngineAvailable(idbOk);

      const preferred = getPreferredEngine();
      const initial = preferred ? preferred : idbOk ? "indexeddb" : "localstorage";
      const effective = initial === "indexeddb" && !idbOk ? "localstorage" : initial;

      setEngine(effective);
    }

    init().catch(() => {
      // If detection fails for any reason, fall back safely.
      if (mounted) {
        setEngineAvailable(false);
        setEngine("localstorage");
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Load todos whenever engine changes.
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadError("");
      try {
        const loaded = await loadTodos(engine);
        if (!mounted) return;
        // Sort newest first for a modern feel.
        const sorted = [...loaded].sort((a, b) => b.createdAt - a.createdAt);
        setTodos(sorted);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e?.message || "Failed to load tasks from storage.");
        setTodos([]);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [engine]);

  const engineLabel = engine === "indexeddb" ? "IndexedDB" : "LocalStorage";

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    const q = query.trim().toLowerCase();

    return todos.filter((t) => {
      if (filter === "active" && t.completed) return false;
      if (filter === "completed" && !t.completed) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [todos, filter, query]);

  const persistAndSetTodos = async (nextTodos) => {
    // For LocalStorage we could store full list, but our service supports per-item
    // updates for both engines; so write item-level changes in handlers instead.
    setTodos(nextTodos);
  };

  // PUBLIC_INTERFACE
  const handleAdd = async (title) => {
    /** Add a new todo and persist it. */
    const todo = makeTodo(title);

    // Optimistic UI update
    const next = [todo, ...todos];
    await persistAndSetTodos(next);

    try {
      await saveTodo(engine, todo);
    } catch (e) {
      setLoadError(e?.message || "Failed to save new task.");
    }
  };

  // PUBLIC_INTERFACE
  const handleToggle = async (id) => {
    /** Toggle completion and persist. */
    const existing = todos.find((t) => t.id === id);
    if (!existing) return;

    const updated = { ...existing, completed: !existing.completed, updatedAt: Date.now() };
    const next = todos.map((t) => (t.id === id ? updated : t));
    await persistAndSetTodos(next);

    try {
      await saveTodo(engine, updated);
    } catch (e) {
      setLoadError(e?.message || "Failed to update task.");
    }
  };

  // PUBLIC_INTERFACE
  const handleDelete = async (id) => {
    /** Delete a todo and persist. */
    const next = todos.filter((t) => t.id !== id);
    await persistAndSetTodos(next);

    try {
      await deleteTodo(engine, id);
    } catch (e) {
      setLoadError(e?.message || "Failed to delete task.");
    }
  };

  // PUBLIC_INTERFACE
  const handleUpdate = async (id, patch) => {
    /** Update todo fields (e.g., title) and persist. */
    const existing = todos.find((t) => t.id === id);
    if (!existing) return;

    const updated = { ...existing, ...patch, updatedAt: Date.now() };
    const next = todos.map((t) => (t.id === id ? updated : t));
    await persistAndSetTodos(next);

    try {
      await saveTodo(engine, updated);
    } catch (e) {
      setLoadError(e?.message || "Failed to update task.");
    }
  };

  // PUBLIC_INTERFACE
  const handleChangeEngine = async (nextEngine) => {
    /** Change storage engine and migrate existing todos to keep continuity. */
    if (nextEngine === "indexeddb" && !engineAvailable) return;

    if (nextEngine === engine) {
      setPreferredEngine(nextEngine);
      return;
    }

    setLoadError("");
    try {
      const migrated = await migrateTodos(engine, nextEngine);
      setPreferredEngine(nextEngine);
      setEngine(nextEngine);
      setTodos([...migrated].sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      setLoadError(e?.message || "Failed to switch storage engine.");
    }
  };

  // PUBLIC_INTERFACE
  const handleExportJson = async () => {
    /** Export tasks as JSON string. */
    return await exportTodosAsJson(engine);
  };

  // PUBLIC_INTERFACE
  const handleImportJson = async (parsed) => {
    /** Import tasks (replaces all). */
    await replaceAllTodos(engine, parsed);
    const loaded = await loadTodos(engine);
    setTodos([...loaded].sort((a, b) => b.createdAt - a.createdAt));
  };

  return (
    <div className="App">
      <div className="Container">
        <Header onOpenSettings={() => setSettingsOpen(true)} engineLabel={engineLabel} />

        <div className="Card">
          <div className="CardHeader">
            <TodoInput onAdd={handleAdd} />
          </div>

          <div className="CardBody">
            <div className="Stack">
              {loadError ? (
                <div className="AlertError" role="alert">
                  {loadError}
                </div>
              ) : null}

              <div className="Row" aria-label="Todo controls">
                <Filters filter={filter} onChange={setFilter} />
                <SearchBox value={query} onChange={setQuery} />
              </div>

              <TodoList todos={filteredTodos} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />

              <div className="FooterBar" aria-label="Todo stats">
                <div>
                  <strong>{stats.active}</strong> active · <strong>{stats.completed}</strong> completed ·{" "}
                  <strong>{stats.total}</strong> total
                </div>
                <div className="InputHint">Edit: Enter saves, Esc cancels.</div>
              </div>
            </div>
          </div>
        </div>

        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          engine={engine}
          indexedDbAvailable={engineAvailable}
          onChangeEngine={handleChangeEngine}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
        />
      </div>
    </div>
  );
}

export default App;
