// CharacterMap.jsx
import React, { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  query
} from 'firebase/firestore';

const LINKS_COLLECTION = 'screenplay_character_links';

export default function CharacterMap({ db, userId, appId, characters }) {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (!db || !userId) return;
    const path = `/artifacts/${appId}/users/${userId}/${LINKS_COLLECTION}`;
    const q = query(collection(db, path));
    const unsub = onSnapshot(q, (snap) => {
      setLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [db, userId, appId]);

  const addLink = async (fromId, toId, type = 'knows') => {
    if (!fromId || !toId) return;
    const path = `/artifacts/${appId}/users/${userId}/${LINKS_COLLECTION}`;
    await addDoc(collection(db, path), {
      fromId,
      toId,
      type,
      createdAt: new Date(),
    });
  };

  const removeLink = async (id) => {
    const path = `/artifacts/${appId}/users/${userId}/${LINKS_COLLECTION}`;
    await deleteDoc(doc(db, path, id));
  };

  return (
    <div className="p-4 bg-gray-900 text-white h-full">
      <h2 className="text-sm font-semibold mb-3">Character Map</h2>
      {/* super basic add UI */}
      <div className="flex gap-2 mb-4">
        <select id="from" className="bg-gray-800 p-1 rounded text-sm" defaultValue="">
          <option value="">From…</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select id="to" className="bg-gray-800 p-1 rounded text-sm" defaultValue="">
          <option value="">To…</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            const from = document.getElementById('from').value;
            const to = document.getElementById('to').value;
            addLink(from, to, 'knows');
          }}
          className="bg-amber-600 px-3 rounded text-sm"
        >
          link
        </button>
      </div>

      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="text-xs text-gray-400">No links yet.</p>
        ) : (
          links.map((l) => {
            const from = characters.find((c) => c.id === l.fromId);
            const to = characters.find((c) => c.id === l.toId);
            return (
              <div key={l.id} className="flex justify-between items-center bg-gray-800 p-2 rounded text-xs">
                <span>
                  {from ? from.name : '??'} → {to ? to.name : '??'} ({l.type})
                </span>
                <button onClick={() => removeLink(l.id)} className="text-red-400 text-xs">
                  remove
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
