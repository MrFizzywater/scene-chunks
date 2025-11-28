"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "../context/ProjectContext";
import { STRUCTURE_TEMPLATES, getTemplateById } from "./StructureTemplates";

// ⬇️ 1. Re-define colors here to match Sidebar
const PLOT_COLORS = {
  "Plot A": "#ff9c4a",
  "Plot B": "#8a7dff",
  "Plot C": "#ff6fa9",
  "Runner": "#3ccfa9",
  "Alt": "#ffd94f",
  "Setup": "#888",
  "Payoff": "#eee",
};

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
  const [activeInspector, setActiveInspector] = useState(null); 
  
  // ⬇️ 2. New state for hover tooltip
  const [hoveredScene, setHoveredScene] = useState(null); 
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

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
      
      // ⬇️ Extract Data for visualization
      const plots = chunk.plotTracks || (chunk.customTagLabel ? [chunk.customTagLabel] : []);
      // Quick char summary
      const chars = (chunk.characters || []).slice(0,3); 

      return {
        id,
        title: chunk?.title || `Scene ${idx + 1}`,
        anchorRole: chunk?.anchorRole || null,
        startPct,
        endPct,
        midPct,
        length: len,
        plots,
        chars
      };
    });

    // map template beats
    const beats = (template.beats || []).map((b) => {
      const explicit = scenes.find((s) => s.anchorRole === b.id);
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
        const isOff = diff > 5; 
        return {
          ...b,
          hasExplicit: true,
          sceneId: explicit.id,
          sceneTitle: explicit.title,
          actualPct: explicit.midPct,
          diff,
          status: isOff ? "off" : "scene",
        };
      }

      return {
        ...b,
        hasExplicit: false,
        status: "gap",
        nearestSceneId: nearest?.id || null,
      };
    });

    return { sceneData: scenes, beatStatuses: beats, totalPages: total };
  }, [getActiveScript, project, chunksById, template]);

  const selectedScene = selectedChunkId
    ? sceneData.find((s) => s.id === selectedChunkId)
    : null;

  const anchoredBeats = beatStatuses.filter((b) => b.hasExplicit && b.status === "scene");
  const offBeats = beatStatuses.filter((b) => b.hasExplicit && b.status === "off");
  const missingBeats = beatStatuses.filter((b) => !b.hasExplicit);

  const handleBeatMouseDown = (beat, e) => {
    e.preventDefault();
    setDragging({ id: beat.id, pct: beat.pct });
  };

  const handleMouseMove = (e) => {
    // Drag logic
    if (dragging) {
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
    }
  };

  const handleMouseUp = () => {
    if (!dragging) return;
    if (dragging.closest) {
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
        {/* TOP ROW: Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={addChunk}
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(96,255,143,0.4)",
              color: "#eafff0",
              padding: "4px 8px",
              fontSize: "11px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            + Scene
          </button>

          <div style={{ fontSize: "10px", color: "#999" }}>
            {totalPages ? `${totalPages.toFixed(1)} pages` : "0 pgs"}
          </div>

          <div style={{ flex: 1 }} />

          {/* Template Selector */}
          <select
            value={selectedTemplateId}
            onChange={(e) => updateProjectMeta({ ...(project.meta || {}), structureTemplateId: e.target.value })}
            style={{
              background: "#000",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "4px",
              padding: "2px 6px",
              fontSize: "10px",
              marginRight: "6px",
            }}
          >
            {Object.values(STRUCTURE_TEMPLATES).map((tpl) => (
              <option key={tpl.id} value={tpl.id}>{tpl.label}</option>
            ))}
          </select>

          <div style={{ fontSize: "10px", color: "#666", minWidth: "80px", textAlign:"right" }}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "⚠ Error" : "Saved"}
          </div>

          <button onClick={openWriterMode} style={{ background: "rgba(129, 13, 122, 0.5)", border: "1px solid rgba(255,255,255,0.05)", color: "#cdecff", padding: "4px 8px", fontSize: "11px", borderRadius: "4px", cursor: "pointer" }}>
            Writer
          </button>
          <button onClick={onOpenPreview} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "4px 8px", fontSize: "11px", borderRadius: "4px", cursor: "pointer" }}>
            Preview
          </button>
        </div>

        {/* STATUS CHIPS */}
        <div style={{ display: "flex", gap: "6px", position: "relative" }}>
          <BeatChip label="Anchored" color="#00dfff" count={anchoredBeats.length} active={activeInspector === "anchored"} onClick={() => setActiveInspector(activeInspector === "anchored" ? null : "anchored")} />
          <BeatChip label="Off-target" color="#ffbb3d" count={offBeats.length} active={activeInspector === "off"} onClick={() => setActiveInspector(activeInspector === "off" ? null : "off")} />
          <BeatChip label="Missing" color="#ff4e4e" count={missingBeats.length} active={activeInspector === "missing"} onClick={() => setActiveInspector(activeInspector === "missing" ? null : "missing")} />

          {activeInspector && (
            <div style={{ position: "absolute", bottom: "46px", right: 0, background: "#111", border: "1px solid #333", borderRadius: "6px", padding: "8px", width: "260px", maxHeight: "200px", overflowY: "auto", zIndex: 12000 }}>
              <InspectorContent mode={activeInspector} anchoredBeats={anchoredBeats} offBeats={offBeats} missingBeats={missingBeats} onSelectScene={selectChunk} />
            </div>
          )}
        </div>

        {/* ⬇️ TIMELINE ROW */}
        <div
          style={{
            position: "relative",
            height: "48px", // slightly taller for plot tracks
            background: "linear-gradient(90deg, #111 0%, #181818 100%)",
            borderRadius: "6px",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.36)",
            overflow: "hidden",
            marginTop: "2px"
          }}
          onMouseLeave={() => setHoveredScene(null)}
        >
          {/* SCENE BLOCKS */}
          <div style={{ position: "absolute", inset: "4px 6px" }}>
            {sceneData.map((scene) => {
              const isSelected = selectedScene && selectedScene.id === scene.id;
              const hasBeat = !!scene.anchorRole;
              
              return (
                <div
                  key={scene.id}
                  onClick={() => selectChunk(scene.id)}
                  onMouseEnter={(e) => {
                      setHoveredScene(scene);
                      setHoverPos({ x: e.clientX, y: -100 }); // Y is handled relative to bar
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `calc(${scene.startPct}% + 1px)`,
                    width: `calc(${scene.endPct - scene.startPct}% - 1px)`,
                    background: isSelected ? "rgba(141, 183, 255, 0.15)" : hasBeat ? "rgba(0,209,255,0.08)" : "rgba(255,255,255,0.02)",
                    border: isSelected ? "1px solid rgba(141, 183, 255, 0.6)" : hasBeat ? "1px solid rgba(0,209,255,0.3)" : "1px solid rgba(255,255,255,0.03)",
                    borderTop: isSelected ? "2px solid #8db7ff" : undefined,
                    borderRadius: "2px",
                    cursor: "pointer",
                    transition: "background 0.1s",
                    overflow: "hidden"
                  }}
                >
                    {/* ⬇️ RENDER PLOT TRACKS INSIDE BLOCK */}
                    <div style={{position:'absolute', bottom:0, left:0, right:0, display:'flex', flexDirection:'column-reverse', gap:'1px', padding:'1px'}}>
                        {scene.plots.map((p, i) => (
                            <div key={i} style={{ height: "3px", width: "100%", background: PLOT_COLORS[p] || "#666", borderRadius:"1px" }}></div>
                        ))}
                    </div>
                </div>
              );
            })}
          </div>

          {/* BEAT MARKERS */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {(template.beats || []).map((beat) => {
              const mapped = beatStatuses.find((b) => b.id === beat.id) || beat;
              const color = getBeatColor(mapped);
              return (
                <div
                  key={beat.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `calc(${beat.pct}% - 1px)`,
                    width: "1px",
                    background: color,
                    pointerEvents: "auto", // allow grab
                    cursor: "grab",
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handleBeatMouseDown(beat, e)}
                  title={beat.label}
                >
                  <div style={{
                      position: "absolute",
                      top: "2px",
                      left: "4px",
                      background: "rgba(0,0,0,0.85)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      fontSize: "9px",
                      whiteSpace: "nowrap",
                      color: mapped.hasExplicit ? color : "#888",
                      border: `1px solid ${mapped.hasExplicit ? color : "#444"}`
                    }}
                  >
                    {beat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DRAG HELPER */}
          {dragging?.closest && (
            <div
              style={{
                position: "absolute",
                bottom: "50px",
                left: `calc(${dragging.pct}% - 50px)`,
                background: "#000",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "10px",
                whiteSpace: "nowrap",
                zIndex: 20
              }}
            >
              Set "{dragging.id}" to {dragging.closest.title}
            </div>
          )}
        </div>
      </div>

      {/* ⬇️ RICH HOVER TOOLTIP (Portal-ish) */}
      {hoveredScene && !dragging && (
        <div style={{
            position: "fixed",
            bottom: "80px", // Fixed height above bar
            left: Math.min(Math.max(hoverPos.x - 80, 10), window.innerWidth - 180) + "px",
            width: "160px",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "6px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
            padding: "8px",
            zIndex: 10000,
            pointerEvents: "none"
        }}>
            <div style={{fontSize: "11px", fontWeight: "bold", color: "#fff", marginBottom:"4px", lineHeight:"1.2"}}>
                {hoveredScene.title}
            </div>
            <div style={{fontSize: "10px", color: "#666", marginBottom:"6px"}}>
                {hoveredScene.length} pages • {Math.round(hoveredScene.midPct)}%
            </div>
            
            {/* Characters */}
            {hoveredScene.chars.length > 0 && (
                <div style={{fontSize:"9px", color:"#aaa", marginBottom:"6px", lineHeight:"1.3"}}>
                    <span style={{color:"#555"}}>FEAT:</span> {hoveredScene.chars.join(", ")}
                </div>
            )}

            {/* Plots */}
            {hoveredScene.plots.length > 0 && (
                <div style={{display:'flex', gap:'2px', flexWrap:'wrap'}}>
                    {hoveredScene.plots.map(p => (
                        <span key={p} style={{fontSize:"8px", padding:"1px 3px", borderRadius:"2px", background: PLOT_COLORS[p] || "#444", color:"#000", fontWeight:"bold"}}>
                            {p}
                        </span>
                    ))}
                </div>
            )}
            
            {hoveredScene.anchorRole && (
                <div style={{marginTop:"6px", paddingTop:"4px", borderTop:"1px solid #222", fontSize:"9px", color:"#00dfff"}}>
                    ★ {hoveredScene.anchorRole.toUpperCase().replace(/-/g, " ")}
                </div>
            )}
        </div>
      )}
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
        background: active ? "rgba(255,255,255,0.06)" : "transparent",
        border: `1px solid ${color}33`,
        borderRadius: "999px",
        padding: "2px 8px 2px 4px",
        cursor: "pointer",
        fontSize: "10px",
        color: "#ccc",
        transition: "all 0.1s"
      }}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: color }} />
      <span>{label}</span>
      <span style={{ opacity: 0.5, marginLeft: "2px" }}>{count}</span>
    </button>
  );
}

