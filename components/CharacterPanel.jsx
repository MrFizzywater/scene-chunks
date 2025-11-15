"use client";

import React, { useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";

// id helpers
function makeCharId() {
  return "char_" + Math.random().toString(36).slice(2, 8);
}
function makeImageId() {
  return "img_" + Math.random().toString(36).slice(2, 8);
}

function normalizeCharName(name) {
  if (typeof name !== "string") {
    // handle null, undefined, numbers, etc.
    return "";
  }

  let n = name.trim();

  // strip trailing parenthetical, e.g. "AVA (CONT'D)" → "AVA"
  n = n.replace(/\s*\([^)]*\)\s*$/i, "");

  // uppercase for consistent matching
  return n.toUpperCase();
}


// default/new character shape
const EMPTY_CHAR = {
  id: "",
  name: "",
  role: "",
  archetype: "",
  goals: "",
  flaws: "",
  backstory: "",
  lookAndVibe: "",
  notes: "",
  basicDetails: "",
  actorName: "",
  actorContact: "",
  images: [],           // 👈 new
};

const ARCHETYPE_OPTIONS = [
  "",
  "Narrator",
  "Protagonist",
  "Antagonist",
  "Mentor",
  "Sidekick",
  "Love Interest",
  "Trickster",
  "Guardian",
  "Herald",
  "Shapeshifter",
  "Comic Relief",
  "Rival",
  "Confidant",
  "Foil",
  "Villain’s Lieutenant",
  "Innocent / Child",
  "Authority Figure",
  "Everyman / POV",
];

const IMAGE_TAG_OPTIONS = [
  "",
  "Performer headshot",
  "Alternate headshot",
  "Costume inspiration",
  "Hair / makeup",
  "Expression / pose ref",
  "Creature / SFX",
  "Prop reference",
  "Location vibe",
  "Other",
];

