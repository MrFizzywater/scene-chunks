"use client";

import React, { useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";

function makeId() {
  return "prop_" + Math.random().toString(36).slice(2, 8);
}
function makeImageId() {
  return "propimg_" + Math.random().toString(36).slice(2, 8);
}

const EMPTY_PROP = {
  id: "",
  name: "",
  description: "",
  colour: "",
  colourImportant: false,
  size: "",
  sizeImportant: false,
  texture: "",
  textureImportant: false,
  other: "",
  otherImportant: false,
  propMaster: "Prop Master",
  images: [],
};

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block mb-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-[2px]">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-400"
        placeholder={placeholder}
      />
    </label>
  );
}

function ToggleLine({
  label,
  value,
  onChange,
  important,
  onImportantChange,
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1">
        <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-[2px]">
          {label}
        </label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-400"
        />
      </div>
      <label className="flex items-center gap-1 text-[10px] text-gray-300 mt-4">
        <input
          type="checkbox"
          checked={important}
          onChange={(e) => onImportantChange(e.target.checked)}
        />
        important
      </label>
    </div>
  );
}

// normalize so script tags and sheet names match
function normalizePropName(name) {
  if (typeof name !== "string") {
    return "";
  }
  return name.trim().toUpperCase();
}


export default function PropPanel() {
    const {
    project,
    updateProjectMeta,
    getActiveScript,
    chunksById,
    selectChunk,
    uiState,
    } = useProject();


  const propsList = project?.meta?.props || [];
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);

  // for photos
  const [newImageUrl, setNewImageUrl] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);

  // grab props from script
  const script = getActiveScript();
  const scriptPropSet = new Set();
  if (script) {
    script.chunkOrder.forEach((cid) => {
      const sc = chunksById[cid];
      if (!sc) return;
      (sc.props || []).forEach((p) => {
        const norm = normalizePropName(p);
        if (norm) scriptPropSet.add(norm);
      });
    });
  }
  const scriptPropNames = Array.from(scriptPropSet).sort();

    useEffect(() => {
    if (!uiState?.selectedPropName) return;
    const target = normalizePropName(uiState.selectedPropName);
    const match = propsList.find(
        (p) => normalizePropName(p.name || "") === target
    );
    if (match) {
        setSelectedId(match.id);
    }
    }, [uiState?.selectedPropName, propsList]);

  // auto-import: if script has props we don't have yet, add them
  useEffect(() => {
    if (!script) return;
    const existing = new Set(
      propsList.map((p) => normalizePropName(p.name || ""))
    );
    const missing = scriptPropNames.filter((n) => !existing.has(n));
    if (missing.length === 0) return;

    const toAdd = missing.map((n) => ({
      ...EMPTY_PROP,
      id: makeId(),
      name: n,
    }));

    updateProjectMeta({
      ...(project.meta || {}),
      props: [...propsList, ...toAdd],
    });
    // we DO NOT setSelectedId here, we just keep it quiet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptPropNames.length]); // re-check when script props change

  // sync selected draft
  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const found = propsList.find((p) => p.id === selectedId);
    setDraft(found || null);
  }, [propsList, selectedId]);

  const persist = (nextProps) => {
    updateProjectMeta({
      ...(project.meta || {}),
      props: nextProps,
    });
  };

  const addProp = () => {
    const newbie = {
      ...EMPTY_PROP,
      id: makeId(),
      name: "New Prop",
    };
    persist([...propsList, newbie]);
    setSelectedId(newbie.id);
  };

  const saveProp = () => {
    if (!draft) return;
    const next = propsList.map((p) => (p.id === draft.id ? draft : p));
    persist(next);
  };

  const deleteProp = (id) => {
    if (!window.confirm("Delete this prop?")) return;
    const next = propsList.filter((p) => p.id !== id);
    persist(next);
    if (selectedId === id) {
      setSelectedId(null);
      setDraft(null);
    }
  };

  // scenes this prop is in
  const scenesForProp = (propName) => {
    if (!propName || !script) return [];
    const wanted = normalizePropName(propName);
    const matches = [];
    script.chunkOrder.forEach((cid) => {
      const sc = chunksById[cid];
      if (!sc) return;
      const hasIt =
        Array.isArray(sc.props) &&
        sc.props.some((p) => normalizePropName(p) === wanted);
      if (hasIt) {
        matches.push({
          id: cid,
          title: sc.title || "(untitled scene)",
        });
      }
    });
    return matches;
  };

  const sceneList = draft?.name ? scenesForProp(draft.name) : [];

  // image handlers
  const addImage = () => {
    if (!draft || !newImageUrl.trim()) return;
    const imgs = Array.isArray(draft.images) ? draft.images.slice() : [];
    imgs.push({
      id: makeImageId(),
      url: newImageUrl.trim(),
      tag: "",
    });
    setDraft((d) => ({ ...d, images: imgs }));
    setNewImageUrl("");
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

  const updateImageTag = (imgId, tag) => {
    if (!draft) return;
    const imgs = (draft.images || []).map((img) =>
      img.id === imgId ? { ...img, tag } : img
    );
    setDraft((d) => ({ ...d, images: imgs }));
  };

  const deleteImage = (imgId) => {
    if (!draft) return;
    const imgs = (draft.images || []).filter((img) => img.id !== imgId);
    setDraft((d) => ({ ...d, images: imgs }));
  };

  return (
    <div className="h-full flex bg-[#0f0f0f] text-white">
      {/* list */}
      <div className="w-2/5 border-r border-[#1f1f1f] flex flex-col h-full">
        <div className="flex items-center justify-between px-2 py-2 border-b border-[#1f1f1f]">
          <div className="text-[10px] uppercase tracking-wide text-gray-400">
            Props ({propsList.length})
          </div>
          <button
            onClick={addProp}
            className="bg-violet-500/90 hover:bg-violet-500 text-black text-[11px] px-2 py-[2px] rounded"
          >
            + Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {propsList.length === 0 ? (
            <div className="p-3 text-[11px] text-gray-500">
              No props yet.
              {scriptPropNames.length > 0 ? (
                <div className="mt-2 text-[10px] text-violet-300">
                  (Will auto-import from script.)
                </div>
              ) : null}
            </div>
          ) : (
            propsList.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-2 py-2 border-b border-[#121212] ${
                  selectedId === p.id
                    ? "bg-[#1d1d1d] border-l-2 border-l-violet-400"
                    : "hover:bg-[#171717]"
                }`}
              >
                <div className="text-xs font-medium truncate">
                  {p.name || "(no name)"}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {p.propMaster || "Prop Master"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* details */}
      <div className="flex-1 h-full overflow-y-auto p-3">
        {!draft ? (
          <div className="text-[11px] text-gray-500">Select or add a prop.</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">{draft.name || "Prop"}</h2>
              <div className="flex gap-2">
                <button
                  onClick={saveProp}
                  className="bg-violet-500/90 hover:bg-violet-500 text-black text-[11px] px-3 py-[3px] rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteProp(draft.id)}
                  className="bg-red-500/80 hover:bg-red-500 text-white text-[11px] px-3 py-[3px] rounded"
                >
                  Delete
                </button>
              </div>
            </div>

            <Field
              label="Prop Name"
              value={draft.name}
              onChange={(val) => setDraft((d) => ({ ...d, name: val }))}
              placeholder="e.g. RED UMBRELLA"
            />

            <Field
              label="Description / Notes"
              value={draft.description || ""}
              onChange={(val) => setDraft((d) => ({ ...d, description: val }))}
              placeholder="Where it's used, scene, condition, duplicates..."
            />

            <ToggleLine
              label="Colour"
              value={draft.colour || ""}
              onChange={(val) => setDraft((d) => ({ ...d, colour: val }))}
              important={!!draft.colourImportant}
              onImportantChange={(flag) =>
                setDraft((d) => ({ ...d, colourImportant: flag }))
              }
            />

            <ToggleLine
              label="Size"
              value={draft.size || ""}
              onChange={(val) => setDraft((d) => ({ ...d, size: val }))}
              important={!!draft.sizeImportant}
              onImportantChange={(flag) =>
                setDraft((d) => ({ ...d, sizeImportant: flag }))
              }
            />

            <ToggleLine
              label="Texture / Material"
              value={draft.texture || ""}
              onChange={(val) => setDraft((d) => ({ ...d, texture: val }))}
              important={!!draft.textureImportant}
              onImportantChange={(flag) =>
                setDraft((d) => ({ ...d, textureImportant: flag }))
              }
            />

            <ToggleLine
              label="Other detail"
              value={draft.other || ""}
              onChange={(val) => setDraft((d) => ({ ...d, other: val }))}
              important={!!draft.otherImportant}
              onImportantChange={(flag) =>
                setDraft((d) => ({ ...d, otherImportant: flag }))
              }
            />

            <Field
              label="Prop Master / Responsible"
              value={draft.propMaster || "Prop Master"}
              onChange={(val) => setDraft((d) => ({ ...d, propMaster: val }))}
              placeholder="Prop Master / Art / whoever"
            />

            {/* scenes with this prop */}
            <div className="mt-4 mb-4">
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                Scenes using this prop
              </div>
              {sceneList.length === 0 ? (
                <div className="text-[11px] text-gray-500">
                  No scenes found using this prop name.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sceneList.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectChunk && selectChunk(s.id)}
                      className="text-[11px] bg-[#141414] border border-[#222] rounded px-2 py-1 hover:border-violet-400"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* images */}
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">
                Photos / Reference
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="flex-1 bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-400"
                />
                <button
                  onClick={addImage}
                  className="bg-violet-500/90 hover:bg-violet-500 text-black text-[11px] px-3 py-[3px] rounded"
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

              <div className="grid grid-cols-2 gap-3">
                {(draft.images || []).length === 0 ? (
                  <div className="text-[11px] text-gray-500 col-span-2">
                    No photos yet.
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
                            alt={img.tag || "prop photo"}
                            className="w-full h-32 object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-full h-32 bg-black/40 flex items-center justify-center text-[10px] text-gray-500">
                          no preview
                        </div>
                      )}

                      <div className="p-2 space-y-1">
                        <input
                          value={img.tag || ""}
                          onChange={(e) =>
                            updateImageTag(img.id, e.target.value)
                          }
                          className="w-full bg-[#191919] border border-[#333] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-violet-400"
                          placeholder="Detail / source / angle..."
                        />
                        {img.url && (
                          <a
                            href={img.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-[10px] text-violet-200 truncate"
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

      {/* lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]"
        >
          <img
            src={lightboxImage}
            alt="preview"
            className="max-w-[90vw] max-h-[90vh] object-contain shadow-lg"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
            className="absolute top-4 right-6 text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
