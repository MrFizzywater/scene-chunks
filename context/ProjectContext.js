"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";

// ------------------------------------------------------------------
// DUMMY INITIAL DATA — WELCOME PROJECT
// ------------------------------------------------------------------
const initialProject = {
  id: "proj_demo",
  title: "Welcome to Scene Chunks!",
  logline: "A quick tour of the interface.",
  settings: {
    activeScriptId: "script_main",
    activeSkinId: "DEFAULT",
  },
  meta: {
    author: "",
    email: "",
    company: "",
    draftDate: "2025-11-21",
  },
  chunks: ["chunk_welcome"],
  scripts: ["script_main"],
};

const initialChunksById = {
  chunk_welcome: {
    id: "chunk_welcome",
    title: "INT. SCENE CHUNKS - DAY",
    body: [
      {
        type: "action",
        text: `Welcome! This is a sample scene chunk.
        
Scene Chunks lets you build your screenplay as modular pieces (“chunks”). 
Each chunk contains action, dialogue, transitions, and tags you can rearrange at any time.`,
        id: "blk_mi9gffxj_1",
      },
      {
        id: "blk_mi9gffxj_2",
        type: "dualDialogue",
        left: {
          character: "GIRL",
          parenthetical: "",
          dialogue:
            "• The sidebar lists all your scenes  \n \n• The bottom bar shows your script structure  \n\n• The Writer button will remove distractions and let you get in the zone",
        },
        right: {
          character: "BOY",
          parenthetical: "",
          dialogue:
            "\n• The editor shows the selected scene \n\n• Panels on the side handle Characters, Props, & Crew\n\n• And when you're ready to see your masterpiece, click the Preview Button. ",
        },
        status: "draft",
      },
      {
        type: "action",
        text: "👉 When you're ready, delete this chunk or click **BLANK PROJECT** to start fresh.",
        id: "blk_mi9gffxj_3",
      },
      {
        id: "blk_mi9gi4y8_4",
        type: "dialogueBlock",
        character: "Narrator V/O",
        parenthetical: "",
        dialogue:
          "This demo chunk exists only to show the interface. Feel free to delete it.",
        status: "draft",
      },
    ],
    characters: [],
    props: ["BLANK PROJECT"],
    emotionalBeat: "",
    status: "info",
    tags: ["Welcome"],
    estPageLength: 0.3,
    notes: "",
    anchorRole: null,
    locked: false,
  },
};

const initialScriptsById = {
  script_main: {
    id: "script_main",
    name: "Main Draft",
    chunkOrder: ["chunk_welcome"],
    structureTemplate: null,
    anchors: [],
  },
};



// ------------------------------------------------------------------
// Helper to generate new unique chunk IDs
// ------------------------------------------------------------------
const makeId = (prefix = "chunk") =>
  prefix + "_" + Math.random().toString(36).slice(2, 8);





// ------------------------------------------------------------------
// STORAGE KEY
// ------------------------------------------------------------------
const STORAGE_KEY = "scenechunks-project-v3";

// ------------------------------------------------------------------
// CONTEXT
// ------------------------------------------------------------------
const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  // --------------- STATE ---------------
  const [project, setProject] = useState(initialProject);
  const [chunksById, setChunksById] = useState(initialChunksById);
  const [scriptsById, setScriptsById] = useState(initialScriptsById);
  const [selectedChunkId, setSelectedChunkId] = useState("chunk_welcome");
  const [saveStatus, setSaveStatus] = useState("saved");
  const [deletedScenes, setDeletedScenes] = useState([]); // 🗑

  const [uiState, setUiState] = useState({
    showCharacterPanel: false,
    showCrewPanel: false,
    showPropsPanel: false,
    selectedCharacterName: null,
    selectedPropName: null,
    showWriterMode: false,
  });


  // --------------- LOAD FROM STORAGE ---------------
