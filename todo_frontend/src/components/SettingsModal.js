import React, { useEffect, useMemo, useState } from "react";

/**
 * Settings modal: storage engine selection + export/import JSON.
 */

// PUBLIC_INTERFACE
export function SettingsModal({
  isOpen,
  onClose,
  engine,
  indexedDbAvailable,
  onChangeEngine,
  onExportJson,
  onImportJson,
}) {
  /** Modal dialog to manage app settings and data portability. */
  const [importText, setImportText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setImportText("");
      setError("");
    }
  }, [isOpen]);

  const engineHelp = useMemo(() => {
    if (engine === "indexeddb") return "Best for larger datasets; stored as IndexedDB in your browser.";
    return "Stored as LocalStorage; simpler but more limited.";
  }, [engine]);

  const doExport = async () => {
    setError("");
    try {
      const json = await onExportJson();
      setImportText(json);
    } catch (e) {
      setError(e?.message || "Export failed.");
    }
  };

  const doImport = async () => {
    setError("");
    try {
      const parsed = JSON.parse(importText || "[]");
      await onImportJson(parsed);
    } catch (e) {
      setError(e?.message || "Import failed. Ensure valid JSON.");
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  const onOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="ModalOverlay" role="presentation" onMouseDown={onOverlayMouseDown}>
      <div className="Modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="ModalHeader">
          <div className="ModalTitle">Settings</div>
          <button type="button" className="Button ButtonIcon" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className="ModalBody">
          <div className="Stack">
            <div>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Storage engine</div>
              <div className="RadioRow" role="radiogroup" aria-label="Choose storage engine">
                <div className="RadioCard">
                  <label>
                    <input
                      type="radio"
                      name="engine"
                      value="indexeddb"
                      checked={engine === "indexeddb"}
                      onChange={() => onChangeEngine("indexeddb")}
                      disabled={!indexedDbAvailable}
                    />{" "}
                    IndexedDB (recommended)
                  </label>
                  <div className="InputHint">
                    {indexedDbAvailable
                      ? "Available"
                      : "Not available in this browser/context. Use LocalStorage."}
                  </div>
                </div>

                <div className="RadioCard">
                  <label>
                    <input
                      type="radio"
                      name="engine"
                      value="localstorage"
                      checked={engine === "localstorage"}
                      onChange={() => onChangeEngine("localstorage")}
                    />{" "}
                    LocalStorage
                  </label>
                  <div className="InputHint">Simple fallback storage.</div>
                </div>

                <div className="InputHint">{engineHelp}</div>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Export / Import (JSON)</div>
              <div className="Row">
                <button type="button" className="Button" onClick={doExport}>
                  Export to JSON
                </button>
                <button type="button" className="Button ButtonPrimary" onClick={doImport}>
                  Import JSON
                </button>
              </div>
              <div className="InputHint" style={{ marginTop: 8 }}>
                Paste JSON here to import. Import replaces all tasks in the selected storage engine.
              </div>
              <textarea
                className="Textarea"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='[{"id":"...","title":"Buy milk","completed":false,"createdAt":...,"updatedAt":...}]'
              />
              {error ? (
                <div className="AlertError" role="alert">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="ModalFooter">
          <button type="button" className="Button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
