import React from "react";

/**
 * Search box for filtering by title text.
 */

// PUBLIC_INTERFACE
export function SearchBox({ value, onChange }) {
  /** Search box controlled input. */
  return (
    <div className="SearchWrap">
      <label className="visually-hidden" htmlFor="searchTodos">
        Search tasks
      </label>
      <span className="SearchIcon" aria-hidden="true">
        ⌕
      </span>
      <input
        id="searchTodos"
        className="Input SearchInput"
        placeholder="Search…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
