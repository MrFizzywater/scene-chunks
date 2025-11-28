"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useProject } from "../context/ProjectContext";
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

/* ---------------------------------------------------
   HELPERS
--------------------------------------------------- */
function normalizeCharName(name) {
  if (typeof name !== "string") return "";
  return name.replace(/\s*\([^)]*\)\s*$/i, "").trim();
}

function getSceneCharactersFromChunk(chunk) {
  if (!chunk) return [];
  const set = new Set();
  if (Array.isArray(chunk.characters)) {
    chunk.characters.forEach((c) => {
      const norm = normalizeCharName(c);
      if (norm) set.add(norm);
    });
  }
  if (Array.isArray(chunk.body)) {
    chunk.body.forEach((b) => {
      if (!b) return;
      if (b.type === "dialogueBlock" && b.character) {
        const norm = normalizeCharName(b.character);
        if (norm) set.add(norm);
      }
      if (b.type === "dualDialogue") {
        if (b.left?.character) set.add(normalizeCharName(b.left.character));
        if (b.right?.character) set.add(normalizeCharName(b.right.character));
      }
    });
  }
  return Array.from(set);
}

function formatBeatLabel(id) {
  switch (id) {
    case "opening-image": return "Opening Image";
    case "inciting-incident": return "Inciting Incident";
    case "break-into-2": return "Break into 2 (Act 1 End)";
    case "midpoint": return "Midpoint";
    case "break-into-3": return "Break into 3 (Act 2 End)";
    case "climax": return "Climax";
    case "final-image": return "Final Image";
    default: return id || "";
  }
}

function colorForBeat(id) {
  switch (id) {
    case "opening-image": return "#45f";
    case "inciting-incident": return "#ff7a4a";
    case "break-into-2": return "#ff3f72";
    case "midpoint": return "#ffd13b";
    case "break-into-3": return "#61e294";
    case "climax": return "#ff375f";
    case "final-image": return "#53cde2";
    default: return "#333";
  }
}

const PLOT_OPTIONS = [
  { label: "Plot A", value: "Plot A", color: "#ff9c4a" },
  { label: "Plot B", value: "Plot B", color: "#8a7dff" },
  { label: "Plot C", value: "Plot C", color: "#ff6fa9" },
  { label: "Runner", value: "Runner", color: "#3ccfa9" },
  { label: "Alt", value: "Alt", color: "#ffd94f" },
  { label: "Setup", value: "Setup", color: "#555" }, 
  { label: "Payoff", value: "Payoff", color: "#fff" },
];

function getColorsForTracks(tracks = []) {
  if (!tracks || tracks.length === 0) return ["#1a1a1a"];
  return tracks.map(t => {
    const opt = PLOT_OPTIONS.find(o => o.value === t);
    return opt ? opt.color : "#444";
  });
}

