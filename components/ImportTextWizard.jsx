"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext.js";

const MAX_CANDIDATES = 150;
const MARKER_SOURCE = "[source:";
const MARKER_BRACKET_CLOSE = "]";

export default function ImportTextWizard() {
  const {
    importWizardOpen,
    importWizardText,
    closeImportWizard,
    finalizeImportFromText,
  } = useProject();

  // 1. Split raw text into lines
  const allLines = useMemo(() => {
    if (!importWizardText) return [];
    return importWizardText.split("\n");
  }, [importWizardText]);

  // 2. Prepare candidates for the UI dropdowns
  const { candidatesOriginal, candidatesNormalized } = useMemo(() => {
    const orig = [];
    const norm = [];
    for (const line of allLines) {
      const n = normalizeLine(line);
      if (n.trim() === "") continue;
      orig.push(line);
      norm.push(n);
      if (orig.length >= MAX_CANDIDATES) break;
    }
    return { candidatesOriginal: orig, candidatesNormalized: norm };
  }, [allLines]);

  // 3. User Selections
  const [chosenTitle, setChosenTitle] = useState("");
  const [chosenAuthor, setChosenAuthor] = useState("");
  const [chosenScene, setChosenScene] = useState("");
  const [chosenCharacter, setChosenCharacter] = useState("");
  const [chosenParenthetical, setChosenParenthetical] = useState("");
  const [chosenDialogue, setChosenDialogue] = useState("");
  const [chosenTransition, setChosenTransition] = useState("");

  // 4. Auto-guess on open
  useEffect(() => {
    if (!importWizardOpen) return;
    if (!candidatesNormalized.length) return;

    const sceneGuess = candidatesNormalized.find(l => isLikelyScene(l)) || "";
    const charGuess = candidatesNormalized.find(l => isLikelyCharacter(l)) || "";
    const parenGuess = candidatesNormalized.find(l => isLikelyParenthetical(l)) || "";
    const transitionGuess = candidatesNormalized.find(l => isLikelyTransition(l)) || "";

    // Title guess
    const titleGuess = !isLikelyScene(candidatesNormalized[0])
      ? candidatesNormalized[0]
      : "";

    // Author guess
    const authorGuess = candidatesNormalized.find((l, idx) => 
      idx < 10 && 
      (l.toLowerCase().includes("by") || (isAllCaps(l) && l.length < 30)) &&
      !isLikelyScene(l)
    ) || "";

    // Dialogue guess
    const dialogueGuess = candidatesNormalized.find(l => 
      !isLikelyScene(l) && 
      !isLikelyTransition(l) && 
      !isLikelyCharacter(l) && 
      !isLikelyParenthetical(l)
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
    let characterIndent = null;
    if (chosenCharacter) {
      const idx = candidatesNormalized.findIndex((l) => l === chosenCharacter);
      if (idx !== -1) {
        const origLine = candidatesOriginal[idx] || "";
        // Calculate indent manually (tabs=4 spaces)
        let spaces = 0;
        for (let i = 0; i < origLine.length; i++) {
            if (origLine[i] === " ") spaces++;
            else if (origLine[i] === "\t") spaces += 4;
            else break;
        }
        characterIndent = spaces;
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
        background: "rgba(0,0,0,0.8)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "900px",
          maxHeight: "90vh",
          background: "#111",
          border: "1px solid #333",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: "#eee"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #222",
            background: "#1a1a1a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>
            Import Script Text
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={closeImportWizard}
              style={{
                background: "transparent",
                border: "1px solid #444",
                color: "#ccc",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              style={{
                background: "linear-gradient(180deg, #41ff9d, #2dbd70)",
                border: "none",
                color: "#000",
                padding: "6px 16px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Analyze & Import
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ width: "40%", padding: "16px", overflowY: "auto", background: "#111" }}>
            <div style={{marginBottom:"16px", fontSize:"12px", color:"#888", lineHeight:"1.4"}}>
              We tried to detect your format. Adjust the dropdowns if we picked the wrong lines.
            </div>
            <Field label="Script Title" value={chosenTitle} onChange={setChosenTitle} options={candidatesNormalized} />
            <Field label="Author" value={chosenAuthor} onChange={setChosenAuthor} options={candidatesNormalized} />
            <hr style={{borderColor:"#333", margin:"16px 0"}}/>
            <Field label="Scene Heading" value={chosenScene} onChange={setChosenScene} options={candidatesNormalized} />
            <Field label="Character Name" value={chosenCharacter} onChange={setChosenCharacter} options={candidatesNormalized} />
            <Field label="Transition" value={chosenTransition} onChange={setChosenTransition} options={candidatesNormalized} />
          </div>

          <div
            style={{
              flex: 1,
              borderLeft: "1px solid #222",
              padding: "16px",
              overflowY: "auto",
              background: "#0e0e0e",
              fontFamily: "monospace",
              fontSize: "12px"
            }}
          >
            <div style={{ color: "#666", marginBottom: "8px" }}>Preview:</div>
            {candidatesNormalized.map((ln, i) => (
              <div
                key={i}
                style={{
                    borderBottom: "1px solid #1a1a1a",
                    padding: "2px 0",
                    whiteSpace: "pre-wrap",
                    color: ln === chosenScene ? "#4f9" : 
                           ln === chosenCharacter ? "#fb8" : 
                           ln === chosenTransition ? "#d8f" : "#aaa"
                  }}
              >
                <span style={{ color: "#444", marginRight:"8px", userSelect:"none" }}>{i + 1}</span>
                {ln}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, options }) {
  return (
    <label style={{ display: "block", marginBottom: "12px" }}>
      <div style={{fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: "4px", fontWeight: "bold"}}>
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "#222", border: "1px solid #444", color: "#fff", fontSize: "12px", padding: "6px 8px", borderRadius: "4px", outline: "none" }}
      >
        <option value="">-- Select --</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt.length > 60 ? opt.substring(0,60) + "..." : opt}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ==========================================================================
   STRING HELPERS (NO REGEX)
   ========================================================================== */

function normalizeLine(line) {
  let text = line;
  // Manually remove [source: ...] if present
  // (Using simple string methods to avoid build parser errors)
  const idx = text.indexOf(MARKER_SOURCE);
  if (idx !== -1) {
    const endIdx = text.indexOf(MARKER_BRACKET_CLOSE, idx);
    if (endIdx > -1) {
        text = text.substring(endIdx + 1);
    }
  }
  return text.trim();
}

function isAllCaps(text) {
  if (!text) return false;
  const upper = text.toUpperCase();
  return text === upper && text.toLowerCase() !== upper;
}

function isLikelyScene(line) {
  const t = line.trim().toUpperCase();
  const starts = ["INT.", "EXT.", "INT./EXT.", "I/E.", "EST.", "INT/EXT"];
  for (const s of starts) {
    if (t.startsWith(s)) return true;
  }
  return false;
}

function isLikelyCharacter(line) {
  const t = line.trim();
  if (!t) return false;
  if (!isAllCaps(t)) return false;
  if (t.length > 50) return false;
  if (isLikelyScene(t)) return false;
  if (isLikelyTransition(t)) return false;
  return true;
}

function isLikelyTransition(line) {
  const t = line.trim();
  if (!isAllCaps(t)) return false;
  
  if (t.endsWith("TO:")) return true;
  
  const known = ["FADE IN", "FADE OUT", "BLACK OUT", "DISSOLVE", "SMASH CUT"];
  for (let k of known) {
    if (t.includes(k)) return true;
  }
  return false;
}

function isLikelyParenthetical(line) {
  const t = line.trim();
  return t.startsWith("(") && t.endsWith(")");
}

function looksLikeBeat(line) {
  const t = line.trim();
  if (t.startsWith("[[") && t.endsWith("]]")) return true;
  if (t.startsWith(">") && t.endsWith("<")) return true;
  return false;
}

function cleanCharacterName(raw) {
  if (!raw) return "";
  const idx = raw.indexOf("(");
  if (idx > -1) {
    return raw.substring(0, idx).trim();
  }
  return raw.trim();
}

function cleanBeatName(raw) {
  let t = raw.trim();
  if (t.startsWith("[[")) t = t.substring(2);
  if (t.endsWith("]]")) t = t.substring(0, t.length - 2);
  if (t.startsWith(">")) t = t.substring(1);
  if (t.endsWith("<")) t = t.substring(0, t.length - 1);
  return t.trim().toUpperCase();
}

/* ==========================================================================
   MAIN PARSER
   ========================================================================== */

function parseWholeDocument(lines, rules) {
  const scenes = [];
  let currentScene = null;
  let currentDialogue = null;
  let actionBuffer = [];
  
  let scriptStarted = false;
  let pendingSceneTransition = null;
  const knownCharacters = new Set();
  let learnedCharIndent = typeof rules.characterIndent === "number" ? rules.characterIndent : null;

  // Indent helper
  const getIndent = (lineStr) => {
     let count = 0;
     for (let i = 0; i < lineStr.length; i++) {
       const c = lineStr[i];
       if (c === " ") count++;
       else if (c === "\t") count += 4;
       else break;
     }
     return count;
  };

  const finishActionBuffer = () => {
    if (!currentScene) return;
    if (actionBuffer.length === 0) return;
    const text = actionBuffer.join(" ").trim();
    if (text) {
      currentScene.body.push({ type: "action", text });
      detectEntitiesInAction(text, currentScene, knownCharacters);
    }
    actionBuffer = [];
  };

  const finishDialogue = () => {
    if (!currentScene) return;
    if (!currentDialogue) return;
    
    const cleanName = cleanCharacterName(currentDialogue.character);
    
    currentScene.body.push({
      type: "dialogueBlock",
      character: currentDialogue.character,
      parenthetical: currentDialogue.parenthetical,
      dialogue: currentDialogue.dialogue.trimEnd(),
    });

    if (cleanName.includes("&")) {
        const parts = cleanName.split("&");
        parts.forEach(p => knownCharacters.add(p.trim()));
        parts.forEach(p => {
            const pt = p.trim();
            if (!currentScene.characters.includes(pt)) currentScene.characters.push(pt);
        });
    } else if (cleanName.includes(" AND ")) {
        const parts = cleanName.split(" AND ");
        parts.forEach(p => knownCharacters.add(p.trim()));
        parts.forEach(p => {
            const pt = p.trim();
            if (!currentScene.characters.includes(pt)) currentScene.characters.push(pt);
        });
    } else {
        knownCharacters.add(cleanName);
        if (!currentScene.characters.includes(cleanName)) currentScene.characters.push(cleanName);
    }
    
    currentDialogue = null;
  };


  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = normalizeLine(rawLine); 
    
    // Calculate indent
    let cleanRaw = rawLine;
    const idx = cleanRaw.indexOf(MARKER_SOURCE);
    if(idx > -1) {
         const endIdx = cleanRaw.indexOf(MARKER_BRACKET_CLOSE, idx);
         if(endIdx > -1) cleanRaw = cleanRaw.substring(endIdx + 1);
    }
    const indentWidth = getIndent(cleanRaw);

    // 1. FRONT MATTER SKIPPING
    if (!scriptStarted) {
       if (isLikelyScene(trimmed) || trimmed === "FADE IN:") {
         scriptStarted = true;
       } else {
         continue;
       }
    }

    // 2. SCENE HEADING
    if (trimmed && isLikelyScene(trimmed)) {
      if (currentScene) {
        finishDialogue();
        finishActionBuffer();
        currentScene.body = mergeAdjacentActions(currentScene.body);
        scenes.push(currentScene);
      }
      
      currentScene = {
        title: trimmed.toUpperCase(),
        transition: pendingSceneTransition || "", 
        body: [],
        characters: [],
        props: [],
        plotTracks: [],
        anchorRole: null
      };
      
      pendingSceneTransition = null;

      if(trimmed.includes("EXT.")) currentScene.tags = ["Exterior"];
      else if(trimmed.includes("INT.")) currentScene.tags = ["Interior"];

      continue;
    }

    if (!currentScene) {
        currentScene = { title: "START", transition: "", body: [], characters: [], props: [], plotTracks: [], anchorRole: null };
    }

    // 3. BLANK LINE
    if (trimmed === "") {
      finishDialogue();
      finishActionBuffer();
      continue;
    }

    // 4. TRANSITION
    if (isLikelyTransition(trimmed)) {
      finishDialogue();
      finishActionBuffer();

      let isPreScene = false;
      // Peek ahead
      for (let k = i + 1; k < lines.length; k++) {
        const nextNorm = normalizeLine(lines[k]);
        if (nextNorm === "") continue;
        if (isLikelyScene(nextNorm)) {
          isPreScene = true;
        }
        break;
      }

      if (isPreScene) {
        pendingSceneTransition = trimmed.toUpperCase();
      } else {
        currentScene.body.push({
          type: "transition",
          text: trimmed.toUpperCase(),
        });
      }
      continue;
    }

    // 5. BEAT MARKER
    if (looksLikeBeat(trimmed)) {
        finishDialogue();
        finishActionBuffer();
        const beatName = cleanBeatName(trimmed);
        
        let role = null;
        if(beatName.includes("INCITING")) role = "inciting-incident";
        else if(beatName.includes("ACT ONE") || beatName.includes("BREAK INTO 2")) role = "break-into-2";
        else if(beatName.includes("MIDPOINT")) role = "midpoint";
        else if(beatName.includes("ACT TWO") || beatName.includes("BREAK INTO 3")) role = "break-into-3";
        else if(beatName.includes("CLIMAX")) role = "climax";
        
        if(role) currentScene.anchorRole = role;
        else currentScene.notes = (currentScene.notes || "") + "\n" + beatName;
        continue;
    }

    // 6. CHARACTER
    if (isLikelyCharacter(trimmed)) {
      let isCharacter = false;
      if (learnedCharIndent == null) {
        isCharacter = true;
        learnedCharIndent = indentWidth;
      } else {
        const diff = Math.abs(indentWidth - learnedCharIndent);
        if (diff <= 8) isCharacter = true;
      }

      if (isCharacter) {
        finishDialogue();
        finishActionBuffer();
        currentDialogue = { character: trimmed, parenthetical: "", dialogue: "" };
        continue;
      }
    }

    // 7. PARENTHETICAL
    if (isLikelyParenthetical(trimmed) && currentDialogue && !currentDialogue.parenthetical) {
      const stripped = trimmed.substring(1, trimmed.length - 1).trim();
      currentDialogue.parenthetical = stripped;
      continue;
    }

    // 8. DIALOGUE
    if (currentDialogue) {
      currentDialogue.dialogue += (currentDialogue.dialogue ? " " : "") + trimmed;
      continue;
    }

    // 9. ACTION
    actionBuffer.push(trimmed);
  }

  if (currentScene) {
    finishDialogue();
    finishActionBuffer();
    currentScene.body = mergeAdjacentActions(currentScene.body);
    scenes.push(currentScene);
  }

  // SECOND PASS: Implicit Characters
  scenes.forEach(scene => {
      const actionText = scene.body
        .filter(b => b.type === "action")
        .map(b => b.text)
        .join(" ");
      
      knownCharacters.forEach(charName => {
          if(!scene.characters.includes(charName)) {
             if (actionText.includes(charName)) {
                const idx = actionText.indexOf(charName);
                const charAfter = actionText[idx + charName.length];
                const isWordEnd = !charAfter || (charAfter.toUpperCase() === charAfter.toLowerCase());
                
                if (isWordEnd) {
                   scene.characters.push(charName);
                }
             }
          }
      });
  });

  return {
    scenes,
    frontMatter: {
      title: rules.frontMatter?.title || "",
      author: rules.frontMatter?.author || "",
    },
  };
}

function detectEntitiesInAction(text, scene, knownChars) {
    const words = text.split(" ");
    const STOP_WORDS = ["INT", "EXT", "DAY", "NIGHT", "CONTINUOUS", "MOMENTS", "LATER", "THE", "AND", "CUT", "FADE", "TO", "BACK", "VIEW", "ANGLE"];

    words.forEach(w => {
        let cleanW = w;
        // Strip trailing punctuation
        while (cleanW.length > 0 && ",.!?;:".includes(cleanW[cleanW.length-1])) {
            cleanW = cleanW.substring(0, cleanW.length - 1);
        }

        if (cleanW.length < 3) return;
        if (!isAllCaps(cleanW)) return;
        if (STOP_WORDS.includes(cleanW)) return;
        if (knownChars.has(cleanW)) return;

        if (!scene.props.includes(cleanW) && !scene.characters.includes(cleanW)) {
            scene.props.push(cleanW);
        }
    });
}

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