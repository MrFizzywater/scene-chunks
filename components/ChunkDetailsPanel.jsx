"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useProject } from "../context/ProjectContext";
import { getTemplateById } from "./StructureTemplates";

/* ---------- helpers OUTSIDE so they don't mess with hooks ---------- */

function normalizeCharName(name) {
  if (typeof name !== "string") return "";
  return name.replace(/\s*\([^)]*\)\s*$/i, "").trim();
}

function getSceneCharacters(chunk) {
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

function estimateLinesFromText(text, charsPerLine = 65) {
  if (!text) return 0;
  const len = text.trim().length;
  if (len === 0) return 0;
  return Math.ceil(len / charsPerLine);
}

function estimatePageLengthFromChunk(chunk) {
  if (!chunk) return 0;
  const body = Array.isArray(chunk.body) ? chunk.body : [];
  let lines = 0;

  // scene heading
  lines += 1;

  body.forEach((block) => {
    if (!block) return;
    switch (block.type) {
      case "action": {
        lines += estimateLinesFromText(block.text, 65);
        lines += 1;
        break;
      }
      case "dialogueBlock": {
        if (block.character) lines += 1;
        if (block.parenthetical && block.parenthetical.trim() !== "") {
          lines += 1;
        }
        lines += estimateLinesFromText(block.dialogue, 40);
        lines += 1;
        break;
      }
      case "transition": {
        lines += 1;
        lines += 1;
        break;
      }
      case "dualDialogue": {
        // rougher estimate
        lines += 4;
        break;
      }
      default: {
        lines += estimateLinesFromText(block.text, 65);
        lines += 1;
      }
    }
  });

  const pages = lines / 55;
  return Math.round(pages * 10) / 10;
}

/* ---------------- actual component ---------------- */

export default function ChunkDetailsPanel() {
  const projectCtx = useProject();

  const {
    getCurrentChunk,
    updateChunk,
    toggleChunkLock,
    chunksById,
    getActiveScript,
    project,
    openCharacterPanel,
    openPropsPanel,
  } = projectCtx;

  // this can be null after deleting the current scene
  const chunk = getCurrentChunk ? getCurrentChunk() : null;

  // template stuff should NOT break when there's no chunk
  const selectedTemplateId = project?.meta?.structureTemplateId || "3-act";
  const currentTemplate = getTemplateById(selectedTemplateId);

  // local input state — always declared
  const [charactersInput, setCharactersInput] = useState("");
  const [propsInput, setPropsInput] = useState("");

  // hydrate inputs when chunk changes
  useEffect(() => {
    if (chunk) {
      setCharactersInput(
        Array.isArray(chunk.characters) ? chunk.characters.join(", ") : ""
      );
      setPropsInput(Array.isArray(chunk.props) ? chunk.props.join(", ") : "");
    } else {
      setCharactersInput("");
      setPropsInput("");
    }
  }, [chunk?.id]);

  // active script + order (safe if null)
  const activeScript = getActiveScript ? getActiveScript() : null;
  const sceneOrder =
    activeScript && Array.isArray(activeScript.chunkOrder)
      ? activeScript.chunkOrder
      : [];

  // estimate pages for THIS chunk (0 if none)
  const computedPages = useMemo(() => {
    if (!chunk) return 0;
    return estimatePageLengthFromChunk(chunk);
  }, [chunk]);

  // write it back if we do have a chunk
  useEffect(() => {
    if (!chunk) return;
    if (chunk.estPageLength !== computedPages) {
      updateChunk(chunk.id, { estPageLength: computedPages });
    }
  }, [chunk, computedPages, updateChunk]);

  // script-level metrics — always computed, even if chunk is null
  const scriptMetrics = useMemo(() => {
    if (!sceneOrder.length) {
      return {
        totalPages: 0,
        sceneIndex: -1,
        sceneStartPage: 0,
        scenePct: 0,
      };
    }

    const sceneData = sceneOrder.map((id) => {
      const sc = chunksById[id];
      return {
        id,
        pages: sc?.estPageLength || estimatePageLengthFromChunk(sc || {}),
      };
    });

    const totalPages = sceneData.reduce((sum, s) => sum + s.pages, 0);

    let running = 0;
    let sceneIndex = -1;
    let sceneStartPage = 0;

    sceneData.forEach((s, index) => {
      if (chunk && s.id === chunk.id) {
        sceneIndex = index;
        sceneStartPage = running;
      }
      running += s.pages;
    });

    const scenePct =
      totalPages > 0 ? Math.round((sceneStartPage / totalPages) * 100) : 0;

    return {
      totalPages,
      sceneIndex,
      sceneStartPage,
      scenePct,
    };
  }, [sceneOrder, chunksById, chunk]);

  // all props in project — always safe
  const allProps = useMemo(() => {
    if (!chunksById) return [];
    const set = new Set();
    Object.values(chunksById).forEach((sc) => {
      if (Array.isArray(sc?.props)) {
        sc.props.forEach((p) => {
          if (p && p.trim()) set.add(p.trim());
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [chunksById]);

  // if there's no selected chunk, render the "empty" panel
  if (!chunk) {
    return (
      <div
        style={{
          width: "300px",
          background: "transparent",
          color: "#ccc",
          fontSize: "13px",
          padding: "12px",
          overflowY: "auto",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        No chunk selected
      </div>
    );
  }

  // from here down, we KNOW we have a chunk
  const sceneChars = getSceneCharacters(chunk);

  const selectedBeatId = chunk.anchorRole || "";
  const selectedBeat =
    currentTemplate?.beats?.find((b) => b.id === selectedBeatId) || null;

  // try to find a more precise inline beat inside this scene's body
  const inlineBeat =
    chunk && Array.isArray(chunk.body) && selectedBeat
      ? chunk.body.find(
          (b) => b && b.sceneBeatId && b.sceneBeatId === selectedBeat.id
        ) || null
      : null;

  const actualScenePct = scriptMetrics.scenePct;
  const targetPct = selectedBeat ? selectedBeat.pct : null;
  const sceneDrift =
    targetPct !== null
      ? Math.round((actualScenePct - targetPct) * 10) / 10
      : null;

  const alignmentMessage = (() => {
    if (targetPct === null) return "No structure beat assigned to this scene.";

    if (inlineBeat && typeof inlineBeat.sceneBeatActualPct === "number") {
      const drift =
        Math.round(
          (inlineBeat.sceneBeatActualPct - targetPct) * 10
        ) / 10;
      if (Math.abs(drift) < 2) return "✅ Inline beat is on target.";
      if (drift > 0)
        return `📦 Inline moment is late by ${drift}% — add or move material before this moment.`;
      return `🪡 Inline moment is early by ${Math.abs(
        drift
      )}% — push it later or pad above.`;
    }

    if (Math.abs(sceneDrift) < 2) return "✅ Pretty much on target.";
    if (sceneDrift > 0)
      return `📦 This beat is landing late by ${sceneDrift}% — add/move material earlier.`;
    return `🪡 This beat is early by ${Math.abs(
      sceneDrift
    )}% — either move it down or pad before it.`;
  })();

  const handleField = (field) => (e) => {
    updateChunk(chunk.id, { [field]: e.target.value });
  };

  const handleCharactersBlur = () => {
    const list = charactersInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateChunk(chunk.id, { characters: list });
  };

  const handlePropsBlur = () => {
    const list = propsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateChunk(chunk.id, { props: list });
  };

  return (
    <div
      style={{
        width: "300px",
        background: "transparent",
        color: "#ccc",
        fontSize: "13px",
        padding: "12px",
        overflowY: "auto",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "8px", fontSize: "11px", color: "#888" }}>
        CHUNK DETAILS
      </div>

      {/* lock toggle */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#888" }}>Lock to structure</div>
        <button
          onClick={() => toggleChunkLock(chunk.id, !chunk.locked)}
          style={{
            marginTop: "4px",
            background: chunk.locked ? "#b8860b" : "transparent",
            border: "1px solid #555",
            color: "#fff",
            padding: "3px 8px",
            fontSize: "11px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          {chunk.locked ? "🔒 Locked" : "🔓 Unlock"}
        </button>
      </div>

      {/* Scene heading */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#888" }}>Scene Heading</div>
        <input
          style={{
            width: "100%",
            background: "#000",
            color: "#fff",
            border: "1px solid #444",
            padding: "6px",
            fontSize: "13px",
          }}
          value={chunk.title || ""}
          onChange={handleField("title")}
          placeholder="INT. LOCATION - DAY"
        />
      </div>

      {/* Structure beat selection */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", color: "#888" }}>
          Structure Beat (from {currentTemplate?.label || "template"})
        </div>
        <select
          style={{
            width: "100%",
            background: "#000",
            color: "#fff",
            border: "1px solid #444",
            padding: "6px",
            fontSize: "13px",
          }}
          value={selectedBeatId}
          onChange={(e) =>
            updateChunk(chunk.id, {
              anchorRole: e.target.value || null,
            })
          }
        >
          <option value="">— no beat —</option>
          {currentTemplate?.beats?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label} ({b.pct}%)
            </option>
          ))}
        </select>
      </div>

      {/* Structure alignment */}
      <div
        style={{
          marginBottom: "14px",
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: "6px",
          padding: "6px 6px 8px",
        }}
      >
        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
          Structure Alignment
        </div>
        <div style={{ fontSize: "11px", marginBottom: "4px" }}>
          {selectedBeat ? (
            <>
              Target: <strong>{selectedBeat.label}</strong> at{" "}
              <strong>{selectedBeat.pct}%</strong>
            </>
          ) : (
            "No beat selected."
          )}
        </div>
        <div style={{ fontSize: "11px", marginBottom: "4px" }}>
          Scene starts at: <strong>{scriptMetrics.scenePct}%</strong>
        </div>
        {inlineBeat && typeof inlineBeat.sceneBeatActualPct === "number" ? (
          <div style={{ fontSize: "11px", marginBottom: "6px" }}>
            Inline beat at:{" "}
            <strong>{inlineBeat.sceneBeatActualPct}%</strong> (block-level)
          </div>
        ) : null}

        <div
          style={{
            position: "relative",
            height: "16px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "999px",
            overflow: "hidden",
            marginBottom: "6px",
          }}
        >
          {selectedBeat ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${selectedBeat.pct}%`,
                width: "2px",
                background: "rgba(255,205,94,1)",
              }}
            ></div>
          ) : null}

          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${scriptMetrics.scenePct}%`,
              width: "4px",
              background: "rgba(86,209,255,1)",
            }}
          ></div>

          {inlineBeat && typeof inlineBeat.sceneBeatActualPct === "number" ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${inlineBeat.sceneBeatActualPct}%`,
                width: "3px",
                background: "rgba(170,255,170,1)",
              }}
            ></div>
          ) : null}
        </div>

        <div style={{ fontSize: "10.5px", opacity: 0.7 }}>
          {alignmentMessage}
        </div>
      </div>

      {/* Emotional beat */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#888" }}>Emotional Beat</div>
        <textarea
          style={{
            width: "100%",
            height: "60px",
            background: "#000",
            color: "#fff",
            border: "1px solid #444",
            padding: "6px",
            fontSize: "13px",
          }}
          value={chunk.emotionalBeat || ""}
          onChange={handleField("emotionalBeat")}
        />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#888" }}>Notes</div>
        <textarea
          style={{
            width: "100%",
            height: "60px",
            background: "#000",
            color: "#fff",
            border: "1px solid #444",
            padding: "6px",
            fontSize: "13px",
          }}
          value={chunk.notes || ""}
          onChange={handleField("notes")}
        />
      </div>

      {/* Status */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#888" }}>Status</div>
        <select
          style={{
            width: "100%",
            background: "#000",
            color: "#fff",
            border: "1px solid #444",
            padding: "6px",
            fontSize: "13px",
          }}
          value={chunk.status || "draft"}
          onChange={handleField("status")}
        >
          <option value="draft">draft</option>
          <option value="rewrite">rewrite</option>
          <option value="locked">locked</option>
        </select>
      </div>

      {/* Characters */}
      <div
        style={{
          borderTop: "1px solid #222",
          paddingTop: "8px",
          marginTop: "4px",
        }}
      >
        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
          Characters in this scene
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {sceneChars.length === 0 ? (
            <span style={{ fontSize: "11px", color: "#555" }}>(none)</span>
          ) : (
            sceneChars.map((c) => (
              <span
                key={c}
                onClick={() => openCharacterPanel && openCharacterPanel(c)}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.02)",
                  borderRadius: "3px",
                  padding: "2px 6px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {c}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Props */}
      <div
        style={{
          borderTop: "1px solid #222",
          paddingTop: "8px",
          marginTop: "8px",
        }}
      >
        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
          Props in this scene
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {Array.isArray(chunk.props) && chunk.props.length > 0 ? (
            chunk.props.map((p) => (
              <span
                key={p}
                onClick={() => openPropsPanel && openPropsPanel(p)}
                style={{
                  background: "rgba(148, 87, 255, 0.08)",
                  border: "1px solid rgba(148, 87, 255, 0.2)",
                  borderRadius: "3px",
                  padding: "2px 6px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {p}
              </span>
            ))
          ) : (
            <span style={{ fontSize: "11px", color: "#555" }}>(none)</span>
          )}
        </div>
      </div>

      {/* Estimated length */}
      <div style={{ marginTop: "10px", fontSize: "11px", color: "#888" }}>
        est. length:{" "}
        <span style={{ color: "#fff" }}>
          {computedPages} page{computedPages === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
