"use client";

import React, { useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";

const EMPTY_CREW = {
  id: "",
  name: "",
  role: "",
  department: "",
  contact: "",
  notes: "",
  images: [], // 👈 new
};

function makeId() {
  return "crew_" + Math.random().toString(36).slice(2, 8);
}
function makeImageId() {
  return "crewimg_" + Math.random().toString(36).slice(2, 8);
}

const COMMON_ROLES = [
  "",
  "Director",
  "1st AD",
  "2nd AD",
  "Producer",
  "Line Producer",
  "Production Manager",
  "Script Supervisor",
  "Director of Photography",
  "Camera Operator",
  "1st AC / Focus Puller",
  "2nd AC / Clapper",
  "Gaffer",
  "Best Boy Electric",
  "Key Grip",
  "Dolly Grip",
  "Sound Mixer",
  "Boom Operator",
  "Art Director",
  "Production Designer",
  "Set Decorator",
  "Props Master",
  "Costume Designer",
  "Hair / Makeup",
  "VFX Supervisor",
  "Stunt Coordinator",
  "PA",
];

const COMMON_DEPTS = [
  "",
  "Production",
  "Direction",
  "Camera",
  "Lighting / Electric",
  "Grip",
  "Sound",
  "Art / Set Dec",
  "Props",
  "Costume / Wardrobe",
  "Hair / Makeup",
  "Locations",
  "Stunts",
  "Post / VFX",
];

function Field({ label, children }) {
  return (
    <label className="block mb-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-[2px]">
        {label}
      </div>
      {children}
    </label>
  );
}

export default function CrewPanel() {
  const { project, updateProjectMeta } = useProject();
  const crew = project?.meta?.crew || [];

  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const c = crew.find((m) => m.id === selectedId);
    setDraft(c || null);
  }, [crew, selectedId]);

  const persist = (nextCrew) => {
    updateProjectMeta({
      ...(project.meta || {}),
      crew: nextCrew,
    });
  };

  const addCrew = () => {
    const newbie = {
      ...EMPTY_CREW,
      id: makeId(),
      name: "New Crew",
      role: "",
    };
    persist([...crew, newbie]);
    setSelectedId(newbie.id);
  };

  const saveCrew = () => {
    if (!draft) return;
    const next = crew.map((m) => (m.id === draft.id ? draft : m));
    persist(next);
  };

  const deleteCrew = (id) => {
    if (!window.confirm("Remove this crew member?")) return;
    const next = crew.filter((m) => m.id !== id);
    persist(next);
    if (selectedId === id) {
      setSelectedId(null);
      setDraft(null);
    }
  };

  // images
  const addImage = () => {
    if (!draft || !newImageUrl.trim()) return;
    const list = Array.isArray(draft.images) ? draft.images.slice() : [];
    list.push({
      id: makeImageId(),
      url: newImageUrl.trim(),
      tag: "",
    });
    setDraft((d) => ({ ...d, images: list }));
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
    const list = (draft.images || []).map((img) =>
      img.id === imgId ? { ...img, tag } : img
    );
    setDraft((d) => ({ ...d, images: list }));
  };

  const deleteImage = (imgId) => {
    if (!draft) return;
    const list = (draft.images || []).filter((img) => img.id !== imgId);
    setDraft((d) => ({ ...d, images: list }));
  };

  return (
    <div className="h-full flex bg-[#0f0f0f] text-white">
      {/* list */}
      <div className="w-2/5 border-r border-[#1f1f1f] flex flex-col h-full">
        <div className="flex items-center justify-between px-2 py-2 border-b border-[#1f1f1f]">
          <div className="text-[10px] uppercase tracking-wide text-gray-400">
            Crew ({crew.length})
          </div>
          <button
            onClick={addCrew}
            className="bg-sky-500/90 hover:bg-sky-500 text-black text-[11px] px-2 py-[2px] rounded"
          >
            + Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {crew.length === 0 ? (
            <div className="p-3 text-[11px] text-gray-500">
              No crew saved yet.
            </div>
          ) : (
            crew.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left px-2 py-2 border-b border-[#121212] ${
                  selectedId === m.id
                    ? "bg-[#1d1d1d] border-l-2 border-l-sky-400"
                    : "hover:bg-[#171717]"
                }`}
              >
                <div className="text-xs font-medium truncate">
                  {m.name || "(no name)"}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {m.role || ""}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* details */}
      <div className="flex-1 h-full overflow-y-auto p-3">
        {!draft ? (
          <div className="text-[11px] text-gray-500">
            Select or add a crew member.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {draft.name || "Crew Member"}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={saveCrew}
                  className="bg-sky-500/90 hover:bg-sky-500 text-black text-[11px] px-3 py-[3px] rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteCrew(draft.id)}
                  className="bg-red-500/80 hover:bg-red-500 text-white text-[11px] px-3 py-[3px] rounded"
                >
                  Delete
                </button>
              </div>
            </div>

            <Field label="Name">
              <input
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </Field>

            {/* typeable dropdown for role */}
            <Field label="Role / Position">
              <>
                <input
                  list="crew-roles"
                  value={draft.role || ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, role: e.target.value }))
                  }
                  className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-400"
                  placeholder="Choose or type a role..."
                />
                <datalist id="crew-roles">
                  {COMMON_ROLES.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </>
            </Field>

            {/* typeable dropdown for department */}
            <Field label="Department">
              <>
                <input
                  list="crew-depts"
                  value={draft.department || ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, department: e.target.value }))
                  }
                  className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-400"
                  placeholder="Camera, Sound, Art..."
                />
                <datalist id="crew-depts">
                  {COMMON_DEPTS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </>
            </Field>

            <Field label="Contact">
              <input
                value={draft.contact || ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, contact: e.target.value }))
                }
                className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-400"
                placeholder="email / phone"
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={draft.notes || ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: e.target.value }))
                }
                rows={3}
                className="w-full bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-400"
                placeholder="call sheet notes, availability, union, etc."
              />
            </Field>

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
                  className="flex-1 bg-[#141414] border border-[#222] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-400"
                />
                <button
                  onClick={addImage}
                  className="bg-sky-500/90 hover:bg-sky-500 text-black text-[11px] px-3 py-[3px] rounded"
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
                            alt={img.tag || "crew photo"}
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
                          className="w-full bg-[#191919] border border-[#333] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-sky-400"
                          placeholder="Headshot / BTS / ID..."
                        />
                        {img.url && (
                          <a
                            href={img.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-[10px] text-sky-200 truncate"
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