function ActHeader({ label, isCollapsed, onToggle, sceneCount }) {
  return (
    <div 
      onClick={onToggle}
      style={{
        padding: "8px 6px", 
        fontSize: "11px", 
        fontWeight: "bold", 
        color: isCollapsed ? "#888" : "#ccc", 
        background: isCollapsed ? "#111" : "linear-gradient(90deg, #1a1a1a 0%, #0e0e0e 100%)",
        borderBottom: "1px solid #333",
        borderTop: "1px solid #222",
        marginBottom: "8px",
        marginTop: "8px",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        userSelect: "none"
      }}
    >
      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
        <span style={{fontSize:'10px', width:'12px'}}>{isCollapsed ? "▶" : "▼"}</span>
        <span>{label}</span>
      </div>
      <span style={{fontSize:'10px', color:'#555', fontWeight:'normal'}}>
        {sceneCount} scene{sceneCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

function AddSceneButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "transparent",
        border: "1px dashed #333",
        borderRadius: "3px",
        padding: "4px",
        margin: "2px 0",
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
    >
      + {label}
    </button>
  );
}

/* ---------------------------------------------------
   SCENE ROW COMPONENT
--------------------------------------------------- */
function SortableChunkRow({
  id,
  index,
  chunk,
  isSelected,
  onSelect,
  onDeleteScene,
  onUpdateTracks,
}) {
  const locked = !!chunk.locked;
  const beatColor = colorForBeat(chunk.anchorRole);
  
  const currentTracks = Array.isArray(chunk.plotTracks) 
    ? chunk.plotTracks 
    : chunk.customTagLabel ? [chunk.customTagLabel] : [];

  const trackColors = getColorsForTracks(currentTracks);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const sceneChars = getSceneCharactersFromChunk(chunk);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: locked });

  const toggleTrack = (val) => {
    let newTracks = [...currentTracks];
    if (newTracks.includes(val)) newTracks = newTracks.filter(t => t !== val);
    else newTracks.push(val);
    onUpdateTracks(id, newTracks);
  };

  // AUTO-SCROLL REF
  // We attach a ref to the DOM element if it is selected
  const rowRef = useRef(null);
  
  useEffect(() => {
    if (isSelected && rowRef.current) {
      // Scroll into view with a little padding
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  // Merge refs (dnd-kit needs one, we need one for scrolling)
  // A simple way is to just put the ref on the inner div or wrap it
  // But dnd-kit's setNodeRef is a function. Let's just use a wrapper div for dnd 
  // and put our ref on the inner visible card.

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        gap: "4px",
        marginBottom: "6px",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...(locked ? {} : listeners)}
    >
      <div style={{ width: "6px", borderRadius: "4px", background: chunk.anchorRole ? beatColor : "transparent", opacity: chunk.anchorRole ? 1 : 0 }} />

      <div
        ref={rowRef} // Attach scroll ref here
        style={{
          flex: 1,
          cursor: locked ? "not-allowed" : "grab",
          padding: "8px",
          borderRadius: "6px",
          background: isSelected ? "#3f0850" : locked ? "rgba(180, 166, 60, 0.1)" : "#1a1a1a",
          border: isSelected ? "1px solid #d312e8" : locked ? "1px solid rgba(220,180,90,0.3)" : "1px solid #333",
          color: "#fff",
          boxShadow: isDragging ? "0 8px 20px rgba(0,0,0,0.8)" : "none",
          fontSize: "13px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}
        onClick={() => onSelect(id)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ fontWeight: "600", flex: 1, lineHeight: "1.3" }}>
            <span style={{color: "#555", marginRight: "6px", fontSize: "11px"}}>#{index + 1}</span>
            {chunk.title || "(UNTITLED SCENE)"}
          </div>
          <div style={{display:'flex', gap:'4px', alignItems:'center'}}>
            {locked && <span title="Locked" style={{fontSize: "12px"}}>🔒</span>}
            <button style={{ background: "transparent", color: "#666", border: "none", cursor: "pointer", fontSize: "14px", padding: "0 2px" }} title="Delete Scene" onClick={(e) => { e.stopPropagation(); onDeleteScene(id, chunk, index); }}>×</button>
          </div>
        </div>

        {sceneChars.length > 0 && (
           <div style={{ fontSize: "11px", color: "#888", lineHeight:"1.2" }}>{sceneChars.join(", ")}</div>
        )}

        {chunk.anchorRole && (
          <div style={{ fontSize: "10px", color: beatColor, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "bold", marginTop: "2px" }}>
            {formatBeatLabel(chunk.anchorRole)}
          </div>
        )}

        <div style={{display:'flex', gap:'4px', flexWrap:'wrap', marginTop:'4px'}}>
            <div style={{ position: "relative" }}>
              <button onClick={(e) => { e.stopPropagation(); setShowTagMenu(!showTagMenu); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#aaa", fontSize: "9px", padding: "1px 6px", cursor: "pointer" }}>
                {currentTracks.length > 0 ? "Edit Plots" : "+ Plot"}
              </button>
              {showTagMenu && (
                <div style={{ position: "absolute", left: 0, top: "120%", background: "#111", border: "1px solid #444", borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: 999, minWidth: "140px", padding: "4px" }} onMouseDown={(e) => e.stopPropagation()}>
                  <div style={{fontSize:'10px', color:'#666', marginBottom:'4px', paddingLeft:'4px'}}>TOGGLE PLOTS</div>
                  {PLOT_OPTIONS.map((opt) => {
                    const isActive = currentTracks.includes(opt.value);
                    return (
                      <div key={opt.label} onClick={(e) => { e.stopPropagation(); toggleTrack(opt.value); }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", background: isActive ? "rgba(255,255,255,0.1)" : "transparent", borderRadius: "2px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: opt.color, border: isActive ? "1px solid white" : "none" }} />
                        <span style={{color: isActive ? "#fff" : "#888"}}>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {currentTracks.map(t => {
               const color = PLOT_OPTIONS.find(o => o.value === t)?.color || "#555";
               return <span key={t} style={{ fontSize:"9px", color: color, background: `${color}22`, border: `1px solid ${color}44`, padding: "1px 5px", borderRadius: "4px" }}>{t}</span>
            })}
        </div>
      </div>
      <div style={{ width: "6px", display: "flex", flexDirection: "column", gap: "1px" }}>
        {trackColors.map((c, i) => <div key={i} style={{ flex: 1, background: c, borderRadius: "2px", minHeight: "4px" }} />)}
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   MAIN SIDEBAR
--------------------------------------------------- */
export default function ChunkListSidebar({ db, userId, appId = "scene-chunks" }) {
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
    updateChunk,
    openCharacterPanel, openCrewPanel, openPropsPanel
  } = useProject();

  const [showDeleted, setShowDeleted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [editProject, setEditProject] = useState(false);
  
  const [collapsedActs, setCollapsedActs] = useState({
    ACT_1: false,
    ACT_2: false,
    ACT_3: false
  });

  useEffect(() => setIsClient(true), []);

  const script = getActiveScript();
  const order = script?.chunkOrder || [];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const activeChunk = chunksById[active.id];
    if (activeChunk?.locked) return; 
    reorderChunks(arrayMove(order, oldIndex, newIndex));
  };

  const items = useMemo(() => order, [order]);

  const handleUpdateTracks = (sceneId, newTracks) => {
    if (typeof updateChunk === "function") {
      updateChunk(sceneId, { plotTracks: newTracks });
    }
  };

  const toggleAct = (actKey) => {
    setCollapsedActs(prev => ({ ...prev, [actKey]: !prev[actKey] }));
  };

  let currentAct = "ACT_1";
  const sceneActMap = {}; 
  const actCounts = { ACT_1: 0, ACT_2: 0, ACT_3: 0 };

  order.forEach(id => {
    const chunk = chunksById[id];
    if(!chunk) return;
    if(chunk.anchorRole === "break-into-2") currentAct = "ACT_2";
    if(chunk.anchorRole === "break-into-3") currentAct = "ACT_3";
    sceneActMap[id] = currentAct;
    actCounts[currentAct]++;
  });

  const meta = project?.meta || {};
  const title = project?.title || "Untitled Project";

  return (
    <div style={{ width: "340px", borderRight: "1px solid #333", background: "#0e0e0e", color: "#ddd", display: "flex", flexDirection: "column", height: "100vh", zIndex: 15 }}>
      
      {/* HEADER */}
      <div style={{ padding: "12px", borderBottom: "1px solid #222", background: "#111" }}>
        {!editProject ? (
          <div>
            <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px", fontWeight: "bold" }}>PROJECT</div>
            <div style={{ fontWeight: "700", fontSize: "16px", margin: "4px 0", color: "#fff" }}>{title}</div>
            <div style={{display:'flex', gap:'6px', marginTop:'8px'}}>
               <button onClick={() => setEditProject(true)} style={btnStyle}>✎ Edit Info</button>
               <button onClick={openCharacterPanel} style={{...btnStyle, color:"#fb8"}}>🧬 Characters</button>
               <button onClick={openCrewPanel} style={{...btnStyle, color:"#8bf"}}>👷 Crew</button>
               <button onClick={openPropsPanel} style={{...btnStyle, color:"#d8f"}}>📦 Props</button>
            </div>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
            <input style={inputStyle} value={title} onChange={e => updateProjectTitle(e.target.value)} placeholder="Title" />
            <input style={inputStyle} value={meta.author || ""} onChange={e => updateProjectMeta({author:e.target.value})} placeholder="Author" />
            <button onClick={() => setEditProject(false)} style={btnStyle}>Done</button>
          </div>
        )}
      </div>

      {/* SCENE LIST */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px", paddingBottom: "100px" }}>
        <AddSceneButton label="New Scene at Top" onClick={() => insertChunkAfter(null)} />

        {isClient ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map((id, idx) => {
                const chunk = chunksById[id];
                if (!chunk) return null;

                let headerToRender = null;
                let actKeyForHeader = null;

                if (idx === 0) {
                    headerToRender = "ACT 1";
                    actKeyForHeader = "ACT_1";
                }
                if (chunk.anchorRole === "break-into-2") {
                    headerToRender = "ACT 2";
                    actKeyForHeader = "ACT_2";
                }
                if (chunk.anchorRole === "break-into-3") {
                    headerToRender = "ACT 3";
                    actKeyForHeader = "ACT_3";
                }

                const myAct = sceneActMap[id];
                const isHidden = collapsedActs[myAct];

                return (
                  <React.Fragment key={id}>
                    {headerToRender && (
                      <ActHeader 
                        label={headerToRender} 
                        isCollapsed={collapsedActs[actKeyForHeader]} 
                        onToggle={() => toggleAct(actKeyForHeader)}
                        sceneCount={actCounts[actKeyForHeader]}
                      />
                    )}

                    {!isHidden && (
                      <div style={{ marginBottom: "0px" }}>
                        <SortableChunkRow
                          id={id}
                          index={idx}
                          chunk={chunk}
                          isSelected={id === selectedChunkId}
                          onSelect={selectChunk}
                          onDeleteScene={removeChunk}
                          onUpdateTracks={handleUpdateTracks}
                        />
                        <AddSceneButton label="Scene" onClick={() => insertChunkAfter(id)} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </SortableContext>
          </DndContext>
        ) : null}
      </div>

      {/* TRASH FOOTER */}
      <div style={{ borderTop: "1px solid #333", background: "#0c0c0c", padding: "8px" }}>
          <button onClick={() => setShowDeleted(!showDeleted)} style={{...btnStyle, width:"100%", justifyContent:"space-between", display:"flex"}}>
             <span>🗑 Deleted Scenes ({deletedScenes.length})</span>
             <span>{showDeleted ? "▼" : "▲"}</span>
          </button>
          {showDeleted && deletedScenes.length > 0 && (
            <div style={{ maxHeight:"120px", overflowY:"auto", marginTop:"8px", background:"#111", border:"1px solid #333", borderRadius:"4px" }}>
               {deletedScenes.map((item, i) => (
                  <div key={i} style={{padding:"6px", borderBottom:"1px solid #222", fontSize:"10px", display:"flex", justifyContent:"space-between"}}>
                     <span style={{color:"#888"}}>{item.scene?.title || "Untitled"}</span>
                     <button onClick={() => restoreChunkFromTrash(item.id || i)} style={{cursor:"pointer", color:"#6f6", background:"none", border:"none"}}>Restore</button>
                  </div>
               ))}
            </div>
          )}
      </div>
    </div>
  );
}

const btnStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#ccc",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "11px",
  cursor: "pointer",
};

const inputStyle = {
  background: "#000",
  border: "1px solid #333",
  color: "#fff",
  padding: "6px",
  borderRadius: "4px",
  fontSize: "12px"
};