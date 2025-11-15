"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { useProject } from "../context/ProjectContext";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import CharacterPanel from "./CharacterPanel";
import CrewPanel from "./CrewPanel";
import PropPanel from "./PropPanel";
import WriterMode from "./WriterMode";



/* =========================================================
   util
========================================================= */
let __uidCounter = 0;
function uid() {
  __uidCounter += 1;
  return "blk_" + Date.now().toString(36) + "_" + __uidCounter.toString(36);
}

function autoResizeTextArea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

const baseEditable = {
  background: "transparent",
  border: "1px solid transparent",
  color: "#1c1c1cff",
  width: "100%",
  fontFamily: "monospace",
  fontSize: "13px",
  lineHeight: "1.4em",
  padding: "0",
  resize: "none",
  outline: "none",
  whiteSpace: "pre-wrap",
};

/* =========================================================
   small helpers
========================================================= */
const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", emoji: "📝" },
  { value: "rewrite", label: "Needs Rewrite", emoji: "🔄" },
  { value: "approved", label: "Approved", emoji: "✅" },
  { value: "locked", label: "Locked", emoji: "🔒" },
];

const miniCharBtn = {
  background: "rgba(142, 142, 142, 0.04)",
  border: "1px solid rgba(0,0,0,0.2)",
  borderRadius: "3px",
  fontSize: "10px",
  fontFamily: "monospace",
  cursor: "pointer",
  padding: "1px 6px",
};

const closeBtnStyle = {
  background: "transparent",
  border: "1px solid #444",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "10px",
  padding: "2px 6px",
  cursor: "pointer",
};


function statusEmoji(status) {
  switch (status) {
    case "approved":
      return "✅";
    case "locked":
      return "🔒";
    case "rewrite":
      return "🔄";
    case "draft":
    default:
      return "📝";
  }
}

import {
  STRUCTURE_TEMPLATES,
  getTemplateById,
} from "./StructureTemplates";




/* =========================================================
   EditableDropdown (for INT./EXT. etc)
========================================================= */
function EditableDropdown({
  value,
  onChange,
  options = [],
  widthPx = 100,
  uppercase = true,
  align = "left",
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const applyChange = (valRaw) => {
    const val = uppercase ? valRaw.toUpperCase() : valRaw;
    setDraft(val);
    onChange(val);
  };

  return (
    <div style={{ position: "relative", width: widthPx }}>
      <input
        value={draft}
        onChange={(e) => applyChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{
          background: "#fff",
          border: "0px solid #999",
          borderRadius: "2px",
          color: "#000",
          padding: "4px 6px",
          fontFamily: "monospace",
          fontSize: "12px",
          fontWeight: "bold",
          width: "100%",
          textAlign: align,
          textTransform: uppercase ? "uppercase" : "none",
        }}
      />
      {open && options.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            background: "#fff",
            border: "1px solid #999",
            borderRadius: "3px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 400,
            maxHeight: "140px",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#101010ff",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                applyChange(opt);
                setOpen(false);
              }}
              style={{
                padding: "4px 6px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                textTransform: uppercase ? "uppercase" : "none",
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   InsertBlockGhost
========================================================= */
function InsertBlockGhost({
  onAddAction,
  onAddDialogue,
  onAddTransition,
  onPaste,
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ position: "relative", height: "16px", margin: "4px 0 10px" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          top: "50%",
          height: "1px",
          background: "rgba(0,0,0,0.05)",
        }}
      />
      {hover && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.85)",
            border: "1px solid #444",
            borderRadius: "4px",
            padding: "4px 6px",
            display: "flex",
            gap: "4px",
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#fff",
            zIndex: 300,
          }}
        >
          <button style={ghostBtn} onClick={onAddAction}>
            Action
          </button>
          <button style={ghostBtn} onClick={onAddDialogue}>
            Dialogue
          </button>
          <button style={ghostBtn} onClick={onAddTransition}>
            Trans
          </button>
          <button style={ghostBtn} onClick={onPaste}>
            📥
          </button>
        </div>
      )}
    </div>
  );
}
const ghostBtn = {
  background: "transparent",
  border: "1px solid #555",
  borderRadius: "3px",
  color: "#fff",
  padding: "2px 4px",
  cursor: "pointer",
};


// =========================================================
// ActionBlockEditor (fixed)
// - TAB = new action below
// - SHIFT+TAB = new dialogue below
// - has PROP / CHAR buttons that work on selected text
// =========================================================
function ActionBlockEditor({
  value,
  onChange,
  onInsertBelow,   // (type, opts) -> void
  onExtractTag,    // (kind, upperText, newFullText) -> void
}) {
  const ref = useRef(null);

  // auto-resize on value change
  useEffect(() => {
    autoResizeTextArea(ref.current);
  }, [value]);





  // helper to take selected text -> PROP/CHAR
  const handleTagFromSelection = (kind) => {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) return; // nothing selected

    const selected = el.value.slice(start, end);
    if (!selected.trim()) return;

    const upper = selected.toUpperCase();
    const newText = el.value.slice(0, start) + upper + el.value.slice(end);

    // update textarea text
    onChange(newText);
    // keep size correct
    autoResizeTextArea(el);

    // tell parent (so chunk can add to props/chars array)
    if (onExtractTag) {
      onExtractTag(kind, upper, newText);
    }

    // put cursor at end of the tagged word
    const newPos = start + upper.length;
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = newPos;
      el.selectionEnd = newPos;
    });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* little tag buttons above the action box */}
      <div
        style={{
          position: "absolute",
          top: "-12px",
          right: "42px",
          color: "#999",
          display: "flex",
          gap: "4px",
        }}
      >
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleTagFromSelection("prop");
          }}
          style={miniCharBtn}
          title="Make selection a PROP"
        >
          PROP
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleTagFromSelection("character");
          }}
          style={miniCharBtn}
          title="Make selection a CHARACTER"
        >
          CHAR
        </button>
      </div>

      <textarea
        ref={ref}

        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          autoResizeTextArea(e.target);
        }}
        onKeyDown={(e) => {
          // TAB → new action
          if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            onInsertBelow && onInsertBelow("action", { focus: true });
          }
          // SHIFT+TAB → new dialogue
          if (e.key === "Tab" && e.shiftKey) {
            e.preventDefault();
            onInsertBelow && onInsertBelow("dialogue", { focus: true });
          }
        }}
        style={{
          ...baseEditable,
          minHeight: "42px",
          overflow: "hidden",
        }}
        onFocus={(e) => {
          e.target.style.border = "1px solid #999";
          e.target.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.target.style.border = "1px solid transparent";
          e.target.style.background = "transparent";
        }}
        placeholder="Action / description..."
      />
    </div>
  );
}



