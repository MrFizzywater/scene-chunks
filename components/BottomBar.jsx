"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "../context/ProjectContext";
import { STRUCTURE_TEMPLATES, getTemplateById } from "./StructureTemplates";

export default function BottomBar({ onOpenPreview }) {
  const {
    getActiveScript,
    chunksById,
    addChunk,
    saveStatus,
    selectChunk,
    updateChunk,
    openWriterMode,
    project,
    selectedChunkId,
    updateProjectMeta,
  } = useProject();

  const [dragging, setDragging] = useState(null);
  const [activeInspector, setActiveInspector] = useState(null); // "anchored" | "off" | "missing" | null

  const selectedTemplateId = project?.meta?.structureTemplateId || "3-act";
  const template =
    getTemplateById(selectedTemplateId) ||
    STRUCTURE_TEMPLATES["3-act"] ||
    Object.values(STRUCTURE_TEMPLATES)[0];

  // build timeline + structure info
  const { sceneData, beatStatuses, totalPages } = useMemo(() => {
    const script = getActiveScript ? getActiveScript() : null;
    const order = script?.chunkOrder || project?.chunks || [];
    if (!order.length) {
      return { sceneData: [], beatStatuses: [], totalPages: 0 };
    }

    const lengths = order.map((id) => chunksById[id]?.estPageLength || 1);
    const total = lengths.reduce((a, b) => a + b, 0);

    let running = 0;
    const scenes = order.map((id, idx) => {
      const chunk = chunksById[id];
      const len = lengths[idx];
      const start = running;
      const end = running + len;
      running = end;
      const startPct = total ? (start / total) * 100 : 0;
      const endPct = total ? (end / total) * 100 : 0;
      const midPct = (startPct + endPct) / 2;
      return {
        id,
        title: chunk?.title || `Scene ${idx + 1}`,
        anchorRole: chunk?.anchorRole || null,
        startPct,
        endPct,
        midPct,
      };
    });

    // map template beats to "explicit" vs "missing"
    const beats = (template.beats || []).map((b) => {
      // explicit scene tagged with this beat?
      const explicit = scenes.find((s) => s.anchorRole === b.id);

      // nearest scene (for display)
      let nearest = null;
      if (scenes.length) {
        nearest = scenes.reduce((best, s) => {
          const d = Math.abs(s.midPct - b.pct);
          if (!best) return { ...s, diff: d };
          return d < best.diff ? { ...s, diff: d } : best;
        }, null);
      }

      if (explicit) {
        const diff = Math.abs(explicit.midPct - b.pct);
        const isOff = diff > 5; // tweak threshold
        return {
          ...b,
          hasExplicit: true,
          sceneId: explicit.id,
          sceneTitle: explicit.title,
          actualPct: explicit.midPct,
          diff,
          status: isOff ? "off" : "scene",
          nearestSceneId: nearest?.id || null,
          nearestPct: nearest?.midPct ?? null,
        };
      }

      return {
        ...b,
        hasExplicit: false,
        sceneId: null,
        sceneTitle: "",
        actualPct: null,
        diff: null,
        status: "gap",
        nearestSceneId: nearest?.id || null,
        nearestPct: nearest?.midPct ?? null,
      };
    });

    return { sceneData: scenes, beatStatuses: beats, totalPages: total };
  }, [getActiveScript, project, chunksById, template]);

  const selectedScene = selectedChunkId
    ? sceneData.find((s) => s.id === selectedChunkId)
    : null;

  // group for the chips
  const anchoredBeats = beatStatuses.filter(
    (b) => b.hasExplicit && b.status === "scene"
  );
  const offBeats = beatStatuses.filter(
    (b) => b.hasExplicit && b.status === "off"
  );
  const missingBeats = beatStatuses.filter((b) => !b.hasExplicit);

  const handleBeatMouseDown = (beat, e) => {
    e.preventDefault();
    setDragging({ id: beat.id, pct: beat.pct });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const pct = Math.min(Math.max((e.clientX / window.innerWidth) * 100, 0), 100);
    const closest =
      sceneData.length > 0
        ? sceneData.reduce((best, s) => {
            const d = Math.abs(s.midPct - pct);
            if (!best) return { ...s, diff: d };
            return d < best.diff ? { ...s, diff: d } : best;
          }, null)
        : null;
    setDragging({ ...dragging, pct, closest });
  };

  const handleMouseUp = () => {
    if (!dragging) return;
    if (dragging.closest) {
      // assign this beat to the nearest scene
      updateChunk(dragging.closest.id, { anchorRole: dragging.id });
      selectChunk(dragging.closest.id);
    }
    setDragging(null);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(7,7,7,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          zIndex: 9999,
          padding: "6px 10px 4px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          userSelect: dragging ? "none" : "auto",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* top row: controls + template */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            onClick={addChunk}
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(96,255,143,0.4)",
              color: "#eafff0",
              padding: "5px 10px",
              fontSize: "12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            + Scene
          </button>

          <div style={{ fontSize: "10px", color: "#999" }}>
            {totalPages ? `${Math.round(totalPages)} est. pages` : "No scenes"}
          </div>

          <div style={{ flex: 1 }} />

          {/* template selector lives here now */}
          <select
            value={selectedTemplateId}
            onChange={(e) =>
              updateProjectMeta({
                ...(project.meta || {}),
                structureTemplateId: e.target.value,
              })
            }
            style={{
              background: "#000",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "4px",
              padding: "3px 6px",
              fontSize: "11px",
              marginRight: "6px",
            }}
          >
            {Object.values(STRUCTURE_TEMPLATES).map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.label}
              </option>
            ))}
          </select>

          <div style={{ fontSize: "10px", color: "#666", minWidth: "90px" }}>
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "error"
              ? "⚠ Save error"
              : "Saved"}
          </div>

          <button
            onClick={openWriterMode}
            style={{
              background: "rgba(129, 13, 122, 0.5)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "#cdecff",
              padding: "5px 10px",
              fontSize: "12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Writer
          </button>
          <button
            onClick={onOpenPreview}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              padding: "5px 10px",
              fontSize: "12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Preview
          </button>
        </div>

        {/* status chips row */}
        <div style={{ display: "flex", gap: "6px", position: "relative" }}>
          <BeatChip
            label="Anchored"
            color="#00dfff"
            count={anchoredBeats.length}
            active={activeInspector === "anchored"}
            onClick={() =>
              setActiveInspector(
                activeInspector === "anchored" ? null : "anchored"
              )
            }
          />
          <BeatChip
            label="Off-target"
            color="#ffbb3d"
            count={offBeats.length}
            active={activeInspector === "off"}
            onClick={() =>
              setActiveInspector(activeInspector === "off" ? null : "off")
            }
          />
          <BeatChip
            label="Missing"
            color="#ff4e4e"
            count={missingBeats.length}
            active={activeInspector === "missing"}
            onClick={() =>
              setActiveInspector(activeInspector === "missing" ? null : "missing")
            }
          />

          {/* floating inspector */}
          {activeInspector && (
            <div
              style={{
                position: "absolute",
                bottom: "46px",
                right: 0,
                background: "rgba(0,0,0,0.95)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "6px",
                padding: "8px 10px",
                width: "280px",
                maxHeight: "180px",
                overflowY: "auto",
                zIndex: 12000,
              }}
            >
              <InspectorContent
                mode={activeInspector}
                anchoredBeats={anchoredBeats}
                offBeats={offBeats}
                missingBeats={missingBeats}
                onSelectScene={selectChunk}
              />
            </div>
          )}
        </div>

        {/* timeline row */}
        <div
          style={{
            position: "relative",
            height: "44px",
            background: "linear-gradient(90deg, #111 0%, #181818 100%)",
            borderRadius: "6px",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.36)",
            overflow: "hidden",
          }}
        >
          {/* scene blocks */}
          <div style={{ position: "absolute", inset: "5px 6px" }}>
            {sceneData.map((scene) => {
              const isSelected =
                selectedScene && selectedScene.id === scene.id;
              const hasBeat = !!scene.anchorRole;
              return (
                <div
                  key={scene.id}
                  onClick={() => selectChunk(scene.id)}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `calc(${scene.startPct}% + 2px)`,
                    width: `calc(${scene.endPct - scene.startPct}% - 2px)`,
                    background: isSelected
                      ? "rgba(141, 183, 255, 0.26)"
                      : hasBeat
                      ? "rgba(0,209,255,0.15)"
                      : "rgba(255,255,255,0.015)",
                    border: isSelected
                      ? "1px solid rgba(141, 183, 255, 0.6)"
                      : hasBeat
                      ? "1px solid rgba(0,209,255,0.35)"
                      : "1px solid rgba(255,255,255,0.01)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.1s ease-out",
                  }}
                  title={scene.title}
                ></div>
              );
            })}
          </div>

          {/* beat markers (draggable) */}
          <div style={{ position: "absolute", inset: 0 }}>
            {(template.beats || []).map((beat) => {
              const mapped =
                beatStatuses.find((b) => b.id === beat.id) || beat;
              const color = getBeatColor(mapped);
              return (
                <div
                  key={beat.id}
                  onMouseDown={(e) => handleBeatMouseDown(beat, e)}
                  onClick={() =>
                    mapped.sceneId ? selectChunk(mapped.sceneId) : null
                  }
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `calc(${beat.pct}% - 1px)`,
                    width: "2px",
                    background: color,
                    cursor: "grab",
                  }}
                  title={beat.label}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: "4px",
                      background: "rgba(0,0,0,0.85)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      fontSize: "9px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {beat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* drag helper */}
          {dragging?.closest && (
            <div
              style={{
                position: "absolute",
                bottom: "46px",
                left: `calc(${dragging.pct}% - 70px)`,
                background: "#000",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "4px",
                padding: "3px 6px",
                fontSize: "10px",
                whiteSpace: "nowrap",
              }}
            >
              Move beat → {dragging.closest.title}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- tiny components ---------- */

function BeatChip({ label, color, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        gap: "4px",
        alignItems: "center",
        background: active ? "rgba(255,255,255,0.04)" : "transparent",
        border: `1px solid ${color}33`,
        borderRadius: "999px",
        padding: "2px 10px 2px 6px",
        cursor: "pointer",
        fontSize: "10px",
        color: "#fff",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "999px",
          background: color,
        }}
      />
      <span>{label}</span>
      <span style={{ opacity: 0.6 }}>{count}</span>
    </button>
  );
}

function InspectorContent({
  mode,
  anchoredBeats,
  offBeats,
  missingBeats,
  onSelectScene,
}) {
  if (mode === "anchored") {
    return (
      <>
        <div style={{ fontSize: "10px", opacity: 0.6, marginBottom: "4px" }}>
          Beats you’ve actually placed.
        </div>
        {anchoredBeats.length === 0 ? (
          <div style={{ fontSize: "10px", opacity: 0.4 }}>
            Drag a beat onto a scene or set a beat on the scene.
          </div>
        ) : (
          anchoredBeats.map((b) => (
            <InspectorRow
              key={b.id}
              title={b.label}
              subtitle={b.sceneTitle}
              pct={b.pct}
              onClick={() => b.sceneId && onSelectScene(b.sceneId)}
              aiHint={`This lines up for ${b.label}. You can deepen it with a reaction or a consequence beat.`}
            />
          ))
        )}
      </>
    );
  }

  if (mode === "off") {
    return (
      <>
        <div style={{ fontSize: "10px", opacity: 0.6, marginBottom: "4px" }}>
          Tagged but not lining up — pad before it, or move the scene later.
        </div>
        {offBeats.length === 0 ? (
          <div style={{ fontSize: "10px", opacity: 0.4 }}>
            Looks good — no big drifts.
          </div>
        ) : (
          offBeats.map((b) => (
            <InspectorRow
              key={b.id}
              title={b.label}
              subtitle={b.sceneTitle}
              pct={b.pct}
              onClick={() => b.sceneId && onSelectScene(b.sceneId)}
              aiHint={`This is about ${Math.round(
                b.diff
              )}% off. Add a short scene before it or reassign to the later scene where the turn actually happens.`}
              color="#ffbb3d"
            />
          ))
        )}
      </>
    );
  }

  // missing
  return (
    <>
      <div style={{ fontSize: "10px", opacity: 0.6, marginBottom: "4px" }}>
        Template beats you haven’t placed yet.
      </div>
      {missingBeats.length === 0 ? (
        <div style={{ fontSize: "10px", opacity: 0.4 }}>
          All beats placed. You show-off.
        </div>
      ) : (
        missingBeats.map((b) => (
          <InspectorRow
            key={b.id}
            title={b.label}
            subtitle="— not placed —"
            pct={b.pct}
            aiHint={`This usually lands around ${b.pct}%. Find the moment where the story shifts in that way and tag that scene.`}
            color="#ff4e4e"
          />
        ))
      )}
    </>
  );
}

function InspectorRow({ title, subtitle, pct, onClick, aiHint, color = "#fff" }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        padding: "4px 0",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ fontSize: "10.5px" }}>{title}</div>
      <div style={{ fontSize: "9px", opacity: 0.5 }}>
        {subtitle} {pct != null ? `• ${pct}%` : ""}
      </div>
      {aiHint ? (
        <div
          style={{
            fontSize: "9px",
            opacity: 0.35,
            marginTop: "2px",
            color,
          }}
        >
          {aiHint}
        </div>
      ) : null}
    </div>
  );
}

function getBeatColor(mapped) {
  if (!mapped.hasExplicit) return "rgba(255,78,78,0.8)";
  if (mapped.status === "scene") return "rgba(0,219,255,1)";
  if (mapped.status === "off") return "rgba(255,187,61,1)";
  return "rgba(255,255,255,0.3)";
}
