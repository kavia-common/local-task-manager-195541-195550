/**
 * Storage service for Todos.
 * Prefers IndexedDB, falls back to LocalStorage when IndexedDB is unavailable or fails.
 *
 * This file intentionally avoids external dependencies.
 */

const DB_NAME = "todo_local_db";
const DB_VERSION = 1;
const STORE_NAME = "todos";

const LS_PREFIX = "todo_app_v1";
const LS_TODOS_KEY = `${LS_PREFIX}:todos`;
const LS_ENGINE_KEY = `${LS_PREFIX}:engine`;

/**
 * @typedef {"indexeddb" | "localstorage"} StorageEngine
 */

/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/** Create/open IndexedDB */
async function openDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported by this browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB."));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function idbTx(db, mode) {
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  return { tx, store };
}

async function idbGetAll() {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const { store } = idbTx(db, "readonly");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error || new Error("Failed to read todos from IndexedDB."));
    });
  } finally {
    db.close();
  }
}

async function idbPut(todo) {
  const db = await openDb();
  try {
    await new Promise((resolve, reject) => {
      const { tx, store } = idbTx(db, "readwrite");
      store.put(todo);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to save todo to IndexedDB."));
      tx.onabort = () => reject(tx.error || new Error("Transaction aborted while saving todo."));
    });
  } finally {
    db.close();
  }
}

async function idbDelete(id) {
  const db = await openDb();
  try {
    await new Promise((resolve, reject) => {
      const { tx, store } = idbTx(db, "readwrite");
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to delete todo from IndexedDB."));
      tx.onabort = () => reject(tx.error || new Error("Transaction aborted while deleting todo."));
    });
  } finally {
    db.close();
  }
}

async function idbClearAndBulkPut(todos) {
  const db = await openDb();
  try {
    await new Promise((resolve, reject) => {
      const { tx, store } = idbTx(db, "readwrite");
      const clearReq = store.clear();
      clearReq.onerror = () => reject(clearReq.error || new Error("Failed to clear store."));
      clearReq.onsuccess = () => {
        todos.forEach((t) => store.put(t));
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Bulk import failed."));
      tx.onabort = () => reject(tx.error || new Error("Bulk import aborted."));
    });
  } finally {
    db.close();
  }
}

/** LocalStorage helpers */
function lsLoadTodos() {
  try {
    const raw = window.localStorage.getItem(LS_TODOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function lsSaveTodos(todos) {
  window.localStorage.setItem(LS_TODOS_KEY, JSON.stringify(todos));
}

function lsGetEngine() {
  const v = window.localStorage.getItem(LS_ENGINE_KEY);
  return v === "localstorage" || v === "indexeddb" ? v : null;
}

function lsSetEngine(engine) {
  window.localStorage.setItem(LS_ENGINE_KEY, engine);
}

/** Validate / normalize imported todos */
function normalizeTodos(input) {
  const now = Date.now();
  if (!Array.isArray(input)) return [];

  return input
    .filter((t) => t && typeof t === "object")
    .map((t) => {
      const id = typeof t.id === "string" && t.id ? t.id : cryptoRandomId();
      const title = typeof t.title === "string" ? t.title : "";
      const completed = Boolean(t.completed);
      const createdAt = typeof t.createdAt === "number" ? t.createdAt : now;
      const updatedAt = typeof t.updatedAt === "number" ? t.updatedAt : now;
      return { id, title, completed, createdAt, updatedAt };
    })
    .filter((t) => t.title.trim().length > 0);
}

function cryptoRandomId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// PUBLIC_INTERFACE
export function getPreferredEngine() {
  /** Get saved preferred storage engine (or null if unset). */
  return lsGetEngine();
}

// PUBLIC_INTERFACE
export function setPreferredEngine(engine) {
  /** Persist preferred storage engine selection. */
  lsSetEngine(engine);
}

// PUBLIC_INTERFACE
export async function isIndexedDbAvailable() {
  /** Detect whether IndexedDB is usable. */
  try {
    await openDb();
    return true;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export async function loadTodos(engine) {
  /** Load todos from the selected engine. */
  if (engine === "indexeddb") {
    return await idbGetAll();
  }
  return lsLoadTodos();
}

// PUBLIC_INTERFACE
export async function saveTodo(engine, todo) {
  /** Create/update a single todo in the selected engine. */
  if (engine === "indexeddb") {
    await idbPut(todo);
    return;
  }
  const todos = lsLoadTodos();
  const idx = todos.findIndex((t) => t.id === todo.id);
  if (idx >= 0) todos[idx] = todo;
  else todos.push(todo);
  lsSaveTodos(todos);
}

// PUBLIC_INTERFACE
export async function deleteTodo(engine, id) {
  /** Delete a todo by id in the selected engine. */
  if (engine === "indexeddb") {
    await idbDelete(id);
    return;
  }
  const todos = lsLoadTodos().filter((t) => t.id !== id);
  lsSaveTodos(todos);
}

// PUBLIC_INTERFACE
export async function replaceAllTodos(engine, todos) {
  /** Replace all todos in the selected engine (used for import/migration). */
  const normalized = normalizeTodos(todos);

  if (engine === "indexeddb") {
    await idbClearAndBulkPut(normalized);
    return;
  }
  lsSaveTodos(normalized);
}

// PUBLIC_INTERFACE
export async function exportTodosAsJson(engine) {
  /** Export todos as a formatted JSON string. */
  const todos = await loadTodos(engine);
  const normalized = normalizeTodos(todos);
  normalized.sort((a, b) => a.createdAt - b.createdAt);
  return JSON.stringify(normalized, null, 2);
}

// PUBLIC_INTERFACE
export async function migrateTodos(fromEngine, toEngine) {
  /**
   * Migrate todos from one engine to another and return migrated todos.
   * Keeps data consistent when user switches storage engine.
   */
  const todos = await loadTodos(fromEngine);
  await replaceAllTodos(toEngine, todos);
  return await loadTodos(toEngine);
}
