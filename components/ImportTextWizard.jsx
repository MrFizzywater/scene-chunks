"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";

// how many non-empty lines to offer in the dropdowns
const MAX_CANDIDATES = 50;

export default function ImportTextWizard() {
  const {
    importWizardOpen,
    importWizardText,
    closeImportWizard,
    finalizeImportFromText,
  } = useProject();

  // split raw into lines once
  const allLines = useMemo(() => {
    if (!importWizardText) return [];
    return importWizardText.replace(/\r\n/g, "\n").split("\n");
  }, [importWizardText]);

  // make 2 parallel candidate lists (original + normalized), skip blanks
  const { candidatesOriginal, candidatesNormalized } = useMemo(() => {
    const orig = [];
    const norm = [];
    for (const line of allLines) {
      const n = normalizeLine(line);
      if (n.trim() === "") continue;
      orig.push(line); // keep original with indent
      norm.push(n); // what we show in dropdown
      if (orig.length >= MAX_CANDIDATES) break;
    }
    return { candidatesOriginal: orig, candidatesNormalized: norm };
  }, [allLines]);

  // user selections
  const [chosenTitle, setChosenTitle] = useState("");
  const [chosenAuthor, setChosenAuthor] = useState("");
  const [chosenScene, setChosenScene] = useState("");
  const [chosenCharacter, setChosenCharacter] = useState("");
  const [chosenParenthetical, setChosenParenthetical] = useState("");
  const [chosenDialogue, setChosenDialogue] = useState("");
  const [chosenTransition, setChosenTransition] = useState("");

  // auto-guess on open
  useEffect(() => {
    if (!importWizardOpen) return;
    if (!candidatesNormalized.length) return;

    // guess scene
    const sceneGuess =
      candidatesNormalized.find((l) =>
        /^(INT\.|EXT\.|INT\/EXT\.|INT\.\/EXT\.|EST\.)/i.test(l.trim())
      ) || "";

    // guess character
    const charGuess =
      candidatesNormalized.find((l) => isLikelyCharacter(l)) || "";

    // guess parenthetical
    const parenGuess =
      candidatesNormalized.find((l) => /^\(.*\)$/.test(l.trim())) || "";

    // guess transition
    const transitionGuess =
      candidatesNormalized.find((l) => isLikelyTransition(l)) || "";

    // title guess: first line if it isn't a scene
    const titleGuess =
      !/^(INT\.|EXT\.|INT\/EXT\.|EST\.)/i.test(candidatesNormalized[0])
        ? candidatesNormalized[0]
        : "";

    // author guess: within first few, all caps but not INT/EXT
    const authorGuess =
      candidatesNormalized.find(
        (l, idx) =>
          idx < 5 &&
          l === l.toUpperCase() &&
          !/^(INT\.|EXT\.|INT\/EXT\.|EST\.)/.test(l)
      ) || "";

    // dialogue guess: first non obvious line
    const dialogueGuess =
      candidatesNormalized.find(
        (l) =>
          !isLikelyScene(l) &&
          !isLikelyTransition(l) &&
          !isLikelyCharacter(l) &&
          !/^\(.*\)$/.test(l.trim())
      ) || "";

    setChosenTitle(titleGuess);
    setChosenAuthor(authorGuess);
    setChosenScene(sceneGuess);
    setChosenCharacter(charGuess);
    setChosenParenthetical(parenGuess);
    setChosenDialogue(dialogueGuess);
    setChosenTransition(transitionGuess);
  }, [importWizardOpen, candidatesNormalized]);

  if (!importWizardOpen) return null;

  const handleImport = () => {
    // figure out indent of the chosen character line (from original list)
    let characterIndent = null;
    if (chosenCharacter) {
      const idx = candidatesNormalized.findIndex((l) => l === chosenCharacter);
      if (idx !== -1) {
        const origLine = candidatesOriginal[idx] || "";
        const match = origLine.match(/^[ \t]+/);
        characterIndent = match
          ? match[0].replace(/\t/g, "    ").length
          : 0;
      }
    }

    const rules = {
      frontMatter: {
        title: chosenTitle || null,
        author: chosenAuthor || null,
      },
      scenes: chosenScene ? [chosenScene] : [],
      transitions: chosenTransition ? [chosenTransition] : [],
      characterLines: chosenCharacter ? [chosenCharacter] : [],
      parentheticals: chosenParenthetical ? [chosenParenthetical] : [],
      dialogueLines: chosenDialogue ? [chosenDialogue] : [],
      characterIndent,
    };

    const parsed = parseWholeDocument(allLines, rules);
    finalizeImportFromText(parsed);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "820px",
          maxHeight: "90vh",
          background: "#101010",
          border: "1px solid #333",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* header */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid #222",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "12px" }}>
            Import text – map your script elements
          </div>
          <button
            onClick={closeImportWizard}
            style={{
              background: "transparent",
              border: "1px solid #444",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* left: mapping */}
          <div style={{ width: "50%", padding: "10px", overflowY: "auto" }}>
            <Field
              label="Script Title"
              value={chosenTitle}
              onChange={setChosenTitle}
              options={candidatesNormalized}
            />
            <Field
              label="Author"
              value={chosenAuthor}
              onChange={setChosenAuthor}
              options={candidatesNormalized}
            />
            <Field
              label="Scene Heading"
              value={chosenScene}
              onChange={setChosenScene}
              options={candidatesNormalized}
            />
            <Field
              label="Character Name"
              value={chosenCharacter}
              onChange={setChosenCharacter}
              options={candidatesNormalized}
            />
            <Field
              label="Parenthetical"
              value={chosenParenthetical}
              onChange={setChosenParenthetical}
              options={candidatesNormalized}
            />
            <Field
              label="Dialogue Line"
              value={chosenDialogue}
              onChange={setChosenDialogue}
              options={candidatesNormalized}
            />
            <Field
              label="Transition"
              value={chosenTransition}
              onChange={setChosenTransition}
              options={candidatesNormalized}
            />
          </div>

          {/* right: preview lines */}
          <div
            style={{
              flex: 1,
              borderLeft: "1px solid #222",
              padding: "10px",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "6px" }}>
              First lines (for reference)
            </div>
            {candidatesNormalized.map((ln, i) => (
              <div
                key={i}
                style={{
                    borderBottom: "1px solid #161616",
                    padding: "2px 0",
                    whiteSpace: "pre-wrap",
                  }}
              >
                <span style={{ color: "#555" }}>{i + 1}.</span>{" "}
                {ln}
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            borderTop: "1px solid #222",
            padding: "8px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "6px",
          }}
        >
          <button
            onClick={handleImport}
            style={{
              background: "#41ff9d",
              border: "none",
              color: "#000",
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Import with these choices
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ small presentational field ------------------ */
function Field({ label, value, onChange, options }) {
  return (
    <label style={{ display: "block", marginBottom: "10px" }}>
      <div
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#888",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "#151515",
          border: "1px solid #333",
          color: "#fff",
          fontSize: "11px",
          padding: "3px 6px",
          borderRadius: "3px",
        }}
      >
        <option value="">-- none --</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------ helpers ------------------ */

function normalizeLine(line) {
  return line
    .replace(/\r/g, "")
    .replace(/^\t+/g, "")
    .replace(/^ {4,}/g, "");
}

function isLikelyScene(line) {
  const t = line.trim();
  return /^(INT\.|EXT\.|INT\/EXT\.|INT\.\/EXT\.|EST\.)/i.test(t);
}

function isLikelyCharacter(line) {
  const t = line.trim();
  return (
    t === t.toUpperCase() &&
    t.length > 0 &&
    t.length < 40 &&
    !isLikelyScene(t) &&
    !isLikelyTransition(t)
  );
}

function isLikelyTransition(line) {
  const t = line.trim();
  return (
    t === t.toUpperCase() &&
    (t.endsWith("TO:") ||
      t === "FADE OUT." ||
      t === "FADE IN:" ||
      t === "SMASH CUT:" ||
      t === "DISSOLVE TO:")
  );
}

/* ------------------------------------------------------------------ */
/*                   PARSER (indent-aware, adaptive)                  */
/* ------------------------------------------------------------------ */
function parseWholeDocument(lines, rules) {
  const scenes = [];
  let currentScene = null;
  let currentDialogue = null;
  let actionBuffer = [];

  // seed character indent from wizard, if provided
  let learnedCharIndent =
    typeof rules.characterIndent === "number"
      ? rules.characterIndent
      : null;

  const stripParens = (text) => {
    if (typeof text !== "string") return "";
    const m = text.trim().match(/^\((.*)\)$/);
    return m ? m[1].trim() : text.trim();
  };

  const finishActionBuffer = () => {
    if (!currentScene) return;
    if (actionBuffer.length === 0) return;
    const text = actionBuffer.join(" ").replace(/\s+$/g, "");
    if (text.trim() !== "") {
      currentScene.body.push({
        type: "action",
        text,
      });
    }
    actionBuffer = [];
  };

  const finishDialogue = () => {
    if (!currentScene) return;
    if (!currentDialogue) return;
    currentScene.body.push({
      type: "dialogueBlock",
      character: currentDialogue.character,
      parenthetical: currentDialogue.parenthetical,
      dialogue: currentDialogue.dialogue.trimEnd(),
    });
    currentDialogue = null;
  };

  const looksLikeScene = (raw) => {
    if (rules.scenes?.includes(raw)) return true;
    if (isLikelyScene(raw)) return true;
    return false;
  };

  const looksLikeTransition = (raw) => {
    if (rules.transitions?.includes(raw)) return true;
    if (isLikelyTransition(raw)) return true;
    return false;
  };

  const looksLikeCharacter = (raw) => {
    if (rules.characterLines?.includes(raw)) return true;
    if (isLikelyCharacter(raw)) return true;
    return false;
  };

  const looksLikeParenthetical = (raw) => {
    if (rules.parentheticals?.includes(raw)) return true;
    if (/^\(.*\)$/.test(raw.trim())) return true;
    return false;
  };

  lines.forEach((line) => {
    // original line with indent
    const original = line.replace(/\r/g, "");
    // normalized
    const raw = normalizeLine(line);
    const trimmed = raw.trim();

    // measure indent from original
    const indentMatch = original.match(/^[ \t]+/);
    const indentStr = indentMatch ? indentMatch[0] : "";
    const indentWidth = indentStr.replace(/\t/g, "    ").length;

    // skip front-matter lines
    if (
      rules.frontMatter &&
      (trimmed === (rules.frontMatter.title || "") ||
        trimmed === (rules.frontMatter.author || ""))
    ) {
      return;
    }

    // new scene?
    if (trimmed && looksLikeScene(trimmed)) {
      if (currentScene) {
        finishDialogue();
        finishActionBuffer();
        currentScene.body = mergeAdjacentActions(currentScene.body);
        scenes.push(currentScene);
      }
      currentScene = {
        title: trimmed.toUpperCase(),
        body: [],
        characters: [],
        props: [],
      };
      return;
    }

    if (!currentScene) {
      currentScene = {
        title: "UNTITLED SCENE",
        body: [],
        characters: [],
        props: [],
      };
    }

    // blank line
    if (trimmed === "") {
      finishDialogue();
      finishActionBuffer();
      return;
    }

    // transition
    if (looksLikeTransition(trimmed)) {
      finishDialogue();
      finishActionBuffer();
      currentScene.body.push({
        type: "transition",
        text: trimmed.toUpperCase(),
      });
      return;
    }

    // character? (adaptive with wizard-seeded indent)
    if (looksLikeCharacter(trimmed)) {
      let isCharacter = false;

      if (learnedCharIndent == null) {
        // first char-like line
        isCharacter = true;
        learnedCharIndent = indentWidth;
      } else {
        const closeToLearned = Math.abs(indentWidth - learnedCharIndent) <= 4;
        const verySmall = indentWidth <= 2;
        if (closeToLearned || verySmall) {
          isCharacter = true;
        }
      }

      if (isCharacter) {
        finishDialogue();
        finishActionBuffer();
        currentDialogue = {
          character: trimmed,
          parenthetical: "",
          dialogue: "",
        };
        if (!currentScene.characters.includes(trimmed)) {
          currentScene.characters.push(trimmed);
        }
        return;
      }
      // otherwise fall through to action
    }

    // parenthetical
    if (
      looksLikeParenthetical(trimmed) &&
      currentDialogue &&
      !currentDialogue.parenthetical
    ) {
      currentDialogue.parenthetical = stripParens(trimmed);
      return;
    }

    // dialogue (join with spaces)
    if (currentDialogue) {
      const lineText = raw.trim();
      currentDialogue.dialogue +=
        (currentDialogue.dialogue ? " " : "") + lineText;
      return;
    }

    // action
    actionBuffer.push(raw);
  });

  // flush last scene
  if (currentScene) {
    finishDialogue();
    finishActionBuffer();
    currentScene.body = mergeAdjacentActions(currentScene.body);
    scenes.push(currentScene);
  }

  return {
    scenes,
    frontMatter: {
      title: rules.frontMatter?.title || "",
      author: rules.frontMatter?.author || "",
    },
  };
}

// merge action -> action -> action into single action blocks
function mergeAdjacentActions(body) {
  if (!Array.isArray(body) || body.length === 0) return body;
  const out = [];
  let pendingAction = null;

  body.forEach((b) => {
    if (b.type === "action") {
      if (!pendingAction) {
        pendingAction = { ...b };
      } else {
        pendingAction.text =
          pendingAction.text.trimEnd() +
          "\n\n" +
          (b.text || "").trim();
      }
    } else {
      if (pendingAction) {
        out.push(pendingAction);
        pendingAction = null;
      }
      out.push(b);
    }
  });

  if (pendingAction) out.push(pendingAction);

  return out;
}
