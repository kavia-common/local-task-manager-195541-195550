import React from "react";

/**
 * Filter chips for All / Active / Completed.
 */

// PUBLIC_INTERFACE
export function Filters({ filter, onChange }) {
  /** Toggle list filtering mode. */
  return (
    <div className="ChipGroup" role="tablist" aria-label="Filter tasks">
      <button
        type="button"
        className={`Chip ${filter === "all" ? "ChipActive" : ""}`}
        onClick={() => onChange("all")}
        role="tab"
        aria-selected={filter === "all"}
      >
        All
      </button>
      <button
        type="button"
        className={`Chip ${filter === "active" ? "ChipActive" : ""}`}
        onClick={() => onChange("active")}
        role="tab"
        aria-selected={filter === "active"}
      >
        Active
      </button>
      <button
        type="button"
        className={`Chip ${filter === "completed" ? "ChipActive" : ""}`}
        onClick={() => onChange("completed")}
        role="tab"
        aria-selected={filter === "completed"}
      >
        Completed
      </button>
    </div>
  );
}
