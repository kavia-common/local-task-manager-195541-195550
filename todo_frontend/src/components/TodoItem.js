import React, { useEffect, useRef, useState } from "react";

/**
 * Single Todo item with toggle, edit, delete.
 */

// PUBLIC_INTERFACE
export function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  /** Renders a todo row with actions and accessible editing. */
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const inputRef = useRef(null);

  useEffect(() => {
    // Keep draft synced when todo changes (e.g., due to import).
    setDraft(todo.title);
  }, [todo.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEdit = () => setIsEditing(true);

  const cancelEdit = () => {
    setDraft(todo.title);
    setIsEditing(false);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      // If user clears title, treat as cancel (avoid empty tasks).
      cancelEdit();
      return;
    }
    if (trimmed !== todo.title) {
      onUpdate(todo.id, { title: trimmed });
    }
    setIsEditing(false);
  };

  const onEditKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
  };

  const created = new Date(todo.createdAt);
  const meta = `${created.toLocaleDateString()} · ${created.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return (
    <li className="Item">
      <div className="ItemCheck">
        <button
          type="button"
          className={`Check ${todo.completed ? "CheckChecked" : ""}`}
          onClick={() => onToggle(todo.id)}
          aria-label={todo.completed ? "Mark as not completed" : "Mark as completed"}
        >
          {todo.completed ? <span className="CheckIcon">✓</span> : null}
        </button>
      </div>

      <div className="ItemMain">
        <div className="TitleRow">
          {isEditing ? (
            <>
              <label className="visually-hidden" htmlFor={`edit-${todo.id}`}>
                Edit task
              </label>
              <input
                id={`edit-${todo.id}`}
                ref={inputRef}
                className="Input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onEditKeyDown}
                onBlur={commitEdit}
                aria-describedby={`editHint-${todo.id}`}
              />
              <span id={`editHint-${todo.id}`} className="visually-hidden">
                Press Enter to save, Escape to cancel.
              </span>
            </>
          ) : (
            <span className={`ItemTitle ${todo.completed ? "ItemTitleCompleted" : ""}`}>
              {todo.title}
            </span>
          )}
        </div>
        <div className="ItemMeta">{meta}</div>
      </div>

      <div className="ItemActions">
        {isEditing ? (
          <>
            <button type="button" className="Button ButtonIcon" onClick={commitEdit} aria-label="Save edit">
              ✓
            </button>
            <button type="button" className="Button ButtonIcon" onClick={cancelEdit} aria-label="Cancel edit">
              ×
            </button>
          </>
        ) : (
          <>
            <button type="button" className="Button ButtonIcon" onClick={startEdit} aria-label="Edit task">
              Edit
            </button>
            <button
              type="button"
              className="Button ButtonIcon ButtonDanger"
              onClick={() => onDelete(todo.id)}
              aria-label="Delete task"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}
