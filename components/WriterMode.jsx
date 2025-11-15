"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useProject } from "../context/ProjectContext";

// detect scene headings like INT./EXT.
const isSceneHeading = (txt = "") => {
  const t = txt.trim().toUpperCase();
  return (
    t.startsWith("INT.") ||
    t.startsWith("EXT.") ||
    t.startsWith("INT/EXT.") ||
    t.startsWith("I/E.") ||
    t.startsWith("EST.")
  );
};

// detect screenplay transitions
const isTransitionLine = (txt = "") => {
  const t = txt.trim().toUpperCase();
  const transitions = [
    "CUT TO:",
    "SMASH CUT:",
    "MATCH CUT:",
    "DISSOLVE TO:",
    "WIPE TO:",
    "FADE OUT.",
    "FADE OUT:",
    "FADE TO BLACK.",
    "FADE TO BLACK:",
    "FADE IN:",
    "FADE IN.",
  ];
  return transitions.some((p) => t === p);
};

// detect character-ish lines (ALL CAPS, short)
const looksLikeCharacter = (txt = "") => {
  const t = txt.trim();
  if (!t) return false;
  return t.length <= 25 && t === t.toUpperCase();
};

const topBarStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: "44px",
  background: "rgba(8,8,8,0.9)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 14px",
  zIndex: 99999,
  color: "#fff",
  fontFamily: "monospace",
  fontSize: "11px",
};

const buttonStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "11px",
  padding: "4px 10px",
  cursor: "pointer",
};

const rowBase = {
  width: "100%",
  background: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "monospace",
  fontSize: "12px",
  color: "#000",
  lineHeight: 1.6,
  padding: 0,
  resize: "none",
  overflow: "hidden", // no scrollbars
  minHeight: "1.2em",
  boxSizing: "border-box",
  transition: "height 0.15s ease-out",
};

// you had borderLeft 0 here, keeping that
const blockShell = (color = "transparent", isFocused = false) => ({
  borderLeft: `0px solid ${color}`,
  paddingLeft: "8px",
  marginBottom: "6px",
  transition: "background 120ms ease-out, border-color 120ms ease-out",
  background: isFocused ? "rgba(0,0,0,0.025)" : "transparent",
  borderRadius: "3px",
});

// match your lighter tints
const sceneHeadingColor = "var(--scene-highlight, rgba(141, 179, 255, 0.2))";
const actionColor = "var(--action-highlight, rgba(0,0,0,0.06))";
const dialogueColor = "var(--dialogue-highlight, rgba(255, 179, 141, 0.2))";
const transitionColor = "var(--transition-highlight, rgba(255, 141, 192, 0.2))";

