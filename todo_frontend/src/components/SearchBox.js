import React from "react";

/**
 * Search box for filtering by title text.
 */

// PUBLIC_INTERFACE
export function SearchBox({ value, onChange }) {
  /** Search box controlled input. */
  return (
    <div style={{ flex: "1 1 260px" }}>
      <label className="visually-hidden" htmlFor="searchTodos">
        Search tasks
      </label>
      <input
        id="searchTodos"
        className="Input"
        placeholder="Search…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
