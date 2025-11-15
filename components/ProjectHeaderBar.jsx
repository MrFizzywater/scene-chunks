"use client";

import React, { useState, useRef } from "react";
import { useProject } from "../context/ProjectContext";

export default function ProjectHeaderBar() {
  const {
    project,
    updateProjectTitle,
    updateProjectMeta,
    manualSave,
    loadFromLocal,
    importFromText,
    getSerializableProject,
    loadFromObject,
    createNewProject,
  } = useProject();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempMeta, setTempMeta] = useState(project.meta || {});

  // file inputs
  const importTextInputRef = useRef(null);
  const importProjectInputRef = useRef(null);

  const openSettings = () => {
    setTempMeta(project.meta || {});
    setShowSettings(true);
  };

  // ------------- SAVE TO FILE -------------
  const handleSaveToFile = () => {
    const data = getSerializableProject();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const fileName =
      (project.title ? project.title.replace(/[^\w\d\-]+/g, "_") : "scene-chunks") +
      ".scenechunks.json";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ------------- OPEN FILE (SCENE CHUNKS) -------------
  const handleOpenFileClick = () => {
    if (importProjectInputRef.current) {
      importProjectInputRef.current.value = "";
      importProjectInputRef.current.click();
    }
  };

  const handleProjectFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const ok = loadFromObject(json);
      if (!ok) {
        alert("That file didn't look like a Scene Chunks project.");
      }
    } catch (err) {
      console.warn("Could not load project file:", err);
      alert("Could not read that file.");
    }
  };

  // ------------- IMPORT TEXT (loose) -------------
  const handleImportTextClick = () => {
    if (importTextInputRef.current) {
      importTextInputRef.current.value = "";
      importTextInputRef.current.click();
    }
  };

  const handleTextFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importFromText(text);
  };

  const handleNewProject = () => {
    const ok = window.confirm(
      "Start a new project? Unsaved changes will be lost (unless you saved a file)."
    );
    if (!ok) return;
    createNewProject();
  };

  return (
    <>
      <div
        style={{
          padding: "6px 12px",
          background: "linear-gradient(90deg, #1f2833, #0b0c10)",
          color: "#fff",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          height: "42px",
        }}
      >
        {/* LEFT: app + project name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontWeight: 700, letterSpacing: "0.04em" }}>
            🎬 Scene Chunks
          </div>

          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            Project:
          </div>

          {isEditingTitle ? (
            <input
              autoFocus
              value={project.title}
              onChange={(e) => updateProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingTitle(false);
              }}
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                borderRadius: "4px",
                fontSize: "13px",
                padding: "2px 6px",
                minWidth: "180px",
              }}
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#0f0",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
              title="Click to rename project"
            >
              {project.title}
            </button>
          )}
        </div>

        {/* RIGHT: buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* 👇 NEW PROJECT */}
          <button
            onClick={handleNewProject}
            style={headerBtnStyle("#5e9af4ff")}
            title="Start a blank project"
          >
            🆕 Blank Project
          </button>    

                    {/* file-open */}
          <button
            onClick={handleOpenFileClick}
            style={headerBtnStyle("#fff")}
            title="Open a .scenechunks.json file"
          >
            📁 Open File
          </button>
          <input
            ref={importProjectInputRef}
            type="file"
            accept=".json,.scenechunks.json"
            style={{ display: "none" }}
            onChange={handleProjectFileSelected}
          />



          {/* file-save */}
          <button
            onClick={handleSaveToFile}
            style={headerBtnStyle("#fff")}
            title="Download a .scenechunks.json file you can move to another computer"
          >
            💾 Save File
          </button>

          {/* browser-save */}
          <button
            onClick={manualSave}
            style={headerBtnStyle("#41ff9d")}
            title="Save to this browser"
          >
            📦 Save in browser
          </button>

          {/* import loose text */}
          <button
            onClick={handleImportTextClick}
            style={headerBtnStyle("#ffd166")}
            title="Import plain text / md / fountain as a single scene"
          >
            ⬆ Import Script
          </button>
          <input
            ref={importTextInputRef}
            type="file"
            accept=".txt,.md,.rtf,.fountain"
            style={{ display: "none" }}
            onChange={handleTextFileSelected}
          />


        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 5000,
          }}
        >
          <div
            style={{
              background: "#161616",
              border: "1px solid #444",
              borderRadius: "8px",
              width: "360px",
              padding: "16px",
              color: "#fff",
              boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                Script / Title Page Settings
              </div>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <label style={labelStyle}>
              Author
              <input
                style={inputStyle}
                value={tempMeta.author || ""}
                onChange={(e) =>
                  setTempMeta((m) => ({ ...m, author: e.target.value }))
                }
              />
            </label>

            <label style={labelStyle}>
              Email / Contact
              <input
                style={inputStyle}
                value={tempMeta.email || ""}
                onChange={(e) =>
                  setTempMeta((m) => ({ ...m, email: e.target.value }))
                }
              />
            </label>

            <label style={labelStyle}>
              Company / Prod. Co.
              <input
                style={inputStyle}
                value={tempMeta.company || ""}
                onChange={(e) =>
                  setTempMeta((m) => ({ ...m, company: e.target.value }))
                }
              />
            </label>

            <label style={labelStyle}>
              Draft Date
              <input
                type="date"
                style={inputStyle}
                value={tempMeta.draftDate || ""}
                onChange={(e) =>
                  setTempMeta((m) => ({ ...m, draftDate: e.target.value }))
                }
              />
            </label>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={() => {
                  updateProjectMeta(tempMeta);
                  setShowSettings(false);
                }}
                style={{
                  flex: 1,
                  background: "#41ff9d",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  padding: "6px 0",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "4px",
                  padding: "6px 0",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const headerBtnStyle = (color = "#fff") => ({
  background: "rgba(0,0,0,0.2)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "4px",
  color,
  fontSize: "12px",
  padding: "3px 10px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
});

const labelStyle = {
  display: "block",
  fontSize: "11px",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "12px",
  padding: "4px 6px",
  marginTop: "3px",
};