function autoResize(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export default function WriterMode() {
  const {
    project,
    scriptsById,
    chunksById,
    getActiveScript,
    updateChunk,
    insertChunkAfter,
    closeWriterMode,
    selectChunk,
    // 👇 if your context exposes this, we'll use it
    selectedChunkId,
  } = useProject();

  // refs so we can focus newly-created lines
  const inputRefs = useRef({}); // { [sceneId]: { [`${index}:${part}`]: el } }

  // scroll + per-scene refs
  const scrollRef = useRef(null);
  const sceneRefs = useRef({}); // { chunkId: element }

  const registerRef = (sceneId, index, part = "main") => (el) => {
    if (!inputRefs.current[sceneId]) inputRefs.current[sceneId] = {};
    inputRefs.current[sceneId][`${index}:${part}`] = el;
  };

  const focusLine = (sceneId, index, part = "main") => {
    const el = inputRefs.current?.[sceneId]?.[`${index}:${part}`];
    if (el && typeof el.focus === "function") {
      el.focus();
      if (el.value !== undefined) {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  };

  // figure out which script we’re showing
  let script = getActiveScript && getActiveScript();
  if (!script) {
    const all = Object.values(scriptsById || {});
    if (all.length) script = all[0];
  }

  const orderedIds =
    script && Array.isArray(script.chunkOrder) && script.chunkOrder.length
      ? script.chunkOrder
      : Array.isArray(project?.chunks)
      ? project.chunks
      : [];

  const scenes = useMemo(
    () => orderedIds.map((id) => chunksById[id]).filter(Boolean),
    [orderedIds, chunksById]
  );

  // 👇 auto-scroll to selected chunk when opening writer mode / when selection changes
  useEffect(() => {
    if (!selectedChunkId) return;
    const scroller = scrollRef.current;
    const target = sceneRefs.current[selectedChunkId];
    if (scroller && target) {
      const top = target.offsetTop - 56; // account for header height
      scroller.scrollTo({ top, behavior: "instant" });
    }
  }, [selectedChunkId]);

  const updateSceneBody = (sceneId, newBody) => {
    updateChunk(sceneId, { body: newBody });
  };

  const makeEmpty = (type = "action") => {
    if (type === "dialogueBlock") {
      return {
        id: "blk_" + Math.random().toString(36).slice(2, 8),
        type: "dialogueBlock",
        character: "",
        parenthetical: "",
        dialogue: "",
        status: "draft",
      };
    }
    if (type === "transition") {
      return {
        id: "blk_" + Math.random().toString(36).slice(2, 8),
        type: "transition",
        text: "CUT TO:",
        status: "draft",
      };
    }
    return {
      id: "blk_" + Math.random().toString(36).slice(2, 8),
      type: "action",
      text: "",
      status: "draft",
    };
  };

  const insertLineAfter = (scene, index, newLine, focusPart = "main") => {
    const body = Array.isArray(scene.body) ? scene.body : [];
    const next = [...body.slice(0, index + 1), newLine, ...body.slice(index + 1)];
    updateSceneBody(scene.id, next);
    setTimeout(() => {
      focusLine(scene.id, index + 1, focusPart);
    }, 0);
  };

  const deleteLine = (scene, index) => {
    const body = Array.isArray(scene.body) ? scene.body : [];
    if (body.length === 0) return;
    const next = [...body.slice(0, index), ...body.slice(index + 1)];
    updateSceneBody(scene.id, next);
    const prevIndex = index - 1;
    setTimeout(() => {
      if (prevIndex >= 0) {
        focusLine(scene.id, prevIndex, "main");
      }
    }, 0);
  };

  // action change with auto-detect INT. and TRANSITION
  const handleActionChange = (scene, index, value) => {
    const body = Array.isArray(scene.body) ? scene.body : [];
    const block = body[index] || {};
    const next = [...body];

    if (isTransitionLine(value)) {
      next[index] = {
        ...block,
        type: "transition",
        text: value.toUpperCase(),
      };
    } else {
      next[index] = {
        ...block,
        type: "action",
        text: value,
      };
    }

    updateSceneBody(scene.id, next);
  };

  // dialogue change with “(” -> parenthetical, but store without parentheses
  const handleDialogueChange = (scene, index, part, value) => {
    const body = Array.isArray(scene.body) ? scene.body : [];
    const block = body[index] || {};
    const next = [...body];

    // user typed "(" in dialogue -> turn into parenthetical
    if (part === "dialogue" && value.startsWith("(") && !(block.parenthetical || "").length) {
      next[index] = {
        ...block,
        type: "dialogueBlock",
        parenthetical: value,
        dialogue: "",
      };
      updateSceneBody(scene.id, next);
      setTimeout(() => focusLine(scene.id, index, "parenthetical"), 0);
      return;
    }

    // sanitize parenthetical so we don't save () to the real chunk
    if (part === "parenthetical") {
      const cleaned = value.trim().replace(/^\(/, "").replace(/\)$/, "");
      next[index] = {
        ...block,
        type: "dialogueBlock",
        parenthetical: cleaned,
      };
      updateSceneBody(scene.id, next);
      return;
    }

    next[index] = {
      ...block,
      type: "dialogueBlock",
      [part]: value,
    };
    updateSceneBody(scene.id, next);
  };

  // action -> dialogue on Tab (keep text)
  const convertActionToDialogueLikeWD = (scene, block, index) => {
    const text = (block.text || "").trim();
    const body = Array.isArray(scene.body) ? scene.body : [];
    const next = [...body];

    if (looksLikeCharacter(text)) {
      next[index] = {
        id: block.id || "blk_" + Math.random().toString(36).slice(2, 8),
        type: "dialogueBlock",
        character: text.toUpperCase(),
        parenthetical: "",
        dialogue: "",
        status: "draft",
      };
      updateSceneBody(scene.id, next);
      setTimeout(() => focusLine(scene.id, index, "character"), 0);
      return;
    }

    next[index] = {
      id: block.id || "blk_" + Math.random().toString(36).slice(2, 8),
      type: "dialogueBlock",
      character: "",
      parenthetical: "",
      dialogue: text,
      status: "draft",
    };
    updateSceneBody(scene.id, next);
    setTimeout(() => focusLine(scene.id, index, "character"), 0);
  };

  // dialogue -> action on Shift+Tab (keep text)
  const convertDialogueToAction = (scene, block, index) => {
    const body = Array.isArray(scene.body) ? scene.body : [];
    const next = [...body];
    const mergedText =
      (block.character ? block.character + ": " : "") + (block.dialogue || "");
    next[index] = {
      id: block.id || "blk_" + Math.random().toString(36).slice(2, 8),
      type: "action",
      text: mergedText.trim(),
      status: "draft",
    };
    updateSceneBody(scene.id, next);
    setTimeout(() => focusLine(scene.id, index, "main"), 0);
  };

  const handleLineKeyDown = (e, scene, block, index) => {
    const body = Array.isArray(scene.body) ? scene.body : [];
    const isEmpty =
      block.type === "dialogueBlock"
        ? !block.dialogue?.trim() &&
          !block.character?.trim() &&
          !block.parenthetical?.trim()
        : !(block.text || "").trim();

    // BACKSPACE on empty -> delete this line (not the first)
    if (e.key === "Backspace" && isEmpty && index > 0) {
      e.preventDefault();
      deleteLine(scene, index);
      return;
    }

    // SHIFT+TAB => reverse
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (block.type === "dialogueBlock") {
        convertDialogueToAction(scene, block, index);
      }
      return;
    }

    // TAB -> action to dialogue (preserve text)
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (block.type === "action") {
        convertActionToDialogueLikeWD(scene, block, index);
      }
      return;
    }

    // SHIFT+ENTER -> allow newline in dialogue
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }

    // ENTER logic
    if (e.key === "Enter") {
      e.preventDefault();

      // ENTER in character -> go to dialogue
      if (block.type === "dialogueBlock" && e.target.dataset?.part === "character") {
        setTimeout(() => {
          focusLine(scene.id, index, "dialogue");
        }, 0);
        return;
      }

      // ENTER in parenthetical -> go to dialogue
      if (block.type === "dialogueBlock" && e.target.dataset?.part === "parenthetical") {
        setTimeout(() => {
          focusLine(scene.id, index, "dialogue");
        }, 0);
        return;
      }

      const currentText =
        block.type === "dialogueBlock" ? block.dialogue || "" : block.text || "";

      // scene heading -> actually make a new scene
      if (isSceneHeading(currentText)) {
        insertChunkAfter(scene.id);
        return;
      }

      // transition -> new action below
      if (block.type === "transition") {
        insertLineAfter(scene, index, makeEmpty("action"));
        return;
      }

      // dialogue
      if (block.type === "dialogueBlock") {
        insertLineAfter(scene, index, makeEmpty("action"));
        return;
      }

      // action
      if (block.type === "action") {
        insertLineAfter(scene, index, makeEmpty("action"));
        return;
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#111",
        zIndex: 99998,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* top bar */}
      <div style={topBarStyle}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <strong style={{ fontSize: "12px" }}>Writer Mode</strong>
          <span style={{ color: "#aaa" }}>
            {scenes.length} scenes • screenplay brain ON
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            style={buttonStyle}
            onClick={() => {
              if (orderedIds.length) {
                const lastId = orderedIds[orderedIds.length - 1];
                insertChunkAfter(lastId);
              } else {
                insertChunkAfter(null);
              }
            }}
          >
            + New scene
          </button>
          <button style={{ ...buttonStyle, background: "#ff5555" }} onClick={closeWriterMode}>
            Close
          </button>
        </div>
      </div>

      {/* scroll area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "56px 28px 40px",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          {scenes.map((scene, idx) => {
            const body = Array.isArray(scene.body) ? scene.body : [];
            return (
              <div
                key={scene.id}
                ref={(el) => {
                  sceneRefs.current[scene.id] = el;
                }}
                style={{
                  background: "#fff",
                  borderRadius: "6px",
                  padding: "46px 122px 12px",
                  marginBottom: "16px",
                  boxShadow: "0 3px 16px rgba(0,0,0,0.08)",
                  transition: "box-shadow 120ms ease-out",
                  position: "relative",
                }}
              >
                {/* scene number */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "16px",
                    background: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.04)",
                    borderRadius: "999px",
                    padding: "2px 10px",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    color: "#666",
                  }}
                >
                  SCENE {idx + 1}
                </div>

                {/* scene title */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <input
                    value={scene.title || ""}
                    onChange={(e) =>
                      updateChunk(scene.id, {
                        title: e.target.value.toUpperCase(),
                      })
                    }
                    style={{
                      ...rowBase,
                      textTransform: "uppercase",
                      fontWeight: 700,
                      borderLeft: "0px solid rgba(141,179,255,0.2)",
                      paddingLeft: "8px",
                    }}
                    placeholder="INT. SMALL POND RECORDS - DAY"
                  />
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button style={buttonStyle} onClick={() => insertChunkAfter(scene.id)}>
                      + Scene ↓
                    </button>
                    <button style={buttonStyle} onClick={() => selectChunk(scene.id)}>
                      open chunk
                    </button>
                  </div>
                </div>

                {body.map((block, bIdx) => {
                  // dialogue block
                  if (block?.type === "dialogueBlock") {
                    return (
                      <div key={block.id || bIdx} style={blockShell(dialogueColor, false)}>
                        <input
                          ref={registerRef(scene.id, bIdx, "character")}
                          data-part="character"
                          value={block.character || ""}
                          onChange={(e) =>
                            handleDialogueChange(
                              scene,
                              bIdx,
                              "character",
                              e.target.value.toUpperCase()
                            )
                          }
                          onKeyDown={(e) => handleLineKeyDown(e, scene, block, bIdx)}
                          style={{
                            ...rowBase,
                            textTransform: "uppercase",
                            fontWeight: 600,
                            width: "50%",
                            marginLeft: "35%",
                            marginBottom: "0px",
                          }}
                          placeholder="CHARACTER"
                        />

                        {!!(block.parenthetical || "").length && (
                          <div
                            style={{
                              position: "relative",
                              width: "45%",
                              marginLeft: "23%",
                              marginBottom: "-18px",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "-10px",
                                top: "-2px",
                                fontFamily: "monospace",
                                color: "#000",
                              }}
                            >
                              (
                            </span>
                            <textarea
                              ref={registerRef(scene.id, bIdx, "parenthetical")}
                              data-part="parenthetical"
                              value={block.parenthetical || ""}
                              onChange={(e) =>
                                handleDialogueChange(
                                  scene,
                                  bIdx,
                                  "parenthetical",
                                  e.target.value
                                )
                              }
                              onInput={(e) => autoResize(e.target)}
                              onKeyDown={(e) => handleLineKeyDown(e, scene, block, bIdx)}
                              style={{
                                ...rowBase,
                                paddingLeft: "0px",
                                paddingRight: "42px",
                                fontStyle: "italic",
                              }}
                              placeholder="beat"
                            />
                            <span
                              style={{
                                position: "absolute",
                                right: "-4px",
                                top: "2px",
                                fontFamily: "monospace",
                                color: "#000",
                              }}
                            >
                              )
                            </span>
                          </div>
                        )}

                        <textarea
                          ref={registerRef(scene.id, bIdx, "dialogue")}
                          value={block.dialogue || ""}
                          onChange={(e) =>
                            handleDialogueChange(scene, bIdx, "dialogue", e.target.value)
                          }
                          onInput={(e) => autoResize(e.target)}
                          onKeyDown={(e) => handleLineKeyDown(e, scene, block, bIdx)}
                          style={{
                            ...rowBase,
                            width: "70%",
                            marginLeft: "15%",
                            whiteSpace: "pre-wrap",
                            marginBottom: "4px",
                          }}
                          placeholder="Dialogue..."
                        />
                      </div>
                    );
                  }

                  // transition
                  if (block?.type === "transition") {
                    return (
                      <div key={block.id || bIdx} style={blockShell(transitionColor, false)}>
                        <input
                          ref={registerRef(scene.id, bIdx, "main")}
                          value={block.text || ""}
                          onChange={(e) => {
                            const body = Array.isArray(scene.body) ? scene.body : [];
                            const next = [...body];
                            next[bIdx] = {
                              ...block,
                              type: "transition",
                              text: e.target.value.toUpperCase(),
                            };
                            updateSceneBody(scene.id, next);
                          }}
                          onKeyDown={(e) => handleLineKeyDown(e, scene, block, bIdx)}
                          style={{
                            ...rowBase,
                            textAlign: "right",
                            textTransform: "uppercase",
                          }}
                          placeholder="CUT TO:"
                        />
                      </div>
                    );
                  }

                  // default: action (might look like heading or transition)
                  const value = block?.text || "";
                  const looksHeading = isSceneHeading(value);
                  const looksTransition = isTransitionLine(value);

                  return (
                    <div
                      key={block.id || bIdx}
                      style={blockShell(
                        looksHeading
                          ? sceneHeadingColor
                          : looksTransition
                          ? transitionColor
                          : actionColor,
                        false
                      )}
                    >
                      <textarea
                        ref={registerRef(scene.id, bIdx, "main")}
                        value={value}
                        onChange={(e) => handleActionChange(scene, bIdx, e.target.value)}
                        onInput={(e) => autoResize(e.target)}
                        onKeyDown={(e) => handleLineKeyDown(e, scene, block, bIdx)}
                        style={{
                          ...rowBase,
                          textTransform: looksHeading ? "uppercase" : "none",
                          fontWeight: looksHeading ? 700 : 400,
                          textAlign: looksTransition ? "right" : "left",
                        }}
                        placeholder={
                          looksHeading
                            ? "INT. PLACE - DAY"
                            : looksTransition
                            ? "CUT TO:"
                            : "Action / description"
                        }
                      />
                    </div>
                  );
                })}

                {/* add block buttons */}
                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                  <button
                    style={buttonStyle}
                    onClick={() => {
                      const body = Array.isArray(scene.body) ? scene.body : [];
                      updateSceneBody(scene.id, [...body, makeEmpty("action")]);
                      setTimeout(() => focusLine(scene.id, body.length, "main"), 0);
                    }}
                  >
                    + Action
                  </button>
                  <button
                    style={buttonStyle}
                    onClick={() => {
                      const body = Array.isArray(scene.body) ? scene.body : [];
                      updateSceneBody(scene.id, [...body, makeEmpty("dialogueBlock")]);
                      setTimeout(() => focusLine(scene.id, body.length, "character"), 0);
                    }}
                  >
                    + Dialogue
                  </button>
                  <button
                    style={buttonStyle}
                    onClick={() => {
                      const body = Array.isArray(scene.body) ? scene.body : [];
                      updateSceneBody(scene.id, [...body, makeEmpty("transition")]);
                      setTimeout(() => focusLine(scene.id, body.length, "main"), 0);
                    }}
                  >
                    + Transition
                  </button>
                </div>
              </div>
            );
          })}

          {scenes.length === 0 && (
            <div style={{ color: "#ddd", fontFamily: "monospace", fontSize: "12px" }}>
              No scenes found. Hit “+ New scene.” Then write something Hasan would pause on stream.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