/* =========================================================
   TransitionBlockEditor
========================================================= */
function TransitionBlockEditor({
  value,
  onChange,
  onEnterNext,
  transitionOptions = [],
}) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  useEffect(() => {
    autoResizeTextArea(ref.current);
  }, [draft]);

  return (
    <div style={{ position: "relative", textAlign: "right" }}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        style={{
          fontSize: "10px",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          border: "1px solid #444",
          borderRadius: "3px",
          padding: "2px 6px",
          marginBottom: "3px",
        }}
      >
        TRANS ▾
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            background: "#fff",
            color: "#000",
            border: "1px solid #999",
            borderRadius: "3px",
            zIndex: 400,
            minWidth: "140px",
            textAlign: "right",
            fontFamily: "monospace",
            fontSize: "11px",
          }}
        >
          {transitionOptions.map((opt) => (
            <div
              key={opt}
              style={{
                padding: "4px 6px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                textTransform: "uppercase",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.toUpperCase());
                setDraft(opt.toUpperCase());
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => {
          const val = e.target.value.toUpperCase();
          setDraft(val);
          onChange(val);
          autoResizeTextArea(e.target);
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            onEnterNext && onEnterNext();
          }
        }}
        style={{
          ...baseEditable,
          textAlign: "right",
          textTransform: "uppercase",
          fontWeight: "bold",
          minHeight: "28px",
        }}
        onFocus={(e) => {
          e.target.style.border = "1px solid #999";
          e.target.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.target.style.border = "1px solid transparent";
          e.target.style.background = "transparent";
          setTimeout(() => setOpen(false), 120);
        }}
        placeholder="Select Transition:"
      />
    </div>
  );
}

/* =========================================================
   DialogueBlockEditor
   (supports TAB → new dialogue, and auto-focus target id)
========================================================= */
function DialogueBlockEditor({
  block,
  onCharacterChange,
  onParenChange,
  onDialogueChange,
  onTabNewDialogue,
  characterOptions = [],
}) {
  const [showParen, setShowParen] = useState(
    !!(block.parenthetical && block.parenthetical.trim() !== "")
  );
  const [charOpen, setCharOpen] = useState(false);
  const parenRef = useRef(null);
  const dialRef = useRef(null);

  useEffect(() => {
    if (dialRef.current) autoResizeTextArea(dialRef.current);
  }, [block.dialogue]);

  const handleAddParen = () => {
    setShowParen(true);
    setTimeout(() => {
      if (parenRef.current) parenRef.current.focus();
    }, 0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {/* character */}
      <div
        style={{
          width: "40%",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <input
          value={block.character || ""}
          onChange={(e) => onCharacterChange(e.target.value)}
          onFocus={() => setCharOpen(true)}
          onBlur={() => setTimeout(() => setCharOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (showParen && parenRef.current) {
                parenRef.current.focus();
              } else if (dialRef.current) {
                dialRef.current.focus();
              }
            }
          }}
          style={{
            ...baseEditable,
            textAlign: "center",
            textTransform: "uppercase",
            fontWeight: "bold",
            borderRadius: "2px",
          }}
          placeholder="CHARACTER"
        />
        {charOpen && characterOptions.length > 0 && (
          
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "100%",
              background: "#fff",
              color: "#000",
              border: "1px solid #999",
              borderRadius: "3px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              zIndex: 600,
              maxHeight: "140px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "12px",
              overflow: "hidden",
            }}
          >
            {characterOptions.map((name) => (
              <div
                key={name}
                style={{
                    padding: "4px 6px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onCharacterChange(name);
                  setCharOpen(false);
                  if (dialRef.current) dialRef.current.focus();
                }}
              >
                {name}
                
              </div>
              
            ))}
            <button
            type="button"
            onClick={() =>
              onCharacterChange(
                (block.character || "").replace(/\s*\(CONT\.\)$/i, "")
              )
            }
            style={miniCharBtn}
          >
            clear
          </button>
          <button
            type="button"
            onClick={() =>
              onCharacterChange(
                (block.character || "").replace(/\s*\(CONT\.\)$/i, "") +
                  " (CONT.)"
              )
            }
            style={miniCharBtn}
          >
            (CONT.)
          </button>
          <button
            type="button"
            onClick={() =>
              onCharacterChange(
                (block.character || "").replace(/\s*V\/O\.?$/i, "") + " V/O"
              )
            }
            style={miniCharBtn}
          >
            V/O
          </button>
          <button
            type="button"
            onClick={() =>
              onCharacterChange(
                (block.character || "").replace(/\s*O\/S\.?$/i, "") + " O/S"
              )
            }
            style={miniCharBtn}
          >
            O/S
          </button>
          </div>
        )}
      </div>

      {/* parenthetical */}
      {showParen ? (
        <div
          style={{
            width: "52%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            justifyContent: "center",
            fontStyle: "italic",
          }}
        >
          <span style={{ color: "#666" }}>(</span>
          <input
            ref={parenRef}
            value={block.parenthetical || ""}
            onChange={(e) => onParenChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (dialRef.current) dialRef.current.focus();
              }
            }}
            style={{
              ...baseEditable,
              textAlign: "center",
              fontStyle: "italic",
            }}
          />
          <span style={{ color: "#666" }}>)</span>
        </div>
      ) : (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#888",
            textAlign: "center",
            cursor: "pointer",
          }}
          onClick={handleAddParen}
        >
          (add parenthetical)
        </div>
      )}

      {/* dialogue */}
      <textarea
        ref={dialRef}
        data-dialogue-for={block.id}
        value={block.dialogue || ""}
        onChange={(e) => {
          onDialogueChange(e.target.value);
          autoResizeTextArea(dialRef.current);
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            onTabNewDialogue && onTabNewDialogue();
          }
        }}
        style={{
          ...baseEditable,
          width: "60%",
          margin: "0 auto",
          minHeight: "62px",
          overflow: "hidden",
        }}
        onFocus={(e) => {
          e.target.style.border = "1px solid #999";
          e.target.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.target.style.border = "1px solid transparent";
          e.target.style.background = "transparent";
        }}
        placeholder="Dialogue..."
      />
    </div>
  );
}
function DualDialogueBlockEditor({ block, onChange, allCharacters = [] }) {
  const handleLeft = (patch) => {
    onChange({
      ...block,
      left: { ...(block.left || {}), ...patch },
    });
  };
  const handleRight = (patch) => {
    onChange({
      ...block,
      right: { ...(block.right || {}), ...patch },
    });
  };

  const characterInputStyle = {
    background: "#fff",
    color: "#000",
    border: "1px solid #bbb",
    borderRadius: "3px",
    fontFamily: "monospace",
    fontSize: "12px",
    padding: "2px 4px",
    width: "100%",
    textTransform: "uppercase",
  };

  const textAreaStyle = {
    width: "100%",
    minHeight: "70px",
    background: "#fafafa",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "3px",
    fontFamily: "monospace",
    fontSize: "12px",
    padding: "4px",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
      }}
    >
      {/* LEFT SPEAKER */}
      <div>
        <input
          value={(block.left?.character || "").toUpperCase()}
          onChange={(e) => handleLeft({ character: e.target.value })}
          style={characterInputStyle}
          placeholder="CHARACTER"
          list="all-characters"
        />
        <input
          value={block.left?.parenthetical || ""}
          onChange={(e) => handleLeft({ parenthetical: e.target.value })}
          style={{
            ...characterInputStyle,
            textTransform: "none",
            marginTop: "4px",
          }}
          placeholder="(beat)"
        />
        <textarea
          value={block.left?.dialogue || ""}
          onChange={(e) => handleLeft({ dialogue: e.target.value })}
          style={{ ...textAreaStyle, marginTop: "4px" }}
          placeholder="Dialogue..."
        />
      </div>

      {/* RIGHT SPEAKER */}
      <div>
        <input
          value={(block.right?.character || "").toUpperCase()}
          onChange={(e) => handleRight({ character: e.target.value })}
          style={characterInputStyle}
          placeholder="CHARACTER"
          list="all-characters"
        />
        <input
          value={block.right?.parenthetical || ""}
          onChange={(e) => handleRight({ parenthetical: e.target.value })}
          style={{
            ...characterInputStyle,
            textTransform: "none",
            marginTop: "4px",
          }}
          placeholder="(beat)"
        />
        <textarea
          value={block.right?.dialogue || ""}
          onChange={(e) => handleRight({ dialogue: e.target.value })}
          style={{ ...textAreaStyle, marginTop: "4px" }}
          placeholder="Dialogue..."
        />
      </div>

      {/* datalist for characters (optional) */}
      <datalist id="all-characters">
        {allCharacters.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}

