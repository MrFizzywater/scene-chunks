"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";

// ⬇️ add this import (adjust path if yours is different)
import CharacterPanel from "./CharacterPanel";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function normalizeCharName(name) {
  if (typeof name !== "string") return "";
  return name.replace(/\s*\([^)]*\)\s*$/i, "").trim();
}

function getSceneCharactersFromChunk(chunk) {
  if (!chunk) return [];
  const set = new Set();

  // explicit
  if (Array.isArray(chunk.characters)) {
    chunk.characters.forEach((c) => {
      const norm = normalizeCharName(c);
      if (norm) set.add(norm);
    });
  }

  // dialogue
  if (Array.isArray(chunk.body)) {
    chunk.body.forEach((b) => {
      if (!b) return;
      if (b.type === "dialogueBlock" && b.character) {
        const norm = normalizeCharName(b.character);
        if (norm) set.add(norm);
      }
      if (b.type === "dualDialogue") {
        if (b.left?.character) {
          const norm = normalizeCharName(b.left.character);
          if (norm) set.add(norm);
        }
        if (b.right?.character) {
          const norm = normalizeCharName(b.right.character);
          if (norm) set.add(norm);
        }
      }
    });
  }

  return Array.from(set);
}

/* ---------------------------------------------------
   helpers
--------------------------------------------------- */
function formatBeatLabel(id) {
  switch (id) {
    case "opening-image":
      return "Opening Image";
    case "inciting-incident":
      return "Inciting Incident";
    case "break-into-2":
      return "Break into 2";
    case "midpoint":
      return "Midpoint";
    case "break-into-3":
      return "Break into 3";
    case "climax":
      return "Climax";
    case "final-image":
      return "Final Image";
    default:
      return id || "";
  }
}

function colorForBeat(id) {
  switch (id) {
    case "opening-image":
      return "linear-gradient(180deg, #45f, #78a7ff)";
    case "inciting-incident":
      return "linear-gradient(180deg, #ff7a4a, #ffb88a)";
    case "break-into-2":
      return "linear-gradient(180deg, #ff3f72, #ff96c2)";
    case "midpoint":
      return "linear-gradient(180deg, #ffd13b, #ffeaa0)";
    case "break-into-3":
      return "linear-gradient(180deg, #61e294, #a9ffce)";
    case "climax":
      return "linear-gradient(180deg, #ff375f, #ff7d97)";
    case "final-image":
      return "linear-gradient(180deg, #53cde2, #9be6f3)";
    default:
      return "linear-gradient(180deg, #292929, #111)";
  }
}

// ghost add button
function AddSceneButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "transparent",
        border: "1px dashed #333",
        borderRadius: "3px",
        padding: "3px 6px",
        margin: "3px 0",
        cursor: "pointer",
        textAlign: "center",
        color: "#555",
        fontSize: "10px",
        fontFamily: "monospace",
        opacity: 0.2,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.2")}
      title={label}
    >
      +
    </button>
  );
}


/* ---------------------------------------------------
   Scene row
--------------------------------------------------- */

const CUSTOM_TAG_OPTIONS = [
  { label: "None", value: "", color: "linear-gradient(180deg,#222,#111)" },
  { label: "Plot A", value: "Plot A", color: "linear-gradient(180deg,#ff9c4a,#ffbc7d)" },
  { label: "Plot B", value: "Plot B", color: "linear-gradient(180deg,#8a7dff,#c0b8ff)" },
  { label: "Plot C", value: "Plot C", color: "linear-gradient(180deg,#ff6fa9,#ffb6d1)" },
  { label: "Runner", value: "Runner", color: "linear-gradient(180deg,#3ccfa9,#9ef0d3)" },
  { label: "Alt", value: "Alt", color: "linear-gradient(180deg,#ffd94f,#ffeea7)" },
];

