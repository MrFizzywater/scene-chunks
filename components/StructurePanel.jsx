"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "../context/ProjectContext";
import {
  STRUCTURE_TEMPLATES,
  getTemplateById,
} from "./StructureTemplates";

const panelStyle = {
  position: "fixed",
  right: 0,
  top: "44px",
  bottom: 0,
  width: "320px",
  background: "rgba(14,14,14,0.95)",
  borderLeft: "1px solid rgba(255,255,255,0.03)",
  backdropFilter: "blur(12px)",
  zIndex: 99999,
  display: "flex",
  flexDirection: "column",
  color: "#fff",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const headerStyle = {
  padding: "14px 16px 8px",
  borderBottom: "1px solid rgba(255,255,255,0.03)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const sectionTitle = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.65,
  marginBottom: "6px",
};

export default function StructurePanel({ onClose }) {
  const {
    project,
    getActiveScript,
    updateProjectMeta,
    chunksById,
    selectChunk,
  } = useProject();

  const [hoverFilter, setHoverFilter] = useState(null); // "template" | "scene" | "inline" | null

  const activeScript = getActiveScript ? getActiveScript() : null;
  const selectedTemplateId = project?.meta?.structureTemplateId || "3-act";
  const template = getTemplateById(selectedTemplateId);
  const templateBeats = template?.beats || [];

  const sceneOrder =
    activeScript && Array.isArray(activeScript.chunkOrder)
      ? activeScript.chunkOrder
      : [];

  // basic stats
  const { sceneCount, estimatedPages } = useMemo(() => {
    if (!sceneOrder.length) return { sceneCount: 0, estimatedPages: 0 };
    const estPages = sceneOrder.reduce((sum, id) => {
      const sc = chunksById[id];
      return sum + (sc?.estPageLength || 1);
    }, 0);
    return { sceneCount: sceneOrder.length, estimatedPages: estPages };
  }, [sceneOrder, chunksById]);

  // map template beats to nearest scene, like before
  const templateBeatsWithScene = useMemo(() => {
    if (!sceneCount) return templateBeats;
    return templateBeats.map((beat) => {
      const sceneIndex = Math.round(
        (beat.pct / 100) * Math.max(sceneCount - 1, 0)
      );
      return { ...beat, sceneIndex };
    });
  }, [sceneCount, templateBeats]);

  // find actual scene-level beats (scenes tagged with anchorRole)
  const sceneLevelBeats = useMemo(() => {
    if (!sceneOrder.length) return [];
    const out = [];
    sceneOrder.forEach((id, idx) => {
      const sc = chunksById[id];
      if (!sc) return;
      if (sc.anchorRole) {
        const tplBeat = templateBeats.find((b) => b.id === sc.anchorRole);
        out.push({
          kind: "scene",
          beatId: sc.anchorRole,
          sceneId: id,
          sceneIndex: idx,
          sceneTitle: sc.title || `Scene ${idx + 1}`,
          pct: tplBeat ? tplBeat.pct : null,
          label: tplBeat ? tplBeat.label : "(Tagged beat)",
        });
      }
    });
    return out;
  }, [sceneOrder, chunksById, templateBeats]);

  // find inline beats (blocks tagged in scene.body with sceneBeatId)
  const inlineBeats = useMemo(() => {
    if (!sceneOrder.length) return [];
    const out = [];
    sceneOrder.forEach((id, idx) => {
      const sc = chunksById[id];
      if (!sc || !Array.isArray(sc.body)) return;
      sc.body.forEach((block, blockIndex) => {
        if (!block || !block.sceneBeatId) return;
        const tplBeat = templateBeats.find((b) => b.id === block.sceneBeatId);
        out.push({
          kind: "inline",
          beatId: block.sceneBeatId,
          sceneId: id,
          sceneIndex: idx,
          sceneTitle: sc.title || `Scene ${idx + 1}`,
          blockIndex,
          pct: block.sceneBeatActualPct ?? tplBeat?.pct ?? null,
          label: tplBeat ? tplBeat.label : "(Inline beat)",
        });
      });
    });
    // optional sort by pct so they appear in order
    return out.sort((a, b) => {
      const pa = a.pct ?? 999;
      const pb = b.pct ?? 999;
      return pa - pb;
    });
  }, [sceneOrder, chunksById, templateBeats]);

  const handleSelectTemplate = (e) => {
    const id = e.target.value;
    updateProjectMeta({
      ...(project.meta || {}),
      structureTemplateId: id,
    });
  };

  const templateOptions = Object.values(STRUCTURE_TEMPLATES);

  const handleGoToScene = (sceneIndex) => {
    if (sceneIndex == null) return;
    if (!Array.isArray(sceneOrder) || sceneOrder.length === 0) return;
    if (sceneIndex < 0 || sceneIndex >= sceneOrder.length) return;
    const sceneId = sceneOrder[sceneIndex];
    if (!sceneId) return;
    selectChunk(sceneId);
  };

  // style helpers based on hoverFilter
  const isDimmed = (kind) =>
    hoverFilter && hoverFilter !== kind ? 0.3 : 1;

  return (
    <div style={panelStyle}>
      {/* header */}
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600 }}>Story Structure</div>
          <div style={{ fontSize: "10px", opacity: 0.5 }}>
            Template vs real beats
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "16px",
            lineHeight: 1,
            cursor: "pointer",
            opacity: 0.4,
          }}
        >
          ×
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 90px" }}>
        {/* template picker */}
        <div style={{ marginBottom: "14px" }}>
          <div style={sectionTitle}>template</div>
          <select
            value={selectedTemplateId}
            onChange={handleSelectTemplate}
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "11px",
              padding: "6px 8px",
              outline: "none",
            }}
          >
            {templateOptions.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.label}
              </option>
            ))}
          </select>
          <div style={{ fontSize: "9px", opacity: 0.35, marginTop: "4px" }}>
            Add templates to <code>StructureTemplates.js</code> → shows up here.
          </div>
        </div>

        {/* timeline */}
        <div style={{ marginBottom: "16px" }}>
          <div style={sectionTitle}>structure timeline</div>
          <div
            style={{
              position: "relative",
              height: "70px",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.02)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {/* acts background */}
            {template.acts?.map((zone) => (
              <div
                key={zone.label}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${zone.from}%`,
                  width: `${zone.to - zone.from}%`,
                  background: "rgba(255,255,255,0.01)",
                  borderRight: "1px solid rgba(255,255,255,0.02)",
                }}
                title={zone.label}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    left: "4px",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    opacity: 0.35,
                  }}
                >
                  {zone.label}
                </div>
              </div>
            ))}

            {/* template beats: subtle */}
            {templateBeatsWithScene.map((beat) => (
              <div
                key={`tpl-${beat.id}`}
                onClick={() => handleGoToScene(beat.sceneIndex)}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${beat.pct}%`,
                  width: "2px",
                  background: "rgba(255,255,255,0.28)",
                  cursor: "pointer",
                  opacity: isDimmed("template"),
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: "4px",
                    background: "rgba(14,14,14,0.9)",
                    padding: "2px 4px",
                    borderRadius: "3px",
                    fontSize: "8.5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {beat.label}
                </div>
              </div>
            ))}

            {/* scene-level beats: brighter amber */}
            {sceneLevelBeats.map((beat) => (
              <div
                key={`scene-${beat.sceneId}-${beat.beatId}`}
                onClick={() => handleGoToScene(beat.sceneIndex)}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${beat.pct ?? 0}%`,
                  width: "4px",
                  background: "rgba(255,185,96,1)",
                  cursor: "pointer",
                  boxShadow: "0 0 8px rgba(255,185,96,0.5)",
                  opacity: isDimmed("scene"),
                }}
                title={beat.label}
              ></div>
            ))}

            {/* inline beats: greenish */}
            {inlineBeats.map((beat, idx) => (
              <div
                key={`inline-${beat.sceneId}-${beat.beatId}-${idx}`}
                onClick={() => handleGoToScene(beat.sceneIndex)}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${beat.pct ?? 0}%`,
                  width: "3px",
                  background: "rgba(170,255,170,1)",
                  cursor: "pointer",
                  boxShadow: "0 0 8px rgba(170,255,170,0.5)",
                  opacity: isDimmed("inline"),
                }}
                title={`${beat.label} • ${beat.sceneTitle}`}
              ></div>
            ))}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.5, marginTop: "4px" }}>
            Click a marker to open the nearest scene.
          </div>
        </div>

        {/* suggested & actual beats list */}
        <div style={{ marginBottom: "16px" }}>
          <div style={sectionTitle}>beats in this draft</div>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.03)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            {/* 1) actual scene-level beats first */}
            {sceneLevelBeats.length > 0 ? (
              sceneLevelBeats.map((b) => (
                <div
                    key={`list-scene-${b.sceneId}-${b.beatId}`}
                    onClick={() => handleGoToScene(b.sceneIndex)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "6px",
                      padding: "6px 8px",
                      background: "rgba(255,187,102,0.04)",
                      borderBottom: "1px solid rgba(255,187,102,0.03)",
                      cursor: "pointer",
                      opacity: isDimmed("scene"),
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "11px" }}>
                        {b.label} <span style={{ opacity: 0.5 }}>(scene)</span>
                      </div>
                      <div style={{ fontSize: "9px", opacity: 0.5 }}>
                        Scene {b.sceneIndex + 1}: {b.sceneTitle}
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", opacity: 0.55 }}>
                      {b.pct != null ? `${b.pct}%` : "—"}
                    </div>
                  </div>
              ))
            ) : (
              <div
                style={{
                  padding: "6px 8px",
                  fontSize: "10px",
                  opacity: 0.4,
                }}
              >
                (no scenes are tagged to beats yet)
              </div>
            )}

            {/* 2) inline beats */}
            {inlineBeats.map((b, i) => (
              <div
                key={`list-inline-${b.sceneId}-${b.beatId}-${i}`}
                onClick={() => handleGoToScene(b.sceneIndex)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "6px",
                  padding: "6px 8px",
                  background: "rgba(182,255,182,0.02)",
                  borderBottom: "1px solid rgba(182,255,182,0.03)",
                  cursor: "pointer",
                  opacity: isDimmed("inline"),
                }}
              >
                <div>
                  <div style={{ fontSize: "11px" }}>
                    {b.label} <span style={{ opacity: 0.5 }}>(inline)</span>
                  </div>
                  <div style={{ fontSize: "9px", opacity: 0.5 }}>
                    Scene {b.sceneIndex + 1}: {b.sceneTitle}
                  </div>
                </div>
                <div style={{ fontSize: "10px", opacity: 0.55 }}>
                  {b.pct != null ? `${b.pct}%` : "—"}
                </div>
              </div>
            ))}

            {/* 3) template beats (still useful as holes) */}
            {templateBeatsWithScene.map((beat) => {
              const hasScene = sceneLevelBeats.some(
                (b) => b.beatId === beat.id
              );
              const hasInline = inlineBeats.some(
                (b) => b.beatId === beat.id
              );
              // if we already have a real one, still show, but lighter
              return (
                <div
                  key={`list-tpl-${beat.id}`}
                  onClick={() => handleGoToScene(beat.sceneIndex)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "6px",
                    padding: "6px 8px",
                    background: "rgba(255,255,255,0.01)",
                    borderBottom: "1px solid rgba(255,255,255,0.01)",
                    cursor: "pointer",
                    opacity: isDimmed("template") * (hasScene || hasInline ? 0.45 : 1),
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px" }}>{beat.label}</div>
                    <div style={{ fontSize: "9px", opacity: 0.5 }}>
                      around {beat.pct}%
                      {hasScene || hasInline ? " (covered)" : " (missing)"}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      opacity: 0.55,
                      textAlign: "right",
                    }}
                  >
                    scene{" "}
                    {beat.sceneIndex != null ? beat.sceneIndex + 1 : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* basic stats */}
        <div style={{ marginBottom: "16px" }}>
          <div style={sectionTitle}>script stats (local)</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "6px",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.02)",
                borderRadius: "6px",
                padding: "6px 8px",
              }}
            >
              <div style={{ fontSize: "9px", opacity: 0.6 }}>Scenes</div>
              <div style={{ fontSize: "14px" }}>{sceneCount}</div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.02)",
                borderRadius: "6px",
                padding: "6px 8px",
              }}
            >
              <div style={{ fontSize: "9px", opacity: 0.6 }}>Est. pages</div>
              <div style={{ fontSize: "14px" }}>{estimatedPages}</div>
            </div>
          </div>
          <div style={{ fontSize: "9px", opacity: 0.35, marginTop: "4px" }}>
            (rough estimate based on scenes)
          </div>
        </div>
      </div>

      {/* legend + close */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 14px 14px",
          borderTop: "1px solid rgba(255,255,255,0.03)",
          background: "rgba(12,12,12,0.9)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <LegendItem
            label="Template"
            color="rgba(255,255,255,0.6)"
            active={hoverFilter === "template"}
            onEnter={() => setHoverFilter("template")}
            onLeave={() => setHoverFilter(null)}
          />
          <LegendItem
            label="Scene-tagged"
            color="rgba(255,185,96,1)"
            active={hoverFilter === "scene"}
            onEnter={() => setHoverFilter("scene")}
            onLeave={() => setHoverFilter(null)}
          />
          <LegendItem
            label="Inline"
            color="rgba(170,255,170,1)"
            active={hoverFilter === "inline"}
            onEnter={() => setHoverFilter("inline")}
            onLeave={() => setHoverFilter(null)}
          />
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #ff5c5c 0%, #de1f1f 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            padding: "10px 0",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(255,0,0,0.25)",
          }}
        >
          CLOSE STRUCTURE PANEL
        </button>
      </div>
    </div>
  );
}

function LegendItem({ label, color, active, onEnter, onLeave }) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        cursor: "pointer",
        opacity: active ? 1 : 0.6,
      }}
    >
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "999px",
          background: color,
          boxShadow: active ? `0 0 6px ${color}` : "none",
        }}
      ></span>
      <span style={{ fontSize: "10px" }}>{label}</span>
    </div>
  );
}