function InspectorContent({ mode, anchoredBeats, offBeats, missingBeats, onSelectScene }) {
  if (mode === "anchored") {
    return (
      <>
        <div style={{ fontSize: "10px", opacity: 0.6, marginBottom: "4px" }}>Beats you have placed</div>
        {anchoredBeats.length === 0 ? <div style={{fontSize:"10px", opacity:0.3}}>(none)</div> : anchoredBeats.map(b => (
             <InspectorRow key={b.id} title={b.label} subtitle={b.sceneTitle} pct={b.pct} onClick={() => onSelectScene(b.sceneId)} />
        ))}
      </>
    );
  }
  if (mode === "off") {
    return (
      <>
        <div style={{ fontSize: "10px", opacity: 0.6, marginBottom: "4px" }}>Drifting beats (&gt;5% off)</div>
        {offBeats.length === 0 ? <div style={{fontSize:"10px", opacity:0.3}}>Everything looks tight!</div> : offBeats.map(b => (
             <InspectorRow key={b.id} title={b.label} subtitle={b.sceneTitle} pct={b.pct} onClick={() => onSelectScene(b.sceneId)} aiHint={`Off by ${Math.round(b.diff)}%`} color="#ffbb3d" />
        ))}
      </>
    );
  }
  return (
    <>
      <div style={{ fontSize: "10px", opacity: 0.6, marginBottom: "4px" }}>Missing beats</div>
      {missingBeats.length === 0 ? <div style={{fontSize:"10px", opacity:0.3}}>All done!</div> : missingBeats.map(b => (
           <InspectorRow key={b.id} title={b.label} subtitle="Not assigned" pct={b.pct} color="#ff4e4e" />
      ))}
    </>
  );
}

function InspectorRow({ title, subtitle, pct, onClick, aiHint, color = "#fff" }) {
  return (
    <div onClick={onClick} style={{ borderBottom: "1px solid #222", padding: "6px 0", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
         <span style={{ fontSize: "11px", color }}>{title}</span>
         <span style={{ fontSize: "10px", opacity: 0.5 }}>{pct}%</span>
      </div>
      <div style={{ fontSize: "10px", opacity: 0.5 }}>{subtitle}</div>
      {aiHint && <div style={{fontSize:"9px", color:"#d88", marginTop:"2px"}}>{aiHint}</div>}
    </div>
  );
}

function getBeatColor(mapped) {
  if (!mapped.hasExplicit) return "#ff4e4e";
  if (mapped.status === "scene") return "#00dfff";
  if (mapped.status === "off") return "#ffbb3d";
  return "#555";
}