useEffect(() => {
  // 1) try localStorage
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.project) setProject(data.project);
      if (data.chunksById) setChunksById(data.chunksById);
      if (data.scriptsById) setScriptsById(data.scriptsById);
      if (data.selectedChunkId) setSelectedChunkId(data.selectedChunkId);
      if (data.deletedScenes) setDeletedScenes(data.deletedScenes);
      if (data.uiState) setUiState(data.uiState);
      // ✅ we loaded from local — we can bail here
      return;
    }
  } catch (err) {
    console.warn("Could not load from localStorage, will try default:", err);
  }

  // 2) otherwise fall back to your default JSON
  fetch("./projects/Welcome_to_Scene_Chunks_.scenechunks.json")
    .then((res) => res.json())
    .then((data) => {
      if (data.project) setProject(data.project);
      if (data.chunksById) setChunksById(data.chunksById);
      if (data.scriptsById) setScriptsById(data.scriptsById);
      if (data.selectedChunkId) setSelectedChunkId(data.selectedChunkId);
      if (data.deletedScenes) setDeletedScenes(data.deletedScenes);
      if (data.uiState) setUiState(data.uiState);
    })
    .catch((err) =>
      console.warn("Could not load default project JSON:", err)
    );
}, []);





  // --------------- SAVE TO STORAGE ---------------
  useEffect(() => {
    const payload = {
      project,
      chunksById,
      scriptsById,
      selectedChunkId,
      deletedScenes,
      uiState,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("Could not save Scene Chunks data:", err);
    }
  }, [project, chunksById, scriptsById, selectedChunkId, deletedScenes, uiState]);


  
  // --------------- HELPERS ---------------

// -----------------------------------------------------------
// PARSE SCREENPLAY TEXT
// - pulls title-page-ish stuff into `front`
// - turns body into scene chunks with action/dialogue/transition
// - parses scene headings into sceneType / sceneLocation / sceneTime
// -----------------------------------------------------------
// --- helper: split a screenplay-style scene heading into parts ---



function parseSceneHeadingLine(line) {
  const upper = line.trim().toUpperCase();

  // what we consider valid starts
  const HEADING_PREFIXES = ["INT.", "EXT.", "INT./EXT.", "INT/EXT.", "EST."];

  let intExt = "INT.";
  let rest = upper;

  for (const prefix of HEADING_PREFIXES) {
    if (upper.startsWith(prefix)) {
      intExt = prefix;
      rest = upper.slice(prefix.length).trim();
      break;
    }
  }

  // possible times we recognize
  const TIME_WORDS = [
    "DAY",
    "NIGHT",
    "LATER",
    "MOMENTS LATER",
    "CONTINUOUS",
    "SAME",
    "DAWN",
    "DUSK",
    "EVENING",
    "MORNING",
    "AFTERNOON",
  ];

  let location = rest;
  let timeOfDay = "DAY";

  // many scripts do LOCATION - TIME
  if (rest.includes(" - ")) {
    const parts = rest.split(" - ").map((p) => p.trim());
    const maybeTime = parts[parts.length - 1];
    if (TIME_WORDS.includes(maybeTime)) {
      timeOfDay = maybeTime;
      location = parts.slice(0, -1).join(" - ").trim();
    } else {
      // not a recognized time → whole thing is location
      location = rest;
    }
  } else {
    location = rest;
  }

  return {
    slug: {
      intExt,
      location,
      timeOfDay,
    },
    title: `${intExt} ${location} - ${timeOfDay}`,
  };
}

