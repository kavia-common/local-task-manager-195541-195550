import React, { useEffect, useRef, useState } from "react";

/**
 * Controlled input for adding new todos.
 */

// PUBLIC_INTERFACE
export function TodoInput({ onAdd }) {
  /** Add-new-todo form. Press Enter to add. */
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus the input on first mount for quick keyboard use.
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Please enter a task.");
      return;
    }
    onAdd(trimmed);
    setTitle("");
    setError("");
    if (inputRef.current) inputRef.current.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="Stack">
      <div className="Row">
        <label className="visually-hidden" htmlFor="newTodo">
          New task
        </label>
        <input
          id="newTodo"
          ref={inputRef}
          className="Input"
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "newTodoError" : "newTodoHint"}
        />
        <button type="button" className="Button ButtonPrimary" onClick={submit}>
          Add
        </button>
      </div>

      {error ? (
        <div id="newTodoError" className="AlertError" role="alert">
          {error}
        </div>
      ) : (
        <div id="newTodoHint" className="InputHint">
          Tip: Press <strong>Enter</strong> to add.
        </div>
      )}
    </div>
  );
}