function SortableChunkRow({
  id,
  index,
  chunk,
  isSelected,
  onSelect,
  onDeleteScene,
  onUpdateTag,
}) {
  const locked = !!chunk.locked;
  const beatColor = colorForBeat(chunk.anchorRole);
  const customColor =
    chunk.customTagColor || "linear-gradient(180deg,#222,#111)";

  const [showTagMenu, setShowTagMenu] = useState(false);
  const sceneChars = getSceneCharactersFromChunk(chunk);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: locked,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        gap: "4px",
        marginBottom: "4px",
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {/* structure/beat colour bar (existing) */}
      <div
        style={{
          width: "8px",
          borderRadius: "4px",
          background: beatColor,
          opacity: chunk.anchorRole ? 1 : 0.35,
        }}
      ></div>

      {/* actual card */}
      <div
        style={{
          flex: 1,
          cursor: locked ? "not-allowed" : "grab",
          padding: "6px 8px",
          borderRadius: "4px",
          background: isSelected
            ? "#3f0850ff"
            : locked
            ? "rgba(180, 166, 60, 0.15)"
            : "#1a1a1a",
          border: isSelected
            ? "1px solid #d312e8ff"
            : locked
            ? "1px solid rgba(220,180,90,0.4)"
            : "1px solid transparent",
          color: "#fff",
          boxShadow: isDragging ? "0 4px 10px rgba(0,0,0,0.6)" : "none",
          fontSize: "13px",
          lineHeight: "1.4em",
          position: "relative",
        }}
        {...attributes}
        {...(locked ? {} : listeners)}
        onClick={() => onSelect(id)}
      >
        {/* top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "6px",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: "bold", flex: 1 }}>
            {index + 1}. {chunk.title || "(UNTITLED SCENE)"}
          </div>

          {/* small tag pill */}
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTagMenu((s) => !s);
              }}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "3px",
                color: "#fff",
                fontSize: "10px",
                fontFamily: "monospace",
                padding: "0 4px",
                cursor: "pointer",
              }}
              title="Set custom track / colour"
            >
              {chunk.customTagLabel ? chunk.customTagLabel : "tag"}
            </button>

            {showTagMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "110%",
                  background: "#000",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  zIndex: 999,
                  minWidth: "120px",
                  overflow: "hidden",
                }}
              >
                {CUSTOM_TAG_OPTIONS.map((opt) => (
                  <div
                    key={opt.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 6px",
                      fontSize: "11px",
                      cursor: "pointer",
                      background:
                        chunk.customTagLabel === opt.value
                          ? "rgba(255,255,255,0.08)"
                          : "transparent",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onUpdateTag(id, opt.value, opt.color);
                      setShowTagMenu(false);
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "18px",
                        borderRadius: "2px",
                        background: opt.color,
                      }}
                    ></span>
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {locked ? (
            <span title="locked to structure" style={{ fontSize: "12px" }}>
              🔒
            </span>
          ) : null}

          <button
            style={{
              background: "rgba(0,0,0,0.7)",
              color: "#f66",
              border: "1px solid #700",
              borderRadius: "3px",
              fontSize: "10px",
              lineHeight: 1,
              fontFamily: "monospace",
              cursor: "pointer",
              padding: "2px 4px",
            }}
            title="Delete (to trash)"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteScene(id, chunk, index);
            }}
          >
            🗑
          </button>
        </div>

        {/* characters */}
        {sceneChars.length > 0 ? (
          <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>
            {sceneChars.join(", ")}
          </div>
        ) : null}

        {/* beat */}
        {chunk.anchorRole ? (
          <div style={{ fontSize: "10px", color: "#777", marginTop: "2px" }}>
            {formatBeatLabel(chunk.anchorRole)}
          </div>
        ) : null}
      </div>
      {/* custom tag colour bar (new) */}
      <div
        style={{
          width: "8px",
          borderRadius: "4px",
          background: customColor,
          opacity: 1,
        }}
      ></div>
    </div>
  );
}

