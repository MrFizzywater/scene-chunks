// CharacterPanel.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  serverTimestamp
} from 'firebase/firestore';
import { Loader2, Plus, Trash2, Save, ChevronLeft, User } from 'lucide-react';

const CHARACTERS_COLLECTION = 'screenplay_characters';

const EMPTY_CHARACTER = {
  name: 'New Character',
  role: '',
  goals: '',
  flaws: '',
  backstory: '',
  lookAndVibe: '',
  createdAt: null,
};

const LabeledInput = ({ id, label, value, onChange, placeholder, isTextarea = false }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1">
      {label}
    </label>
    {isTextarea ? (
      <textarea
        id={id}
        rows="4"
        className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    ) : (
      <input
        id={id}
        className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    )}
  </div>
);

export default function CharacterPanel({ db, userId, appId }) {
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  // listen
  useEffect(() => {
    if (!db || !userId) return;
    const collectionPath = `/artifacts/${appId}/users/${userId}/${CHARACTERS_COLLECTION}`;
    const charsCollectionRef = collection(db, collectionPath);
    const q = query(charsCollectionRef);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setCharacters(list);

        if (selectedCharId && !list.find((c) => c.id === selectedCharId)) {
          setSelectedCharId(null);
          setCurrentDraft(null);
        }

        setIsLoading(false);
      },
      (err) => {
        console.error('error fetching characters', err);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [db, userId, appId, selectedCharId]);

  const selectedCharacter = useMemo(
    () => characters.find((c) => c.id === selectedCharId),
    [characters, selectedCharId]
  );

  useEffect(() => {
    if (selectedCharacter) setCurrentDraft(selectedCharacter);
    else if (!selectedCharId) setCurrentDraft(null);
  }, [selectedCharacter, selectedCharId]);

  const getDocRef = useCallback(
    (id) => {
      if (!db || !userId) return null;
      const collectionPath = `/artifacts/${appId}/users/${userId}/${CHARACTERS_COLLECTION}`;
      return doc(db, collectionPath, id);
    },
    [db, userId, appId]
  );

  const getCollectionRef = useCallback(() => {
    if (!db || !userId) return null;
    const collectionPath = `/artifacts/${appId}/users/${userId}/${CHARACTERS_COLLECTION}`;
    return collection(db, collectionPath);
  }, [db, userId, appId]);

  const handleDraftChange = (e) => {
    const { id, value } = e.target;
    setCurrentDraft((prev) => ({ ...prev, [id]: value }));
  };

  const saveCharacter = async () => {
    if (!currentDraft || !currentDraft.id) return;
    const ref = getDocRef(currentDraft.id);
    if (!ref) return;
    const { id, ...data } = currentDraft;
    await setDoc(
      ref,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const addCharacter = async () => {
    const ref = getCollectionRef();
    if (!ref) return;
    const newCharacter = {
      ...EMPTY_CHARACTER,
      name: `New Character ${characters.length + 1}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(ref, newCharacter);
    setSelectedCharId(docRef.id);
    setViewMode('details');
  };

  const deleteCharacter = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const ref = getDocRef(id);
    if (!ref) return;
    await deleteDoc(ref);
    setSelectedCharId(null);
    setCurrentDraft(null);
    setViewMode('list');
  };

  const CharacterDetails = () => {
    if (!currentDraft)
      return (
        <div className="flex flex-col items-center justify-center p-4 h-full text-gray-400">
          <User className="w-10 h-10 mb-2" />
          Select a character or create one.
        </div>
      );

    return (
      <div className="h-full overflow-y-auto p-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className="sm:hidden text-amber-400"
            >
              <ChevronLeft />
            </button>
            <h1 className="text-xl font-semibold">{currentDraft.name || 'Untitled Character'}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveCharacter}
              className="flex items-center gap-1 bg-amber-600 px-3 py-1 rounded text-sm"
            >
              <Save size={16} /> Save
            </button>
            <button
              onClick={() => deleteCharacter(currentDraft.id, currentDraft.name)}
              className="bg-red-600 px-2 py-1 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <LabeledInput
            id="name"
            label="Name / Alias"
            value={currentDraft.name || ''}
            onChange={handleDraftChange}
            placeholder="e.g. Jane 'The Whisper' Doe"
          />
          <LabeledInput
            id="role"
            label="Role / Archetype"
            value={currentDraft.role || ''}
            onChange={handleDraftChange}
            placeholder="Protagonist, Mentor..."
          />
          <LabeledInput
            id="goals"
            label="Goals & Motivation"
            value={currentDraft.goals || ''}
            onChange={handleDraftChange}
            isTextarea
          />
          <LabeledInput
            id="flaws"
            label="Flaws & Weakness"
            value={currentDraft.flaws || ''}
            onChange={handleDraftChange}
            isTextarea
          />
          <LabeledInput
            id="backstory"
            label="Backstory / Key History"
            value={currentDraft.backstory || ''}
            onChange={handleDraftChange}
            isTextarea
          />
          <LabeledInput
            id="lookAndVibe"
            label="Look & Vibe"
            value={currentDraft.lookAndVibe || ''}
            onChange={handleDraftChange}
            isTextarea
          />
        </div>
      </div>
    );
  };

  const CharacterList = () => (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      <div className="p-3 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-sm font-semibold text-amber-400">Dossier ({characters.length})</h2>
        <button
          onClick={addCharacter}
          className="p-1 bg-amber-600 rounded-full"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 p-4 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : characters.length === 0 ? (
          <div className="p-3 text-gray-500 text-sm">No characters yet.</div>
        ) : (
          characters.map((char) => (
            <button
              key={char.id}
              onClick={() => {
                setSelectedCharId(char.id);
                setViewMode('details');
              }}
              className={`w-full text-left p-3 border-b border-gray-800 ${
                selectedCharId === char.id ? 'bg-amber-800/40 border-l-4 border-amber-500' : 'hover:bg-gray-800'
              }`}
            >
              <div className="text-sm text-white truncate">{char.name}</div>
              <div className="text-xs text-gray-400 truncate">
                {char.role || 'No role'}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-gray-900 text-white rounded-lg overflow-hidden">
      <div className={`w-full sm:w-1/3 ${viewMode === 'list' ? 'block' : 'hidden sm:block'}`}>
        <CharacterList />
      </div>
      <div className={`flex-1 bg-gray-800 ${viewMode === 'details' ? 'block' : 'hidden sm:block'}`}>
        <CharacterDetails />
      </div>
    </div>
  );
}
