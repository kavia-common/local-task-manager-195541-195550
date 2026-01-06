import React from "react";

/**
 * App header with title and Settings action.
 */

// PUBLIC_INTERFACE
export function Header({ onOpenSettings, engineLabel }) {
  /** Header for the Todo app. */
  return (
    <div className="Header">
      <div className="Brand">
        <div className="BrandTitle">Todo</div>
        <div className="BrandSub">
          Local-first · Storage: <strong>{engineLabel}</strong>
        </div>
      </div>

      <div className="HeaderActions">
        <button type="button" className="Button" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </div>
  );
}