/* ---------------------------------------------------
   MAIN SIDEBAR - THE COMPONENT
   (now supports Character Panel)
--------------------------------------------------- */
export default function ChunkListSidebar({
  db,
  userId,
  appId = "scene-chunks",
}) {
  const {
    project,
    updateProjectTitle,
    updateProjectMeta,
    getActiveScript,
    chunksById,
    selectedChunkId,
    selectChunk,
    reorderChunks,
    insertChunkAfter,
    addChunk,
    removeChunk,
    deletedScenes = [],
    restoreChunkFromTrash,
    purgeDeletedChunk,
    updateChunk,
  } = useProject();

  const [showDeleted, setShowDeleted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [editProject, setEditProject] = useState(false);

  // ⬇️ new state for character panel
  const { openCharacterPanel, openCrewPanel, openPropsPanel } = useProject();

  useEffect(() => setIsClient(true), []);

  const script = getActiveScript();
  const order = script?.chunkOrder || [];

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const activeChunk = chunksById[active.id];
    const overChunk = chunksById[over.id];

    if (activeChunk?.locked || overChunk?.locked) return;

    const newOrder = arrayMove(order, oldIndex, newIndex);
    reorderChunks(newOrder);
  };

  const items = useMemo(() => order, [order]);

  const handleAddAfter = (afterId) => {
    insertChunkAfter(afterId);
  };

  const handleAddAtTop = () => {
    if (order.length === 0) {
      addChunk();
      return;
    }
    insertChunkAfter(order[0]);
  };

  const handleDeleteScene = (id) => {
    removeChunk(id);
  };

  const handleUpdateTag = (sceneId, label, color) => {
    if (typeof updateChunk === "function") {
      updateChunk(sceneId, {
        customTagLabel: label,
        customTagColor: color,
      });
    }
  };

  // project meta — safe defaults
  const meta = project?.meta || {};
  const title = project?.title || "Untitled Project";

  return (
    <div
      style={{
        width: "320px",
        borderRight: "1px solid #444",
        background: "#111",
        color: "#ddd",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        minHeight: 0,
        position: "relative",
        zIndex: 15,
      }}
    >
      {/* top project card (always present) */}
      <div
        style={{
          padding: "10px",
          borderBottom: "1px solid #333",
          background: "#181818",
        }}
      >
        {!editProject ? (
          <>
            <div style={{ fontSize: "11px", color: "#777" }}>PROJECT</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                marginTop: "2px",
                marginBottom: "4px",
              }}
            >
              {title}
            </div>
            {meta.author ? (
              <div style={{ fontSize: "11px", color: "#aaa" }}>
                by {meta.author}
              </div>
            ) : null}
            <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
              {meta.draft ? `Draft: ${meta.draft}` : "Draft: —"}
            </div>
            {meta.contact ? (
              <div style={{ fontSize: "10px", color: "#666" }}>
                {meta.contact}
              </div>
            ) : null}

            <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
              <button
                onClick={() => setEditProject(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #444",
                  borderRadius: "3px",
                  color: "#fff",
                  fontSize: "10px",
                  padding: "2px 6px",
                  cursor: "pointer",
                }}
              >
                Edit details
              </button>

              {/* ⬇️ new button */}
              <button
                onClick={openCharacterPanel}
                style={{
                  background: "linear-gradient(180deg,#f39a3b,#b96f2a)",
                  border: "1px solid rgba(255,179,90,0.5)",
                  borderRadius: "3px",
                  color: "#fff",
                  fontSize: "10px",
                  padding: "2px 6px",
                  cursor: "pointer",
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}
                title="Open character dossier for this project"
              >
                🧬 Characters
              </button>
              <button
                onClick={openCrewPanel}
                style={{
                  background: "linear-gradient(180deg,#3b9af3,#2a6fb9)",
                  border: "1px solid rgba(90,179,255,0.5)",
                  borderRadius: "3px",
                  color: "#fff",
                  fontSize: "10px",
                  padding: "2px 6px",
                  cursor: "pointer",
                }}
              >
                👷 Crew
              </button>

              <button
                onClick={openPropsPanel}
                style={{
                  background: "linear-gradient(180deg,#9a3bf3,#6f2ab9)",
                  border: "1px solid rgba(179,90,255,0.5)",
                  borderRadius: "3px",
                  color: "#fff",
                  fontSize: "10px",
                  padding: "2px 6px",
                  cursor: "pointer",
                }}
              >
                📦 Props
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: "11px", color: "#777" }}>
              EDIT PROJECT DETAILS
            </div>
            <input
              style={projInputStyle}
              value={title}
              onChange={(e) =>
                typeof updateProjectTitle === "function" &&
                updateProjectTitle(e.target.value)
              }
              placeholder="Project title"
            />
            <input
              style={projInputStyle}
              value={meta.author || ""}
              onChange={(e) =>
                typeof updateProjectMeta === "function" &&
                updateProjectMeta({ ...meta, author: e.target.value })
              }
              placeholder="Author"
            />
            <input
              style={projInputStyle}
              value={meta.draft || ""}
              onChange={(e) =>
                typeof updateProjectMeta === "function" &&
                updateProjectMeta({ ...meta, draft: e.target.value })
              }
              placeholder="Draft (e.g. v1, Blue rev.)"
            />
            <input
              style={projInputStyle}
              value={meta.contact || ""}
              onChange={(e) =>
                typeof updateProjectMeta === "function" &&
                updateProjectMeta({ ...meta, contact: e.target.value })
              }
              placeholder="Contact info"
            />
            <div style={{ marginTop: "6px", display: "flex", gap: "4px" }}>
              <button
                onClick={() => setEditProject(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #444",
                  borderRadius: "3px",
                  color: "#fff",
                  fontSize: "10px",
                  padding: "2px 6px",
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>

      {/* scenes header */}
      <div
        style={{
          padding: "8px",
          borderBottom: "1px solid #444",
          fontSize: "11px",
          color: "#888",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span>SCENES</span>
        <span style={{ color: "#555", fontStyle: "italic" }}>
          (drag to reorder)
        </span>
      </div>

      {/* scrollable list */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "8px",
          paddingBottom: "120px",
        }}
      >
        <AddSceneButton label="Add Scene Here (Top)" onClick={handleAddAtTop} />

        {isClient ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              {items.map((id, idx) => {
                const chunk = chunksById[id];
                if (!chunk) return null;
                const isSelected = id === selectedChunkId;
                return (
                  <div key={id} style={{ marginBottom: "4px" }}>
                    <SortableChunkRow
                      id={id}
                      index={idx}
                      chunk={chunk}
                      isSelected={isSelected}
                      onSelect={selectChunk}
                      onDeleteScene={handleDeleteScene}
                      onUpdateTag={handleUpdateTag}
                    />
                    <AddSceneButton
                      label="Add Scene After"
                      onClick={() => handleAddAfter(id)}
                    />
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>
        ) : (
          items.map((id, idx) => {
            const chunk = chunksById[id];
            if (!chunk) return null;
            const isSelected = id === selectedChunkId;
            return (
              <div key={id} style={{ marginBottom: "4px" }}>
                <SortableChunkRow
                  id={id}
                  index={idx}
                  chunk={chunk}
                  isSelected={isSelected}
                  onSelect={selectChunk}
                  onDeleteScene={handleDeleteScene}
                  onUpdateTag={handleUpdateTag}
                />
                <AddSceneButton
                  label="Add Scene After"
                  onClick={() => handleAddAfter(id)}
                />
              </div>
            );
          })
        )}

        {items.length > 0 ? (
          <AddSceneButton label="Add Scene At End" onClick={addChunk} />
        ) : null}
      </div>

      {/* trash drawer */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          background: "#0c0c0c",
          borderTop: "1px solid #333",
          padding: "6px 8px",
        }}
      >
        <button
          onClick={() => setShowDeleted((s) => !s)}
          style={{
            width: "100%",
            background: "rgba(200,30,30,0.08)",
            border: "1px solid rgba(255,80,80,0.3)",
            borderRadius: "4px",
            color: "#fff",
            fontSize: "11px",
            fontFamily: "monospace",
            textAlign: "left",
            padding: "4px 6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span>🗑 Deleted ({deletedScenes?.length || 0})</span>
          <span style={{ opacity: 0.6 }}>{showDeleted ? "▾" : "▸"}</span>
        </button>

        {showDeleted && (
          <div
            style={{
              marginTop: "6px",
              maxHeight: "150px",
              overflowY: "auto",
              border: "1px solid #222",
              borderRadius: "4px",
            }}
          >
            {(deletedScenes || []).length === 0 ? (
              <div
                style={{
                  fontSize: "11px",
                  color: "#666",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                (nothing here)
              </div>
            ) : (
              deletedScenes.map((item, idx) => {
                const scene = item.scene || item.chunk || item;
                const key = item.id || scene?.id || `trash-${idx}`;
                return (
                  <div
                    key={key}
                    style={{
                      padding: "6px 6px 8px",
                      borderBottom: "1px solid #111",
                      fontSize: "11px",
                      color: "#ddd",
                      background: "rgba(0,0,0,0.35)",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>
                      {scene?.title || "(untitled)"}{" "}
                      {scene?.anchorRole
                        ? "· " + formatBeatLabel(scene.anchorRole)
                        : ""}
                    </div>
                    <div
                      style={{ marginTop: "4px", display: "flex", gap: "6px" }}
                    >
                      <button
                        style={smallBtn("#b7f3b7")}
                        onClick={() => {
                          if (typeof restoreChunkFromTrash === "function") {
                            restoreChunkFromTrash(item.id || idx);
                          }
                        }}
                      >
                        Restore
                      </button>
                      {typeof purgeDeletedChunk === "function" ? (
                        <button
                          style={smallBtn("#f6b3b3")}
                          onClick={() => purgeDeletedChunk(item.id || idx)}
                        >
                          Delete forever
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>



    </div>
  );
}

const projInputStyle = {
  width: "100%",
  background: "#000",
  border: "1px solid #444",
  color: "#fff",
  padding: "4px 6px",
  borderRadius: "3px",
  fontSize: "11px",
  marginTop: "4px",
};

function smallBtn(color) {
  return {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "3px",
    color,
    fontSize: "10px",
    padding: "2px 6px",
    cursor: "pointer",
  };
}