// turn a raw .txt screenplay-ish file into our internal project shape
// turn a raw .txt screenplay-ish file into front matter + scene chunks
// turn a raw .txt screenplay-ish file into front matter + scene chunks
function parseScreenplayText(rawText) {
  const lines = rawText.split(/\r?\n/);

  const scenes = [];
  let currentScene = null;

  // front-page-ish info
  let sawFirstScene = false;
  const front = {
    title: "",
    author: "",
    email: "",
    company: "",
    draftDate: "",
  };

  // we'll reuse this inside scenes
  let actionBuffer = [];

  // helper to flush buffered action into current scene
  const flushAction = () => {
    if (!currentScene) return;
    const joined = actionBuffer.join("\n");
    const normalized = joined
      .split("\n")
      .map((l) => l.replace(/^\s+/, "")) // kill leading spaces
      .join(" ")
      .trim();
    if (normalized) {
      currentScene.body.push({
        id: makeId("blk"),
        type: "action",
        text: normalized,
        status: "draft",
      });
    }
    actionBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const lineRaw = lines[i];
    const lineTrimEnd = lineRaw.trimEnd();
    const trimmed = lineTrimEnd.trim();
    const upperTrim = trimmed.toUpperCase();

    const looksLikeHeading =
      upperTrim.startsWith("INT.") ||
      upperTrim.startsWith("EXT.") ||
      upperTrim.startsWith("INT./EXT.") ||
      upperTrim.startsWith("INT/EXT.") ||
      upperTrim.startsWith("EST.");

    // ------------- FRONT MATTER -------------
    if (!sawFirstScene) {
      if (looksLikeHeading) {
        sawFirstScene = true;
        // fall through to "start scene" below
      } else {
        // collect guesses
        if (!front.title && trimmed && trimmed === trimmed.toUpperCase()) {
          front.title = trimmed;
        } else if (!front.author && /by/i.test(trimmed)) {
          const next = (lines[i + 1] || "").trim();
          if (next) front.author = next;
        } else if (!front.email && trimmed.includes("@")) {
          front.email = trimmed;
        } else if (!front.draftDate && /\d{4}/.test(trimmed)) {
          front.draftDate = trimmed;
        } else if (!front.company && trimmed && trimmed.length < 40) {
          front.company = trimmed;
        }
        continue;
      }
    }

    // ------------- START NEW SCENE -------------
    if (looksLikeHeading) {
      // flush any stray action from previous scene
      flushAction();

      const { slug, title } = parseSceneHeadingLine(lineTrimEnd);

      currentScene = {
        id: makeId("chunk"),
        title,
        slug, // { intExt, location, timeOfDay }
        body: [],
        characters: [],
        props: [],
        emotionalBeat: "",
        status: "draft",
        tags: [],
        estPageLength: 1,
        notes: "",
        anchorRole: null,
        locked: false,
      };
      scenes.push(currentScene);
      continue;
    }

    // ------------- INSIDE A SCENE -------------
    if (currentScene) {
      // blank line → paragraph break
      if (!trimmed) {
        flushAction();
        continue;
      }

      // possible dialogue
      const isAllCaps =
        trimmed === trimmed.toUpperCase() &&
        trimmed.length <= 40 &&
        !trimmed.startsWith("(");

      const nextLine = (lines[i + 1] || "").trim();
      const nextIsParen = nextLine.startsWith("(") && nextLine.endsWith(")");

      if (isAllCaps) {
        // character → flush previous action first
        flushAction();

        const charName = trimmed;
        const dialogueBlock = {
          id: makeId("blk"),
          type: "dialogueBlock",
          character: charName,
          parenthetical: "",
          dialogue: "",
          status: "draft",
        };

        if (nextIsParen) {
          dialogueBlock.parenthetical = nextLine.slice(1, -1).trim();
          i++; // consume paren
        }

        // collect dialogue lines
        const diaLines = [];
        let j = i + 1;
        while (j < lines.length) {
          const peekRaw = lines[j];
          const peek = peekRaw.trim();
          const peekUpper = peek.toUpperCase();
          const peekIsHeading =
            peekUpper.startsWith("INT.") ||
            peekUpper.startsWith("EXT.") ||
            peekUpper.startsWith("INT./EXT.") ||
            peekUpper.startsWith("INT/EXT.") ||
            peekUpper.startsWith("EST.");

          if (!peek) break;
          if (peekIsHeading) break;
          if (
            peek === peek.toUpperCase() &&
            peek.length <= 40 &&
            !peek.startsWith("(")
          )
            break;

          diaLines.push(peek);
          j++;
        }
        dialogueBlock.dialogue = diaLines.join(" ").trim();
        currentScene.body.push(dialogueBlock);

        // add character to scene list
        if (!currentScene.characters.includes(charName)) {
          currentScene.characters.push(charName);
        }

        // jump ahead
        i = j - 1;
        continue;
      }

      // transitions
      if (
        trimmed.endsWith("TO:") ||
        trimmed === "FADE OUT." ||
        trimmed === "FADE IN:"
      ) {
        flushAction();
        currentScene.body.push({
          id: makeId("blk"),
          type: "transition",
          text: trimmed,
          status: "draft",
        });
        continue;
      }

      // otherwise it's ACTION → buffer it
      actionBuffer.push(lineRaw);
    }
  }

  // flush tail action
  flushAction();

  return {
    front,
    scenes,
  };
}





