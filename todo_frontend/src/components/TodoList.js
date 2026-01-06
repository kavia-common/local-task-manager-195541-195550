import React from "react";
import { TodoItem } from "./TodoItem";

/**
 * Todo list rendering.
 */

// PUBLIC_INTERFACE
export function TodoList({ todos, onToggle, onDelete, onUpdate }) {
  /** Renders a list of todos or an empty state. */
  if (!todos.length) {
    return <div className="EmptyState">No tasks match your current filters.</div>;
  }

  return (
    <ul className="List" aria-label="Todo items">
      {todos.map((t) => (
        <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </ul>
  );
}