function Field({ label, value, onChange, textarea, placeholder }) {
  return (
    <label className="block mb-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-[2px]">
        {label}
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

export default function CharacterPanel() {
    const {
    project,
    updateProjectMeta,
    getActiveScript,
    chunksById,
    selectChunk,
    uiState,
    } = useProject();


  const characters = project?.meta?.characters || [];

  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState(""); // 👈 for adding images
  const [lightboxImage, setLightboxImage] = useState(null); // for popup preview


  // collect character names from scenes + dialogue
  const script = getActiveScript();
  let sceneCharacterNames = [];
  if (script) {
    const names = new Set();
    script.chunkOrder.forEach((cid) => {
      const sc = chunksById[cid];
      if (!sc) return;

      // chunk-level characters
    (sc.characters || []).forEach((n) => {
    const norm = normalizeCharName(n);
    if (norm) names.add(norm);
    });

      // dialogue-like blocks
      (sc.body || []).forEach((b) => {
        if (b?.type === "dialogueBlock" && b.character) {
        const norm = normalizeCharName(b.character);
        if (norm) names.add(norm);
        }
            if (b?.type === "dualDialogue") {
            if (b.left?.character) {
                const norm = normalizeCharName(b.left.character);
                if (norm) names.add(norm);
            }
            if (b.right?.character) {
                const norm = normalizeCharName(b.right.character);
                if (norm) names.add(norm);
            }
            }

      });
    });
    sceneCharacterNames = Array.from(names).sort();
  }

  useEffect(() => {
    if (!uiState?.selectedCharacterName) return;
    const targetNorm = normalizeCharName(uiState.selectedCharacterName);
    const match = characters.find(
        (c) => normalizeCharName(c.name || "") === targetNorm
    );
    if (match) {
        setSelectedId(match.id);
    }
    }, [uiState?.selectedCharacterName, characters]);

  // sync draft when selection changes
  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const current = characters.find((c) => c.id === selectedId);
    if (current) setDraft(current);
    else setDraft(null);
  }, [characters, selectedId]);

  const persistCharacters = (nextChars) => {
    updateProjectMeta({
      ...(project.meta || {}),
      characters: nextChars,
    });
  };

  const handleAdd = () => {
    const newChar = {
      ...EMPTY_CHAR,
      id: makeCharId(),
      name: "New Character",
    };
    const next = [...characters, newChar];
    persistCharacters(next);
    setSelectedId(newChar.id);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this character sheet?")) return;
    const next = characters.filter((c) => c.id !== id);
    persistCharacters(next);
    if (selectedId === id) {
      setSelectedId(null);
      setDraft(null);
    }
  };

  const handleSave = () => {
    if (!draft) return;
    const next = characters.map((c) => (c.id === draft.id ? draft : c));
    persistCharacters(next);
  };

  const handleImportFromScenes = () => {
    const existingNames = new Set(
      characters.map((c) => normalizeCharName(c.name || ""))
    );
    const toAdd = sceneCharacterNames
      .filter((n) => n && !existingNames.has(n.toUpperCase()))
      .map((n) => ({
        ...EMPTY_CHAR,
        id: makeCharId(),
        name: n,
      }));
    if (!toAdd.length) return;
    persistCharacters([...characters, ...toAdd]);
  };

  const pasteImageFromClipboard = async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        setNewImageUrl(text);
    } catch (err) {
        console.warn("clipboard read failed", err);
    }
    };

  // scenes this character is in
  const scenesForCharacter = (charName) => {
    if (!charName || !script) return [];
    const wanted = normalizeCharName(charName);
    const matches = [];

    script.chunkOrder.forEach((cid) => {
      const sc = chunksById[cid];
      if (!sc) return;

      let isIn = false;

      // chunk-level characters
      if (
        Array.isArray(sc.characters) &&
        sc.characters.some((n) => n && normalizeCharName(n) === wanted)
      ) {
        isIn = true;
      }

      // dialogue blocks
      if (!isIn && Array.isArray(sc.body)) {
        for (const b of sc.body) {
          if (b?.type === "dialogueBlock" && b.character) {
            if (b.character.toUpperCase() === wanted) {
              isIn = true;
              break;
            }
          }
          if (b?.type === "dualDialogue") {
            if (
              (b.left?.character &&
                b.left.character.toUpperCase() === wanted) ||
              (b.right?.character &&
                b.right.character.toUpperCase() === wanted)
            ) {
              isIn = true;
              break;
            }
          }
        }
      }

      if (isIn) {
        matches.push({
          id: cid,
          title: sc.title || "(untitled scene)",
        });
      }
    });

    return matches;
  };

  const sceneList =
    draft && draft.name ? scenesForCharacter(draft.name) : [];

  // 👇 image handlers
  const addImage = () => {
    if (!draft || !newImageUrl.trim()) return;
    const nextImages = Array.isArray(draft.images) ? draft.images.slice() : [];
    nextImages.push({
      id: makeImageId(),
      url: newImageUrl.trim(),
      tag: "",
    });
    setDraft((d) => ({ ...d, images: nextImages }));
    setNewImageUrl("");
  };

  const updateImageTag = (imgId, tag) => {
    if (!draft) return;
    const nextImages = (draft.images || []).map((img) =>
      img.id === imgId ? { ...img, tag } : img
    );
    setDraft((d) => ({ ...d, images: nextImages }));
  };

  const deleteImage = (imgId) => {
    if (!draft) return;
    const nextImages = (draft.images || []).filter((img) => img.id !== imgId);
    setDraft((d) => ({ ...d, images: nextImages }));
  };

  return (
    <div className="h-full flex bg-[#0f0f0f] text-white">
      {/* left list */}
      <div className="w-2/5 border-r border-[#1f1f1f] flex flex-col h-full">
        <div className="flex items-center justify-between px-2 py-2 border-b border-[#1f1f1f]">
          <div className="text-[10px] uppercase tracking-wide text-gray-400">
            Characters ({characters.length})
          </div>
          <button
            onClick={handleAdd}
            className="bg-amber-500/90 hover:bg-amber-500 text-black text-[11px] px-2 py-[2px] rounded"
          >
            + Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {characters.length === 0 ? (
            <div className="p-3 text-[11px] text-gray-500">
              No character sheets yet.
              {sceneCharacterNames.length > 0 && (
                <button
                  onClick={handleImportFromScenes}
                  className="mt-2 block text-amber-300 text-[11px]"
                >
                  Import from scenes
                </button>
              )}
            </div>
          ) : (
            characters.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-2 py-2 border-b border-[#121212] ${
                  selectedId === c.id
                    ? "bg-[#1d1d1d] border-l-2 border-l-amber-400"
                    : "hover:bg-[#171717]"
                }`}
              >
                <div className="text-xs font-medium truncate">
                  {c.name || "(no name)"}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {c.archetype || c.role || ""}
                </div>
              </button>
            ))
          )}
          {characters.length > 0 && sceneCharacterNames.length > 0 ? (
            <button
              onClick={handleImportFromScenes}
              className="m-2 text-[10px] text-gray-400 hover:text-amber-300"
            >
              + import missing names from scenes
            </button>
          ) : null}
        </div>
      </div>

      {/* right details */}
      <div className="flex-1 h-full overflow-y-auto p-3">
        {!draft ? (
            <div className="text-[11px] text-gray-500">
              Select a character or create one.
            </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {draft.name || "Untitled Character"}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-amber-500/90 hover:bg-amber-500 text-black text-[11px] px-3 py-[3px] rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => handleDelete(draft.id)}
                  className="bg-red-500/80 hover:bg-red-500 text-white text-[11px] px-3 py-[3px] rounded"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* main fields */}
            <Field
              label="Name / Alias"
              value={draft.name}
              onChange={(val) => setDraft((d) => ({ ...d, name: val }))}
              placeholder="e.g. TYLER"
            />

            <label className="block mb-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-[2px]">
                Archetype
              </div>
              <select
                value={draft.archetype || ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, archetype: e.target.value }))
                }
                className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {ARCHETYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || "—"}
                  </option>
                ))}
              </select>
            </label>

            <Field
              label="Role / Job in story"
              value={draft.role}
              onChange={(val) => setDraft((d) => ({ ...d, role: val }))}
              placeholder="Detective, Club Owner, Henchman..."
            />

            <Field
              label="Basic Details"
              value={draft.basicDetails || ""}
              onChange={(val) => setDraft((d) => ({ ...d, basicDetails: val }))}
              textarea
              placeholder="Age, ethnicity, accent, location, affiliations..."
            />

            <div className="grid grid-cols-2 gap-3 mb-2">
              <Field
                label="Actor / Performer"
                value={draft.actorName || ""}
                onChange={(val) => setDraft((d) => ({ ...d, actorName: val }))}
                placeholder="Person playing this character"
              />
              <Field
                label="Actor Contact Info"
                value={draft.actorContact || ""}
                onChange={(val) =>
                  setDraft((d) => ({ ...d, actorContact: val }))
                }
                placeholder="email / phone / agent"
              />
            </div>

            <Field
              label="Goals / Motivation"
              value={draft.goals}
              onChange={(val) => setDraft((d) => ({ ...d, goals: val }))}
              textarea
            />
            <Field
              label="Flaws / Weakness"
              value={draft.flaws}
              onChange={(val) => setDraft((d) => ({ ...d, flaws: val }))}
              textarea
            />
            <Field
              label="Backstory"
              value={draft.backstory}
              onChange={(val) => setDraft((d) => ({ ...d, backstory: val }))}
              textarea
            />
            <Field
              label="Look & Vibe"
              value={draft.lookAndVibe}
              onChange={(val) => setDraft((d) => ({ ...d, lookAndVibe: val }))}
              textarea
            />
            <Field
              label="Notes"
              value={draft.notes}
              onChange={(val) => setDraft((d) => ({ ...d, notes: val }))}
              textarea
            />

            {/* scenes this character is in */}
            <div className="mt-4 mb-4">
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                Scenes with this character
              </div>
              {sceneList.length === 0 ? (
                <div className="text-[11px] text-gray-500">
                  No scenes found using this name.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sceneList.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectChunk && selectChunk(s.id)}
                      className="text-[11px] bg-[#141414] border border-[#222] rounded px-2 py-1 hover:border-amber-400"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 👇 NEW IMAGE SECTION */}
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">
                Reference Images
              </div>

              {/* add image input */}
              <div className="flex gap-2 mb-3">
                <input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                />
                <button
                    onClick={addImage}
                    className="bg-amber-500/90 hover:bg-amber-500 text-black text-[11px] px-3 py-[3px] rounded"
                >
                    Add
                </button>
                <button
                    onClick={pasteImageFromClipboard}
                    className="bg-[#1f1f1f] border border-[#333] text-[10px] px-2 rounded"
                    title="Paste image link from clipboard"
                >
                    Paste
                </button>
                </div>


              {/* image list */}
              <div className="grid grid-cols-2 gap-3">
                {(draft.images || []).length === 0 ? (
                  <div className="text-[11px] text-gray-500 col-span-2">
                    No images yet.
                  </div>
                ) : (
                  (draft.images || []).map((img) => (
                    <div
                        key={img.id}
                        className="bg-[#141414] border border-[#222] rounded overflow-hidden relative"
                        >
                        <button
                            onClick={() => deleteImage(img.id)}
                            className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded"
                            title="Remove image"
                        >
                            ✕
                        </button>

                        {img.url ? (
                            <button
                            onClick={() => setLightboxImage(img.url)}
                            className="block w-full h-32 bg-black focus:outline-none"
                            title="Click to enlarge"
                            >
                            <img
                                src={img.url}
                                alt={img.tag || "character ref"}
                                className="w-full h-32 object-cover"
                            />
                            </button>
                        ) : (
                            <div className="w-full h-32 bg-black/40 flex items-center justify-center text-[10px] text-gray-500">
                            no preview
                            </div>
                        )}

                        <div className="p-2 space-y-1">
                            <select
                            value={img.tag || ""}
                            onChange={(e) => updateImageTag(img.id, e.target.value)}
                            className="w-full bg-[#191919] border border-[#333] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400"
                            >
                            {IMAGE_TAG_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                {opt || "— choose tag —"}
                                </option>
                            ))}
                            </select>

                            {img.url && (
                            <a
                                href={img.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-[10px] text-amber-300 truncate"
                                title={img.url}
                            >
                                {img.url}
                            </a>
                            )}
                        </div>
                        </div>

                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {lightboxImage && (
        <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
        >
            <img
            src={lightboxImage}
            alt="preview"
            className="max-w-[95vw] max-h-[95vh] object-contain shadow-lg"
            />
            <button
            onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(null);
            }}
            className="absolute top-4 right-6 text-white text-2xl font-bold"
            title="Close"
            >
            ✕
            </button>
        </div>
        )}

    </div>
  );
}