function TransitionHeader({ value, onChange, options = [] }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value || "");

  React.useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const apply = (val) => {
    const upper = val.toUpperCase();
    setDraft(upper);
    onChange(upper);
  };

  return (
    <div style={{ position: "relative", marginBottom: "6px",  }}>
      <input
        value={draft}
        onChange={(e) => apply(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onClick={() => setOpen(true)} // 👈 clicking the field opens list
        placeholder="TRANSITION:"
        style={{
          background: "#fff",
          border: "0px solid #bbb",
          color: "#000000ff",
          borderRadius: "3px",
          padding: "3px 8px",
          fontFamily: "monospace",
          fontSize: "11px",
          fontWeight: "bold",
          textAlign: "right",
          textTransform: "uppercase",
          width: "160px",
          marginLeft: "auto", // right-align
          display: "block",
        }}
      />
      {open && options.length > 0 && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            background: "#fff",
            border: "1px solid #999",
            color: "#000",
            borderRadius: "3px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 500,
            minWidth: "150px",
            fontFamily: "monospace",
            fontSize: "11px",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                apply(opt);
                setOpen(false);
              }}
              style={{
                padding: "4px 6px",
                cursor: "pointer",
                textTransform: "uppercase",
                borderBottom: "1px solid #eee",
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SceneHeadingBlock
========================================================= */
function SceneHeadingBlock({
  slug,
  onChangeSlug,
  intExtOptions,
  timeOfDayOptions,
  locationOptions = [],
}) {
  return (
    <div
      style={{
        position: "relative",
        background: "rgba(255,255,255,0.95)",
        borderRadius: "2px",
        padding: "12px 16px 12px 24px",
        marginBottom: "20px",
        border: "1px solid transparent",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "10px",
          background: "rgba(255,210,80,0.4)",
          borderTopLeftRadius: "2px",
          borderBottomLeftRadius: "2px",
        }}
      />
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        {/* INT/EXT */}
        <EditableDropdown
          value={slug.intExt}
          onChange={(val) => onChangeSlug("intExt", val)}
          options={intExtOptions}
          widthPx={80}
        />

        {/* LOCATION — now a dropdown too */}
        <div style={{ flex: 1 }}>
          <EditableDropdown
            value={slug.location}
            onChange={(val) => onChangeSlug("location", val)}
            options={locationOptions}
            widthPx={"100%"}         // this will be ignored, we’re wrapping it
            uppercase={true}
            align="left"
          />
        </div>

        {/* TIME OF DAY */}
        <EditableDropdown
          value={slug.timeOfDay}
          onChange={(val) => onChangeSlug("timeOfDay", val)}
          options={timeOfDayOptions}
          widthPx={120}
        />
      </div>
    </div>
  );
}


/* =========================================================
   SortableBlockWrapper
   (drag + actions inside; status menu close to icon)
========================================================= */
function SortableBlockWrapper({
  block,
  idx,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onCopyBlock,
  insertActionAfter,
  insertDialogueAfter,
  characterOptions,
  transitionOptions,
  previousSpeaker,
  onAddSceneProp,
  onAddSceneCharacter,
  structureBeats = [],
  sceneId,
  estimateBlockPct,
}) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    importWizardOpen,
    importWizardText,
  } = useSortable({ id: block.id });

  const [hover, setHover] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showBeatMenu, setShowBeatMenu] = useState(false);

  // rail colour
  let railColor = "rgba(180,180,180,0.3)";
  if (block.type === "dialogueBlock") railColor = "rgba(140,180,255,0.35)";
  if (block.type === "transition") railColor = "rgba(210,140,255,0.35)";
  if (block.status === "rewrite") railColor = "rgba(255,190,120,0.4)";
  if (block.status === "locked") railColor = "rgba(140,240,140,0.4)";

  const emoji = statusEmoji(block.status);

  const updateField = (field, val) => {
    onUpdateBlock(idx, { ...block, [field]: val });
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "relative",
        background: "rgba(255,255,255,0.95)",
        borderRadius: "2px",
        padding: "10px 16px 14px 26px",
        border: isDragging ? "1px solid #999" : "1px solid transparent",
        transform: CSS.Transform.toString(transform),
        transition,
        fontFamily: "monospace",
      }}
      onMouseEnter={() => {
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
        setShowStatusMenu(false);
        setShowBeatMenu(false);
      }}
    >
      {/* coloured rail on the left */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "10px",
          background: railColor,
          borderTopLeftRadius: "2px",
          borderBottomLeftRadius: "2px",
        }}
      />

      {/* floating tool stack (drag + sb + beat + tag + copy/dup/del) */}
      <div
        style={{
          position: "absolute",
          top: "4px",
          left: "-24px",
          display: hover ? "flex" : "none",
          flexDirection: "column",
          gap: "4px",
          background: "rgba(0,0,0,0.85)",
          border: "1px solid #444",
          borderRadius: "4px",
          padding: "4px",
          zIndex: 80,
        }}
      >
        {/* drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: "3px",
            textAlign: "center",
            cursor: "grab",
            padding: "3px 0",
            fontSize: "10px",
            color: "#fff",
          }}
          title="Drag to reorder"
        >
          ⋮⋮
        </div>

        {/* storyboard upload */}
        <label
          style={railBtn("#fff")}
          title={block.storyboardUrl ? "Replace storyboard" : "Add storyboard"}
        >
          🎬
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                onUpdateBlock(idx, {
                  ...block,
                  storyboardUrl: ev.target.result,
                });
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>

        {/* beat marker (now separate from storyboard label) */}
                <div style={{ position: "relative" }}>
          <button
            style={railBtn("#ffd27f")}
            title={
              block.sceneBeatId
                ? `Beat: ${block.sceneBeatLabel || block.sceneBeatId}`
                : "Mark beat here"
            }
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusMenu(false);
              setShowBeatMenu((b) => !b);
            }}
          >
            ⭐
          </button>
          {showBeatMenu && (
            <div
              style={{
                position: "absolute",
                left: "100%",
                top: 0,
                background: "rgba(0,0,0,0.9)",
                border: "1px solid #444",
                borderRadius: "4px",
                minWidth: "180px",
                zIndex: 999,
              }}
            >
              <div
                style={{
                  padding: "4px 6px",
                  fontSize: "10px",
                  opacity: 0.5,
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                Structure beats
              </div>
              {structureBeats.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "4px 6px",
                    fontSize: "11px",
                    cursor: "pointer",
                    background:
                      block.sceneBeatId === b.id
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const absPct =
                      typeof estimateBlockPct === "function"
                        ? estimateBlockPct(sceneId, idx)
                        : null;
                    onUpdateBlock(idx, {
                      ...block,
                      sceneBeatId: b.id,
                      sceneBeatLabel: b.label,
                      sceneBeatTargetPct: b.pct, // from template
                      sceneBeatActualPct: absPct, // from where it sits
                    });
                    setShowBeatMenu(false);
                  }}
                >
                  {b.label} ({b.pct}%)
                </div>
              ))}
              <div
                style={{
                  padding: "4px 6px",
                  fontSize: "11px",
                  cursor: "pointer",
                  borderTop: "1px solid rgba(255,255,255,0.03)",
                  opacity: 0.6,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onUpdateBlock(idx, {
                    ...block,
                    sceneBeatId: "",
                    sceneBeatLabel: "",
                    sceneBeatTargetPct: null,
                    sceneBeatActualPct: null,
                  });
                  setShowBeatMenu(false);
                }}
              >
                — clear beat —
              </div>
            </div>
          )}
        </div>


        {/* simple tag button */}
        <button
          style={railBtn("rgba(106, 148, 190, 1)")}
          title="Add a tag/note for this block"
          onClick={() => {
            const label = window.prompt("Tag / note:");
            if (!label) return;
            const prevTags = Array.isArray(block.tags) ? block.tags : [];
            onUpdateBlock(idx, {
              ...block,
              tags: [...prevTags, label],
            });
          }}
        >
          🏷
        </button>

        {/* copy / dup / del */}
        <button
          style={railBtn("#fff")}
          onClick={() => onCopyBlock(block)}
          title="Copy block to clipboard"
        >
          📋
        </button>
        <button
          style={railBtn("#fff")}
          onClick={() => onDuplicateBlock(idx)}
          title="Duplicate block"
        >
          ⧉
        </button>
        <button
          style={railBtn("#f88", "#944")}
          onClick={() => onDeleteBlock(idx)}
          title="Delete block"
        >
          ✕
        </button>
      </div>

      {/* storyboard hover preview */}
      {block.storyboardUrl && hover && (
        <div
          style={{
            position: "absolute",
            left: "-20px",
            top: "-160px",
            background: "#000",
            border: "1px solid #444",
            borderRadius: "4px",
            padding: "4px",
            zIndex: 2000,
          }}
        >
          <img
            src={block.storyboardUrl}
            alt="storyboard"
            style={{ maxWidth: "240px", maxHeight: "180px", display: "block" }}
          />
          <button
            onClick={() =>
              onUpdateBlock(idx, { ...block, storyboardUrl: "" })
            }
            style={{
              marginTop: "4px",
              float: "right",
              background: "#400",
              color: "#fff",
              border: "1px solid #800",
              fontSize: "10px",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            remove
          </button>
        </div>
      )}

      {/* bottom-right status icon */}
      <div
        style={{
          position: "absolute",
          right: "6px",
          bottom: "-6px",
          fontSize: "11px",
          cursor: "pointer",
          zIndex: 60,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setShowStatusMenu((s) => !s);
          setShowBeatMenu(false);
        }}
      >
        {emoji}
        {showStatusMenu && (
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: "16px",
              transform: "translateY(100%)",
              background: "rgba(0,0,0,0.9)",
              border: "1px solid #444",
              borderRadius: "4px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
              minWidth: "130px",
              zIndex: 300,
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                style={{
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                  background:
                    block.status === opt.value
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onUpdateBlock(idx, { ...block, status: opt.value });
                  setShowStatusMenu(false);
                }}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* scene beat label in corner */}
      {block.sceneBeat ? (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "6px",
            background: "rgba(255,210,127,0.12)",
            border: "1px solid rgba(255,210,127,0.3)",
            borderRadius: "3px",
            padding: "1px 4px",
            fontSize: "9px",
            color: "#ffd27f",
          }}
        >
          {block.sceneBeat}
        </div>
      ) : null}

      {/* actual block content ------------------------------------------------ */}
      {block.type === "action" && (
        <ActionBlockEditor
          id={block.id}
          value={block.text || ""}
          onChange={(val) => updateField("text", val)}
          onInsertBelow={(type, opts = {}) => {
            if (type === "action") {
              insertActionAfter(idx, opts);
            } else if (type === "dialogue") {
              insertDialogueAfter(idx, "", opts);
            }
          }}
          onExtractTag={(kind, upperText, newBlockText) => {
            // update text in block
            updateField("text", newBlockText);
            // bubble up to chunk
            if (kind === "prop" && onAddSceneProp) {
              onAddSceneProp(upperText);
            }
            if (kind === "character" && onAddSceneCharacter) {
              onAddSceneCharacter(upperText);
            }
          }}
        />
      )}

      {block.type === "transition" && (
        <TransitionBlockEditor
          value={block.text || ""}
          onChange={(val) => updateField("text", val)}
          onEnterNext={() => insertActionAfter(idx)}
          transitionOptions={transitionOptions}
        />
      )}

      {block.type === "dialogueBlock" && (
        <DialogueBlockEditor
          block={block}
          onCharacterChange={(val) => updateField("character", val)}
          onParenChange={(val) => updateField("parenthetical", val)}
          onDialogueChange={(val) => updateField("dialogue", val)}
          onTabNewDialogue={() =>
            insertDialogueAfter(
              idx,
              previousSpeaker || block.character || ""
            )
          }
          characterOptions={characterOptions}
        />
      )}

      {block.type === "dualDialogue" && (
        <DualDialogueBlockEditor
          block={block}
          onChange={(next) => onUpdateBlock(idx, next)}
          allCharacters={characterOptions || []}
        />
      )}

      {/* type switcher */}
      <div
        style={{
          position: "absolute",
          right: "6px",
          top: "0px",
          zIndex: 60,
        }}
      >
        <select
          value={block.type}
          onChange={(e) => {
            const newType = e.target.value;
            let converted = { ...block, type: newType };

            if (block.type === "action" && newType === "dialogueBlock") {
              converted = {
                id: block.id,
                type: "dialogueBlock",
                character: "",
                parenthetical: "",
                dialogue: block.text || "",
                status: block.status || "draft",
              };
            } else if (block.type === "action" && newType === "dualDialogue") {
              converted = {
                id: block.id,
                type: "dualDialogue",
                left: {
                  character: "",
                  parenthetical: "",
                  dialogue: block.text || "",
                },
                right: {
                  character: "",
                  parenthetical: "",
                  dialogue: "",
                },
                status: block.status || "draft",
              };
            } else if (
              block.type === "dialogueBlock" &&
              newType === "dualDialogue"
            ) {
              converted = {
                id: block.id,
                type: "dualDialogue",
                left: {
                  character: block.character || "",
                  parenthetical: block.parenthetical || "",
                  dialogue: block.dialogue || "",
                },
                right: {
                  character: "",
                  parenthetical: "",
                  dialogue: "",
                },
                status: block.status || "draft",
              };
            } else if (
              block.type === "dualDialogue" &&
              newType === "dialogueBlock"
            ) {
              converted = {
                id: block.id,
                type: "dialogueBlock",
                character: (block.left?.character || "").toUpperCase(),
                parenthetical: block.left?.parenthetical || "",
                dialogue: block.left?.dialogue || "",
                status: block.status || "draft",
              };
            } else if (block.type === "dialogueBlock" && newType === "action") {
              const combo = [
                block.character ? block.character.toUpperCase() : "",
                block.parenthetical ? "(" + block.parenthetical + ")" : "",
                block.dialogue || "",
              ]
                .filter(Boolean)
                .join("\n");
              converted = {
                id: block.id,
                type: "action",
                text: combo,
                status: block.status || "draft",
              };
            } else if (newType === "transition") {
              converted = {
                id: block.id,
                type: "transition",
                text: block.text || block.dialogue || "CUT TO:",
                status: block.status || "draft",
              };
            }

            onUpdateBlock(idx, converted);
          }}
          style={{
            background: "rgba(100, 100, 100, 0.2)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "3px",
            fontSize: "10px",
          }}
        >
          <option value="action">A</option>
          <option value="dialogueBlock">D</option>
          <option value="dualDialogue">DD</option>
          <option value="transition">T</option>
        </select>
      </div>

      {/* small tags display */}
      {Array.isArray(block.tags) && block.tags.length > 0 ? (
        <div
          style={{
            marginTop: "6px",
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
          }}
        >
          {block.tags.map((t, i) => (
            <span
              key={i}
              style={{
                background: "rgba(40, 133, 94, 0.45)",
                border: "1px solid rgba(35, 81, 146, 0.59)",
                borderRadius: "4px",
                padding: "1px 5px",
                fontSize: "9px",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}


function railBtn(color, border = "#444") {
  return {
    background: "transparent",
    border: `1px solid ${border}`,
    borderRadius: "3px",
    color,
    fontSize: "11px",
    cursor: "pointer",
    padding: "2px 0",
  };
}

/* =========================================================
   MAIN EDITOR
========================================================= */
const floatBtn = {
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.67), rgba(255, 255, 255, 0.14))",
  border: "1px solid rgba(43, 43, 43, 0.4)",
  color: "#222",
  borderRadius: "999px",
  padding: "6px 16px",
  cursor: "pointer",
  fontSize: "11px",
  backdropFilter: "blur(4px)",
};

export default function ChunkEditor() {
  const {
    getCurrentChunk,
    getActiveScript,
    chunksById,
    updateChunk,
    selectChunk,
    insertChunkAfter,
    selectedChunkId,
    uiState,
    closeCharacterPanel,
    closeCrewPanel,
    closePropsPanel,
    importWizardOpen,
    importWizardText,
    project, // if you have it available here
  } = useProject();

  const script = getActiveScript ? getActiveScript() : null;
  const selectedTemplateId =
    (script?.meta?.structureTemplateId) ||
    (project?.meta?.structureTemplateId) ||
    "3-act";
  const currentTemplate = getTemplateById(selectedTemplateId);
  const templateBeats = currentTemplate?.beats || [];


  const chunk = getCurrentChunk();
  const editorRef = useRef(null);
  const [pendingFocusBlockId, setPendingFocusBlockId] = useState(null);
  const [showBeatMenu, setShowBeatMenu] = useState(false);
  const pageRef = useRef(null);
  const sceneHeadingRef = useRef(null);

  // scroll to top ASAP whenever a new scene is selected
  useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.scrollTop = 0;
    if (pageRef.current) pageRef.current.scrollTop = 0;
    if (typeof window !== "undefined") window.scrollTo(0, 0);

    if (sceneHeadingRef.current) {
      // focus without scrolling again (we already scrolled)
      sceneHeadingRef.current.focus({ preventScroll: true });
    }
  }, [selectedChunkId]);

  // estimate absolute % position for a specific block in this scene
  const estimateBlockPct = (sceneId, blockIndex) => {
    if (!script || !Array.isArray(script.chunkOrder)) return 0;
    // total pages in script
    let totalPages = 0;
    script.chunkOrder.forEach((cid) => {
      const sc = chunksById[cid];
      totalPages += sc?.estPageLength || 1;
    });

    // pages before this scene
    let pagesBefore = 0;
    for (const cid of script.chunkOrder) {
      if (cid === sceneId) break;
      const sc = chunksById[cid];
      pagesBefore += sc?.estPageLength || 1;
    }

    const thisScene = chunksById[sceneId];
    const scenePages = thisScene?.estPageLength || 1;

    // within scene: approximate block offset by index
    const totalBlocks = Array.isArray(thisScene?.body)
      ? thisScene.body.length
      : 1;
    const blockOffsetPages =
      totalBlocks > 1 ? (blockIndex / totalBlocks) * scenePages : 0;

    const absolutePages = pagesBefore + blockOffsetPages;
    if (totalPages === 0) return 0;
    return Math.round((absolutePages / totalPages) * 1000) / 10; // 1 decimal
  };


  // we only want to run dnd-kit on the client to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // make sure every block has a unique id
  useEffect(() => {
    if (!chunk) return;
    const seen = new Set();
    let changed = false;
    const healed = chunk.body.map((b) => {
      let blk = b;
      if (!blk.id) {
        blk = { ...blk, id: uid() };
        changed = true;
      }
      if (seen.has(blk.id)) {
        blk = { ...blk, id: uid() };
        changed = true;
      }
      seen.add(blk.id);
      return blk;
    });
    if (changed) {
      updateChunk(chunk.id, { body: healed });
    }
  }, [chunk, updateChunk]);

  // focus newly created dialogue (from TAB)
  // focus newly created dialogue (from TAB) without scrolling the whole page down
  useEffect(() => {
    if (!pendingFocusBlockId) return;
    if (!editorRef.current) return;

    // try dialogue first
    let el = editorRef.current.querySelector(
      `[data-dialogue-for="${pendingFocusBlockId}"]`
    );

    // if not dialogue, try action
    if (!el) {
      el = editorRef.current.querySelector(
        `[data-action-for="${pendingFocusBlockId}"]`
      );
    }

    if (el) {
      if (typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      } else {
        el.focus();
      }
      if ("selectionStart" in el) {
        el.selectionStart = el.value.length;
        el.selectionEnd = el.value.length;
      }
    }

    // force back to top
    if (editorRef.current) {
      editorRef.current.scrollTop = 0;
    }

    setPendingFocusBlockId(null);
  }, [pendingFocusBlockId]);



  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // all characters from whole script
  const allCharacterOptions = useMemo(() => {
    const script = getActiveScript();
    if (!script) return [];
    const names = new Set();
    script.chunkOrder.forEach((cid) => {
      const sc = chunksById[cid];
      if (!sc) return;
      (sc.characters || []).forEach((n) => names.add(n));
      (sc.body || []).forEach((b) => {
        if (b?.type === "dialogueBlock" && b.character) {
          names.add(b.character);
        }
      });
    });
    return Array.from(names).sort();
  }, [getActiveScript, chunksById]);
  // all locations from whole script
  const allLocationOptions = useMemo(() => {
    const script = getActiveScript();
    if (!script) return [];
    const locs = new Set();

    script.chunkOrder.forEach((cid) => {
      const sc = chunksById[cid];
      if (!sc) return;
      // our scene-heading info lives in sc.slug
      if (sc.slug && sc.slug.location) {
        locs.add(sc.slug.location.toUpperCase());
      } else if (sc.title) {
        // fallback: try to pull from title if we don't have slug yet
        // e.g. "INT. RECORD STORE - DAY" -> "RECORD STORE"
        const m = sc.title.match(/^(INT\.|EXT\.|INT\.\/EXT\.|EST\.)\s+(.+?)\s+-\s+(.+)$/i);
        if (m) {
          locs.add(m[2].toUpperCase());
        }
      }
    });

    return Array.from(locs).sort();
  }, [getActiveScript, chunksById]);

  // page info
  const pageInfo = useMemo(() => {
    const script = getActiveScript();
    if (!script || !chunk) return { current: 1, total: 1 };
    let running = 0;
    let current = 1;
    script.chunkOrder.forEach((cid) => {
      const sc = chunksById[cid];
      const len = sc?.estPageLength || 1;
      if (cid === chunk.id) {
        current = running + len / 2;
      }
      running += len;
    });
    return {
      current: Math.max(1, Math.round(current)),
      total: Math.max(1, Math.round(running)),
    };
  }, [getActiveScript, chunksById, chunk]);

  // transition options
  const transitionOptions = [
    "CUT TO:",
    "SMASH CUT TO:",
    "MATCH CUT TO:",
    "DISSOLVE TO:",
    "WIPE TO:",
    "FADE IN:",
    "FADE OUT.",
    "BACK TO SCENE",
    "Star Wipe:",
  ];

  // scene heading info lives in chunk.slug
  const slug = chunk?.slug || {
    intExt: "INT.",
    location: chunk?.title || "",
    timeOfDay: "DAY",
  };
  const sceneTransition = chunk?.transition || "";

  const updateSceneTransition = (val) => {
    if (!chunk) return;
    updateChunk(chunk.id, { transition: val });
  };

  const updateSlugField = (field, val) => {
    if (!chunk) return;
    const newSlug = { ...slug, [field]: val };
    const newTitle = `${newSlug.intExt} ${newSlug.location} - ${newSlug.timeOfDay}`.toUpperCase();
    updateChunk(chunk.id, { slug: newSlug, title: newTitle });
  };

  // handlers
  const updateBlockAt = (idx, newBlock) => {
    const newBody = [...chunk.body];
    newBody[idx] = newBlock;
    updateChunk(chunk.id, { body: newBody });
  };

  const deleteBlockAt = (idx) => {
    const newBody = chunk.body.filter((_, i) => i !== idx);
    updateChunk(chunk.id, { body: newBody });
  };

  const duplicateBlockAt = (idx) => {
    const base = chunk.body[idx];
    const newBlock = { ...base, id: uid() };
    const newBody = [
      ...chunk.body.slice(0, idx + 1),
      newBlock,
      ...chunk.body.slice(idx + 1),
    ];
    updateChunk(chunk.id, { body: newBody });
  };

  const copyBlockToClipboard = async (block) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(block, null, 2));
    } catch (err) {
      console.warn("clipboard failed", err);
    }
  };

  const insertBlockAt = (insertIndex, newBlock) => {
    const newBody = [...chunk.body];
    newBody.splice(insertIndex, 0, newBlock);
    updateChunk(chunk.id, { body: newBody });
  };

const addActionAtIndex = (i, opts = {}) => {
  const newId = uid();
  insertBlockAt(i, {
    id: newId,
    type: "action",
    text: "",
    status: "draft",
  });
  if (opts.focus) {
    setPendingFocusBlockId(newId);
  }
};


const addDialogueAtIndex = (i, characterToCopy = "", opts = {}) => {
  const newId = uid();
  insertBlockAt(i, {
    id: newId,
    type: "dialogueBlock",
    character: characterToCopy || "",
    parenthetical: "",
    dialogue: "",
    status: "draft",
  });
  // always focus dialogue, OR if opts.focus
  if (opts.focus !== false) {
    setPendingFocusBlockId(newId);
  }
};


  const addTransitionAtIndex = (i) => {
    insertBlockAt(i, {
      id: uid(),
      type: "transition",
      text: "CUT TO:",
      status: "draft",
    });
  };

  const pasteBlockAtIndex = async (i) => {
    try {
      const txt = await navigator.clipboard.readText();
      const parsed = JSON.parse(txt);
      if (!parsed || !parsed.type) return;
      insertBlockAt(i, { ...parsed, id: uid() });
    } catch (err) {
      console.warn("paste failed", err);
    }
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = chunk.body.findIndex((b) => b.id === active.id);
    const newIndex = chunk.body.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(chunk.body, oldIndex, newIndex);
    updateChunk(chunk.id, { body: reordered });
  };

  const handleNextScene = () => {
    const script = getActiveScript();
    if (!script || !chunk) return;
    const order = script.chunkOrder;
    const idx = order.indexOf(chunk.id);
    if (idx === -1) return;
    const nextId = order[idx + 1];
    if (!nextId) return;
    selectChunk(nextId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddSceneAfter = () => {
    if (!chunk) return;
    insertChunkAfter(chunk.id);
  };

  const addPropToChunk = (propName) => {
  if (!chunk) return;
  const current = Array.isArray(chunk.props) ? chunk.props : [];
  if (current.includes(propName)) return;
  updateChunk(chunk.id, { props: [...current, propName] });
  };

  const addCharacterToChunk = (charName) => {
    if (!chunk) return;
    const current = Array.isArray(chunk.characters) ? chunk.characters : [];
    if (current.includes(charName)) return;
    updateChunk(chunk.id, { characters: [...current, charName] });
  };

  


  if (!chunk) {
    return (
      <div style={{ flex: 1, background: "#2c2c2cff", color: "#ccc" }}>
        No scene selected
      </div>
    );
  }





  return (
    <div 
      style={{
        
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#1a1a1a",
        position: "relative",
      }}
    >
      {uiState?.showCharacterPanel && (
  <div 
    
    style={{
      
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      backdropFilter: "blur(2px)",
      zIndex: 7777,
      display: "flex",
      justifyContent: "center",
      alignItems: "top",
      padding: "18px",
    }}
  >
    <div 
      style={{
        width: "min(800px, 100%)",
        height: "min(80vh, 100%)",
        background: "#0f0f0f",
        border: "1px solid #333",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "6px 10px",
          borderBottom: "1px solid #222",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
        }}
      >
        <div style={{ fontWeight: 600 }}>Character Sheets</div>
        <button
          onClick={closeCharacterPanel}
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
          Close
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <CharacterPanel />
      </div>
    </div>
  </div>
)}

      {/* top bar */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #444",
          background: "#4b086aff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "#888" }}>CHUNK EDITOR</div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            Hover to reveal actions. TAB in dialogue = new dialogue.
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "#aaa" }}>
          p. {pageInfo.current} / {pageInfo.total}
        </div>
      </div>

      {/* scroll area */}
      <div
        ref={editorRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div 
          ref={pageRef}
          style={{
            background: "#fefbf5",
            border: "1px solid #0001",
            borderRadius: "6px",
            width: "100%",
            maxWidth: "720px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
            padding: "32px 46px 120px",
            fontFamily: "monospace",
          }}
        >

          
          {/* DND AREA */}
{isClient ? (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragEnd={handleDragEnd}
  >
    <SortableContext
      items={chunk.body.map((b) => b.id)}
      strategy={verticalListSortingStrategy}
    >
      <TransitionHeader
        value={sceneTransition}
        onChange={updateSceneTransition}
        options={transitionOptions}
      />

      {/* scene heading */}
      <div ref={sceneHeadingRef}>
      <SceneHeadingBlock
        slug={slug}
        onChangeSlug={updateSlugField}
        intExtOptions={["INT.", "EXT.", "INT./EXT.", "EST."]}
        timeOfDayOptions={[
          "DAY",
          "NIGHT",
          "LATER",
          "CONTINUOUS",
          "MORNING",
          "AFTERNOON",
        ]}
        locationOptions={allLocationOptions}
      />
      </div>


      {/* ghost at top */}
      <InsertBlockGhost
        onAddAction={() => addActionAtIndex(0)}
        onAddDialogue={() => addDialogueAtIndex(0)}
        onAddTransition={() => addTransitionAtIndex(0)}
        onPaste={() => pasteBlockAtIndex(0)}
      />

      {/* blocks */}
      {chunk.body.map((block, idx) => {
        // find previous speaker
        let previousSpeaker = "";
        for (let j = idx - 1; j >= 0; j--) {
          const b = chunk.body[j];
          if (b && b.type === "dialogueBlock" && b.character) {
            previousSpeaker = b.character;
            break;
          }
        }

        return (
          <div
            key={block.id || `blk-fallback-${idx}`}
            style={{ marginBottom: "16px" }}
          >
            <SortableBlockWrapper
              block={block}
              idx={idx}
              onUpdateBlock={updateBlockAt}
              onDeleteBlock={deleteBlockAt}
              onDuplicateBlock={duplicateBlockAt}
              onCopyBlock={copyBlockToClipboard}
              insertActionAfter={(i, opts) => addActionAtIndex(i + 1, opts)}
              insertDialogueAfter={(i, charToUse, opts) =>
                addDialogueAtIndex(i + 1, charToUse, opts)
              }
              characterOptions={allCharacterOptions}
              transitionOptions={transitionOptions}
              previousSpeaker={previousSpeaker}
              onAddSceneProp={addPropToChunk}
              onAddSceneCharacter={addCharacterToChunk}
              structureBeats={templateBeats}
              sceneId={chunk.id}
              estimateBlockPct={estimateBlockPct}
            />

            <InsertBlockGhost
              onAddAction={() => addActionAtIndex(idx + 1)}
              onAddDialogue={() => addDialogueAtIndex(idx + 1)}
              onAddTransition={() => addTransitionAtIndex(idx + 1)}
              onPaste={() => pasteBlockAtIndex(idx + 1)}
            />
          </div>
        );
      })}
      
    </SortableContext>
  </DndContext>
) : (
  <>
    {/* fallback render on server / before hydrate */}
    <SceneHeadingBlock
      slug={slug}
      onChangeSlug={updateSlugField}
      intExtOptions={["INT.", "EXT.", "INT./EXT.", "EST."]}
      timeOfDayOptions={[
        "DAY",
        "NIGHT",
        "LATER",
        "CONTINUOUS",
        "MORNING",
        "AFTERNOON",
      ]}
      locationOptions={allLocationOptions}
    />

    <InsertBlockGhost
      onAddAction={() => addActionAtIndex(0)}
      onAddDialogue={() => addDialogueAtIndex(0)}
      onAddTransition={() => addTransitionAtIndex(0)}
      onPaste={() => pasteBlockAtIndex(0)}
    />
    {chunk.body.map((block, idx) => (
      <div
        key={block.id || `blk-fallback-${idx}`}
        style={{ marginBottom: "16px" }}
      >
        <SortableBlockWrapper
          block={block}
          idx={idx}
          onUpdateBlock={updateBlockAt}
          onDeleteBlock={deleteBlockAt}
          onDuplicateBlock={duplicateBlockAt}
          onCopyBlock={copyBlockToClipboard}
          insertActionAfter={(i) => addActionAtIndex(i + 1)}
          insertDialogueAfter={(i, charToUse) =>
            addDialogueAtIndex(i + 1, charToUse)
          }
          characterOptions={allCharacterOptions}
          transitionOptions={transitionOptions}
          previousSpeaker={""}
        />
        <InsertBlockGhost
          onAddAction={() => addActionAtIndex(idx + 1)}
          onAddDialogue={() => addDialogueAtIndex(idx + 1)}
          onAddTransition={() => addTransitionAtIndex(idx + 1)}
          onPaste={() => pasteBlockAtIndex(idx + 1)}
        />
      </div>
    ))}
  </>
)}

        </div>
      </div>

      {/* floating controls */}
      <div
        style={{
          position: "absolute",
          right: "66px",
          bottom: "72px",
          display: "flex",
          gap: "8px",
          opacity: 0.35,
          transition: "opacity 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.35)}
      >
        <button onClick={handleNextScene} style={floatBtn}>
          Next scene ⟶
        </button>
        <button onClick={handleAddSceneAfter} style={floatBtn}>
          + New scene after
        </button>

        
      </div>

       {uiState?.showCrewPanel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "top",
            padding: "18px",
          }}
        >
          <div
            style={{
              width: "min(800px, 100%)",
              height: "min(80vh, 100%)",
              background: "#0f0f0f",
              border: "1px solid #333",
              borderRadius: "8px",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                borderBottom: "1px solid #222",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
              }}
            >
              <div style={{ fontWeight: 600 }}>Crew</div>
              <button onClick={closeCrewPanel} style={closeBtnStyle}>
                Close
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <CrewPanel />
            </div>
          </div>
        </div>
      )}

      {uiState?.showPropsPanel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "top",
            padding: "18px",
          }}
        >
          <div
            style={{
              width: "min(800px, 100%)",
              height: "min(80vh, 100%)",
              background: "#0f0f0f",
              border: "1px solid #333",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                borderBottom: "1px solid #222",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
              }}
            >
              <div style={{ fontWeight: 600 }}>Props</div>
              <button onClick={closePropsPanel} style={closeBtnStyle}>
                Close
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <PropPanel />
            </div>
          </div>
        </div>
      )}

      {uiState?.showWriterMode && <WriterMode />}
      

      
    </div>
  );
}