// -----------------------------------------------------------
// Importer that applies front matter to project and then
// inserts parsed scenes as chunks.
// -----------------------------------------------------------
  const openWriterMode = () => {
    setUiState((prev) => ({
      ...prev,
      showWriterMode: true,
    }));
  };

  const closeWriterMode = () => {
    setUiState((prev) => ({
      ...prev,
      showWriterMode: false,
    }));
  };

  const openCharacterPanel = (name = null) => {
    setUiState((prev) => ({
      ...prev,
      showCharacterPanel: true,
      selectedCharacterName: name,
    }));
  };

  const closeCharacterPanel = () => {
    setUiState((prev) => ({
      ...prev,
      showCharacterPanel: false,
      selectedCharacterName: null,
    }));
  };

  const openPropsPanel = (name = null) => {
    setUiState((prev) => ({
      ...prev,
      showPropsPanel: true,
      selectedPropName: name,
    }));
  };

  const closePropsPanel = () => {
    setUiState((prev) => ({
      ...prev,
      showPropsPanel: false,
      selectedPropName: null,
    }));
  };

  const openCrewPanel = () => {
    setUiState((prev) => ({ ...prev, showCrewPanel: true }));
  };
  const closeCrewPanel = () => {
    setUiState((prev) => ({ ...prev, showCrewPanel: false }));
  };
  const updateProjectTitle = useCallback((newTitle) => {
    setProject((prev) => ({
      ...prev,
      title: newTitle,
    }));
  }, []);

  const updateProjectMeta = useCallback((patch) => {
    setProject((prev) => ({
      ...prev,
      meta: {
        ...(prev.meta || {}),
        ...patch,
      },
    }));
  }, []);

  
  const importFromText = (text) => {
    setImportWizardText(text);
    setImportWizardOpen(true);
  };

  const closeImportWizard = () => {
    setImportWizardOpen(false);
    setImportWizardText("");
  };

  function parseSceneHeading(raw) {
    if (typeof raw !== "string") {
      return {
        intExt: "INT.",
        location: "",
        timeOfDay: "DAY",
      };
    }

    const txt = raw.trim();

    // 1) basic match
    const m = txt.match(
      /^(INT\.|EXT\.|INT\/EXT\.|INT\.\/EXT\.|EST\.)\s+(.+?)(?:\s+-\s+(.+))?$/i
    );

    // known time-of-day words we like to end on
    const TIME_WORDS = [
      "DAY",
      "NIGHT",
      "LATER",
      "MORNING",
      "AFTERNOON",
      "EVENING",
      "CONTINUOUS",
      "DAWN",
      "DUSK",
    ];

    if (m) {
      const intExt = m[1].toUpperCase();
      const middle = (m[2] || "").toUpperCase();
      const tail = (m[3] || "").toUpperCase();

      // if tail has extra dashes, e.g. "BAR AREA - AFTERNOON"
      if (tail && tail.includes(" - ")) {
        const parts = tail.split(" - ").map((p) => p.trim()).filter(Boolean);
        const last = parts[parts.length - 1];

        if (TIME_WORDS.includes(last)) {
          // everything before the last becomes part of location
          const extraLoc = parts.slice(0, -1).join(" - ");
          const location = extraLoc ? `${middle} - ${extraLoc}` : middle;
          return {
            intExt,
            location,
            timeOfDay: last,
          };
        }
      }

      // normal 1-dash case
      return {
        intExt,
        location: middle,
        timeOfDay: tail || "DAY",
      };
    }

    // fallback: try split on " - "
    const parts = txt.split(" - ");
    if (parts.length === 2) {
      return {
        intExt: "INT.",
        location: parts[0].toUpperCase(),
        timeOfDay: parts[1].toUpperCase(),
      };
    }

    return {
      intExt: "INT.",
      location: txt.toUpperCase(),
      timeOfDay: "DAY",
    };
  }


  
  const finalizeImportFromText = (parsed) => {
    const scenes = parsed?.scenes || [];
    const frontMatter = parsed?.frontMatter || {};

    const newChunksById = {};
    const newOrder = [];

    const activeScriptId = project.settings?.activeScriptId || "script_main";

    // helper from before
    const makeId = () => "scene_" + Math.random().toString(36).slice(2, 8);

    scenes.forEach((scene) => {
      const id = makeId();
      const heading = scene.title || "UNTITLED";
      const slug = parseSceneHeading(heading); // the helper we added earlier

      newOrder.push(id);
      newChunksById[id] = {
        id,
        title: `${slug.intExt} ${slug.location} - ${slug.timeOfDay}`.trim(),
        slug,
        body: scene.body || [],
        characters: scene.characters || [],
        props: scene.props || [],
      };
    });

    // write scenes
    setChunksById((prev) => ({
      ...prev,
      ...newChunksById,
    }));

    // write script order
    setScriptsById((prev) => ({
      ...prev,
      [activeScriptId]: {
        ...(prev[activeScriptId] || { id: activeScriptId, name: "Script" }),
        chunkOrder: newOrder,
      },
    }));

    // select first scene
    if (newOrder[0]) {
      setSelectedChunkId(newOrder[0]);
    }

    // 👇 write title/author/draft/contact into the shape the UI uses
    if (
      frontMatter.title ||
      frontMatter.author ||
      frontMatter.draft ||
      frontMatter.contact
    ) {
      setProject((prev) => ({
        ...prev,
        // header uses project.title
        title: frontMatter.title || prev.title || prev.name,
        name: frontMatter.title || prev.name || prev.title,
        meta: {
          ...(prev.meta || {}),
          // these are the keys your sidebar + header settings already use
          author: frontMatter.author || (prev.meta && prev.meta.author) || "",
          draft: frontMatter.draft || (prev.meta && prev.meta.draft) || "",
          contact: frontMatter.contact || (prev.meta && prev.meta.contact) || "",
        },
      }));
    }

    setImportWizardOpen(false);
    setImportWizardText("");
  };



  // --------------- ACTIONS ---------------

  const selectChunk = useCallback((id) => {
    setSelectedChunkId(id);
  }, []);

  const updateChunk = useCallback((id, patch) => {
    setSaveStatus("saving");

    setChunksById((prev) => {
      const existing = prev[id];
      if (!existing) return prev;

      const next = { ...existing, ...patch };

      // if they change the structure anchor, auto-lock
      if (Object.prototype.hasOwnProperty.call(patch, "anchorRole")) {
        if (!patch.anchorRole) {
          next.locked = false;
        } else {
          next.locked = true;
        }
      }

      return {
        ...prev,
        [id]: next,
      };
    });

    setTimeout(() => setSaveStatus("saved"), 250);
  }, []);

  const toggleChunkLock = useCallback((id, lockedValue) => {
    setChunksById((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: {
          ...existing,
          locked:
            typeof lockedValue === "boolean"
              ? lockedValue
              : !existing.locked,
        },
      };
    });
  }, []);

  const addChunk = useCallback(() => {
    setSaveStatus("saving");

    const newId = makeId();
    const newChunk = {
      id: newId,
      title: "LOCATION",
      body: [{ type: "action", text: "" }],
      characters: [],
      props: [],
      emotionalBeat: "",
      status: "draft",
      tags: [],
      estPageLength: 1.0,
      notes: "",
      anchorRole: null,
      locked: false,
    };

    setChunksById((prev) => ({
      ...prev,
      [newId]: newChunk,
    }));

    setProject((prev) => ({
      ...prev,
      chunks: [...prev.chunks, newId],
    }));

    setScriptsById((prev) => {
      const activeId = project.settings.activeScriptId;
      const activeScript = prev[activeId];
      const newOrder = [...activeScript.chunkOrder, newId];
      return {
        ...prev,
        [activeId]: {
          ...activeScript,
          chunkOrder: newOrder,
        },
      };
    });

    setSelectedChunkId(newId);
    setTimeout(() => setSaveStatus("saved"), 250);
  }, [project.settings.activeScriptId]);

  // hard delete (but we ALSO push into deletedScenes first)
  const removeChunk = useCallback(
    (chunkIdToRemove) => {
      setSaveStatus("saving");

      const activeScript = scriptsById[project.settings.activeScriptId];
      const order = activeScript?.chunkOrder || [];
      const indexInOrder = order.indexOf(chunkIdToRemove);
      const chunkBeingRemoved = chunksById[chunkIdToRemove];

      // push to deleted
      setDeletedScenes((prev) => [
        ...prev,
        {
          id: "trash_" + chunkIdToRemove,
          scene: chunkBeingRemoved,
          index: indexInOrder === -1 ? prev.length : indexInOrder,
        },
      ]);

      // 1. from chunksById
      setChunksById((prev) => {
        const updated = { ...prev };
        delete updated[chunkIdToRemove];
        return updated;
      });

      // 2. from project.chunks
      setProject((prev) => ({
        ...prev,
        chunks: prev.chunks.filter((cid) => cid !== chunkIdToRemove),
      }));

      // 3. from active script order
      setScriptsById((prev) => {
        const activeId = project.settings.activeScriptId;
        const activeScript = prev[activeId];
        const newOrder = activeScript.chunkOrder.filter(
          (cid) => cid !== chunkIdToRemove
        );
        return {
          ...prev,
          [activeId]: {
            ...activeScript,
            chunkOrder: newOrder,
          },
        };
      });

      // 4. fix selection
      setSelectedChunkId((currentId) => {
        if (currentId !== chunkIdToRemove) return currentId;
        return null;
      });

      setTimeout(() => setSaveStatus("saved"), 250);
    },
    [project.settings.activeScriptId, chunksById, scriptsById]
  );

  const insertChunkAfter = useCallback(
    (afterChunkId) => {
      setSaveStatus("saving");

      const newId = makeId();
      const newChunk = {
        id: newId,
        title: "LOCATION",
        body: [{ type: "action", text: "" }],
        characters: [],
        props: [],
        emotionalBeat: "",
        status: "draft",
        tags: [],
        estPageLength: 1.0,
        notes: "",
        anchorRole: null,
        locked: false,
      };

      setChunksById((prev) => ({
        ...prev,
        [newId]: newChunk,
      }));

      setProject((prev) => ({
        ...prev,
        chunks: [...prev.chunks, newId],
      }));

      setScriptsById((prev) => {
        const activeId = project.settings.activeScriptId;
        const activeScript = prev[activeId];
        const order = activeScript.chunkOrder;
        const idx = order.indexOf(afterChunkId);
        const insertAt = idx === -1 ? order.length : idx + 1;
        const newOrder = [
          ...order.slice(0, insertAt),
          newId,
          ...order.slice(insertAt),
        ];
        return {
          ...prev,
          [activeId]: {
            ...activeScript,
            chunkOrder: newOrder,
          },
        };
      });

      setSelectedChunkId(newId);
      setTimeout(() => setSaveStatus("saved"), 250);
    },
    [project.settings.activeScriptId]
  );

  // drag reorder
  const reorderChunks = useCallback(
    (newOrderArray) => {
      setSaveStatus("saving");
      setScriptsById((prev) => {
        const activeId = project.settings.activeScriptId;
        const activeScript = prev[activeId];
        return {
          ...prev,
          [activeId]: {
            ...activeScript,
            chunkOrder: newOrderArray,
          },
        };
      });
      setTimeout(() => setSaveStatus("saved"), 250);
    },
    [project.settings.activeScriptId]
  );

  // --------- TRASH UTILITIES ---------
  const moveChunkToTrash = useCallback(
    (chunkId, chunkData, indexInOrder) => {
      const sceneToTrash = chunkData || chunksById[chunkId];
      const activeScript = scriptsById[project.settings.activeScriptId];
      const order = activeScript?.chunkOrder || [];
      const idx =
        typeof indexInOrder === "number" ? indexInOrder : order.indexOf(chunkId);

      setDeletedScenes((prev) => [
        ...prev,
        {
          id: "trash_" + chunkId,
          scene: sceneToTrash,
          index: idx === -1 ? prev.length : idx,
        },
      ]);

      // now actually remove
      removeChunk(chunkId);
    },
    [chunksById, scriptsById, project.settings.activeScriptId, removeChunk]
  );

  const restoreChunkFromTrash = useCallback(
    (trashIdOrIndex) => {
      setDeletedScenes((prev) => {
        if (!prev.length) return prev;

        const idx =
          typeof trashIdOrIndex === "string"
            ? prev.findIndex((x) => x.id === trashIdOrIndex)
            : trashIdOrIndex;

        if (idx < 0) return prev;

        const item = prev[idx];
        const remaining = prev.filter((_, i) => i !== idx);
        const scene = item.scene;
        const insertAt =
          typeof item.index === "number" ? item.index : null;

        if (scene && scene.id) {
          // 1. re-add to chunks
          setChunksById((prevChunks) => ({
            ...prevChunks,
            [scene.id]: scene,
          }));

          // 2. re-add to project list if missing
          setProject((prevProj) => ({
            ...prevProj,
            chunks: prevProj.chunks.includes(scene.id)
              ? prevProj.chunks
              : [...prevProj.chunks, scene.id],
          }));

          // 3. reinsert into active script order
          setScriptsById((prevScripts) => {
            const activeId = project.settings.activeScriptId;
            const activeScript = prevScripts[activeId];
            const oldOrder = activeScript.chunkOrder || [];
            const newOrder = [...oldOrder];

            if (!newOrder.includes(scene.id)) {
              const pos =
                insertAt !== null &&
                insertAt >= 0 &&
                insertAt <= oldOrder.length
                  ? insertAt
                  : oldOrder.length;
              newOrder.splice(pos, 0, scene.id);
            }

            return {
              ...prevScripts,
              [activeId]: {
                ...activeScript,
                chunkOrder: newOrder,
              },
            };
          });

          // 4. reselect it
          setSelectedChunkId(scene.id);
        }

        return remaining;
      });
    },
    [project.settings.activeScriptId]
  );

  const purgeDeletedChunk = useCallback((trashIdOrIndex) => {
    setDeletedScenes((prev) => {
      if (!prev.length) return prev;
      const idx =
        typeof trashIdOrIndex === "string"
          ? prev.findIndex((x) => x.id === trashIdOrIndex)
          : trashIdOrIndex;
      if (idx < 0) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  }, []);


// inside ProjectProvider, near your other actions:

const createNewProject = React.useCallback(() => {
  // make a fresh project id
  const newId = "proj_" + Math.random().toString(36).slice(2, 7);

  // minimal blank project
  const blank = {
    id: newId,
    title: "New Project",
    settings: {
      activeScriptId: "script_main",
      activeSkinId: "DEFAULT",
    },
    chunks: [],
    scripts: ["script_main"],
  };

  const blankScript = {
    id: "script_main",
    name: "Main Draft",
    chunkOrder: [],
    structureTemplate: null,
    anchors: [],
  };

  setProject(blank);
  setScriptsById({ script_main: blankScript });
  setChunksById({});
  setSelectedChunkId(null);

  return newId;
}, []);


const [importWizardOpen, setImportWizardOpen] = useState(false);
const [importWizardText, setImportWizardText] = useState("");

const loadDemoProject = React.useCallback(() => {
  const demoId = "demo_" + Math.random().toString(36).slice(2, 5);
  setProject({ ...initialProject, id: demoId });
  setChunksById({ ...initialChunksById });
  setScriptsById({ ...initialScriptsById });
  setSelectedChunkId("chunk_welcome");
  return demoId;
}, []);


const loadTutorialProject = React.useCallback(() => {
  // for now just reuse demo
  return loadDemoProject();
}, [loadDemoProject]);

// you already had import-from-file logic, but let’s expose it:
const importProjectFromFile = React.useCallback((text) => {
  try {
    const data = JSON.parse(text);
    if (data.project) setProject(data.project);
    if (data.chunksById) setChunksById(data.chunksById);
    if (data.scriptsById) setScriptsById(data.scriptsById);
    if (data.selectedChunkId) setSelectedChunkId(data.selectedChunkId);
    return data.project?.id || "imported";
  } catch (err) {
    console.warn("import failed", err);
    return "imported";
  }
}, []);

  const manualSave = useCallback(() => {
    try {
      const payload = {
        project,
        chunksById,
        scriptsById,
        selectedChunkId,
        deletedScenes,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSaveStatus("saved");
    } catch (err) {
      console.warn("Manual save failed", err);
      setSaveStatus("error");
    }
  }, [project, chunksById, scriptsById, selectedChunkId, deletedScenes]);

  const loadFromLocal = useCallback((storageKey = STORAGE_KEY) => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.project) setProject(data.project);
      if (data.chunksById) setChunksById(data.chunksById);
      if (data.scriptsById) setScriptsById(data.scriptsById);
      if (data.selectedChunkId) setSelectedChunkId(data.selectedChunkId);
      if (data.deletedScenes) setDeletedScenes(data.deletedScenes);
      return true;
    } catch (err) {
      console.warn("Could not load project:", err);
      return false;
    }
  }, []);




  // return a plain JSON-friendly object of the whole project
  const getSerializableProject = useCallback(() => {
    return {
      project,
      chunksById,
      scriptsById,
      selectedChunkId,
      deletedScenes,
      version: "scene-chunks-v1",
      savedAt: new Date().toISOString(),
    };
  }, [project, chunksById, scriptsById, selectedChunkId, deletedScenes]);

  // load from a JSON object (like from a file)
  const loadFromObject = useCallback((obj) => {
    if (!obj || typeof obj !== "object") return false;

    if (obj.project) setProject(obj.project);
    if (obj.chunksById) setChunksById(obj.chunksById);
    if (obj.scriptsById) setScriptsById(obj.scriptsById);
    if (obj.selectedChunkId) setSelectedChunkId(obj.selectedChunkId);
    if (obj.deletedScenes) setDeletedScenes(obj.deletedScenes);

    return true;
  }, []);
  // -------------------------------------------------
  // basic helpers (must be defined before we export)
  // -------------------------------------------------
  const getActiveScript = useCallback(() => {
    return scriptsById[project.settings.activeScriptId];
  }, [scriptsById, project.settings.activeScriptId]);

  const getCurrentChunk = useCallback(() => {
    return chunksById[selectedChunkId] || null;
  }, [chunksById, selectedChunkId]);

  const getAssembledScriptText = useCallback(() => {
    const activeScript = scriptsById[project.settings.activeScriptId];
    if (!activeScript) return "";

    const lines = [];

    activeScript.chunkOrder.forEach((chunkId) => {
      const chunk = chunksById[chunkId];
      if (!chunk) return;

      // scene heading
      if (chunk.title) {
        lines.push(chunk.title.toUpperCase());
        lines.push("");
      }

      (chunk.body || []).forEach((block) => {
        if (!block) return;
        switch (block.type) {
          case "action":
            if (block.text?.trim()) {
              lines.push(block.text.trim());
              lines.push("");
            }
            break;
          case "dialogueBlock":
            if (block.character?.trim()) {
              lines.push(block.character.toUpperCase());
            }
            if (block.parenthetical?.trim()) {
              lines.push("    (" + block.parenthetical.trim() + ")");
            }
            if (block.dialogue?.trim()) {
              lines.push("    " + block.dialogue.trim());
            }
            lines.push("");
            break;
          case "transition":
            if (block.text?.trim()) {
              lines.push("                              " + block.text.trim().toUpperCase());
              lines.push("");
            }
            break;
          default:
            if (block.text?.trim()) {
              lines.push(block.text.trim());
              lines.push("");
            }
        }
      });

      lines.push("");
    });

    return lines.join("\n");
  }, [scriptsById, project.settings.activeScriptId, chunksById]);

  // --------------- VALUE ---------------
  const value = useMemo(
    () => ({
      project,
      chunksById,
      scriptsById,
      selectedChunkId,
      saveStatus,
      createNewProject,
      loadDemoProject,
      loadTutorialProject,
      importProjectFromFile,
      // helpers
      openWriterMode,
      closeWriterMode,
      importFromText,
      importWizardOpen,
      importWizardText,
      closeImportWizard,
      finalizeImportFromText,
      getActiveScript,
      getCurrentChunk,
      getAssembledScriptText,
      uiState,
      openCharacterPanel,
      closeCharacterPanel,
      openCrewPanel,
      closeCrewPanel,
      openPropsPanel,
      closePropsPanel,

      // scene actions
      selectChunk,
      updateChunk,
      addChunk,
      removeChunk,
      insertChunkAfter,
      reorderChunks,
      toggleChunkLock,

      // trash
      deletedScenes,
      moveChunkToTrash,
      restoreChunkFromTrash,
      purgeDeletedChunk,

      // project-level
      updateProjectTitle,
      updateProjectMeta,
      manualSave,
      loadFromLocal,
      importFromText,
      getSerializableProject,
      loadFromObject,

    }),
    [
      project,
      chunksById,
      scriptsById,
      selectedChunkId,
      saveStatus,
      createNewProject,
      loadDemoProject,
      loadTutorialProject,
      importProjectFromFile,
      uiState,
      openWriterMode,
      closeWriterMode,
      openCharacterPanel,
      closeCharacterPanel,
      openCrewPanel,
      closeCrewPanel,
      openPropsPanel,
      closePropsPanel,
      importFromText,
      importWizardOpen,
      importWizardText,
      closeImportWizard,
      finalizeImportFromText,
      getActiveScript,
      getCurrentChunk,
      getAssembledScriptText,
      selectChunk,
      updateChunk,
      addChunk,
      removeChunk,
      insertChunkAfter,
      reorderChunks,
      toggleChunkLock,
      deletedScenes,
      moveChunkToTrash,
      restoreChunkFromTrash,
      purgeDeletedChunk,
      updateProjectTitle,
      updateProjectMeta,
      manualSave,
      loadFromLocal,
      importFromText,
      getSerializableProject,
      loadFromObject,

    ]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------
export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject() must be used inside <ProjectProvider />");
  }
  return ctx;
}
