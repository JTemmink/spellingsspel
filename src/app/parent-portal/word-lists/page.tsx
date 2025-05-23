'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Word {
  id: string;
  list_id: string;
  word: string;
  explanation: string;
}

interface WordList {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  words?: Word[];
}

export default function WordListsPage() {
  const [mounted, setMounted] = useState(false);
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Word modals
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [showEditWordModal, setShowEditWordModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [newWord, setNewWord] = useState({ word: '', explanation: '' });
  
  // List modals
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [editingList, setEditingList] = useState<WordList | null>(null);
  const [newList, setNewList] = useState({ 
    name: '', 
    description: '', 
    difficulty: 'Gemiddeld' 
  });
  
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Check authentication
    const auth = localStorage.getItem('parentAuth');
    if (auth !== 'true') {
      router.push('/parent-portal/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load word lists and words in parallel
      const [listsResponse, wordsResponse] = await Promise.all([
        fetch('/api/word-lists?userId=user_1'),
        fetch('/api/word-lists/words')
      ]);

      if (listsResponse.ok) {
        const listsData = await listsResponse.json();
        setWordLists(listsData.wordLists || []);
      }

      if (wordsResponse.ok) {
        const wordsData = await wordsResponse.json();
        setWords(wordsData.words || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Word functions
  const handleAddWord = async () => {
    if (!newWord.word.trim() || !selectedList) return;

    try {
      const response = await fetch('/api/word-lists/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: selectedList,
          word: newWord.word.trim(),
          explanation: newWord.explanation.trim()
        })
      });

      if (response.ok) {
        await loadData();
        setNewWord({ word: '', explanation: '' });
        setShowAddWordModal(false);
      }
    } catch (error) {
      console.error('Error adding word:', error);
    }
  };

  const handleEditWord = async () => {
    if (!editingWord) return;

    try {
      const response = await fetch('/api/word-lists/words', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWord.id,
          word: editingWord.word.trim(),
          explanation: editingWord.explanation.trim()
        })
      });

      if (response.ok) {
        await loadData();
        setEditingWord(null);
        setShowEditWordModal(false);
      }
    } catch (error) {
      console.error('Error editing word:', error);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm('Weet je zeker dat je dit woord wilt verwijderen?')) return;

    try {
      const response = await fetch('/api/word-lists/words', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wordId })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  };

  // List functions
  const handleAddList = async () => {
    if (!newList.name.trim()) return;

    try {
      const response = await fetch('/api/word-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user_1',
          name: newList.name.trim(),
          description: newList.description.trim(),
          difficulty: newList.difficulty
        })
      });

      if (response.ok) {
        await loadData();
        setNewList({ name: '', description: '', difficulty: 'Gemiddeld' });
        setShowAddListModal(false);
      }
    } catch (error) {
      console.error('Error adding list:', error);
    }
  };

  const handleEditList = async () => {
    if (!editingList) return;

    try {
      const response = await fetch('/api/word-lists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingList.id,
          name: editingList.name.trim(),
          description: editingList.description.trim(),
          difficulty: editingList.difficulty
        })
      });

      if (response.ok) {
        await loadData();
        setEditingList(null);
        setShowEditListModal(false);
      }
    } catch (error) {
      console.error('Error editing list:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    const wordsCount = getWordsForList(listId).length;
    const confirmMessage = wordsCount > 0 
      ? `Deze lijst bevat ${wordsCount} woorden. Weet je zeker dat je de lijst én alle woorden wilt verwijderen?`
      : 'Weet je zeker dat je deze lijst wilt verwijderen?';
    
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/word-lists?id=${listId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (selectedList === listId) {
          setSelectedList(null);
        }
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const getWordsForList = (listId: string) => {
    return words.filter(word => word.list_id === listId);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 p-4" data-theme="light">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="navbar bg-white/80 backdrop-blur-sm shadow-lg rounded-lg mb-6"
      >
        <div className="navbar-start">
          <Link href="/parent-portal/dashboard">
            <button className="btn btn-ghost">← Dashboard</button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 ml-4">📝 Woordlijsten Beheren</h1>
        </div>
        <div className="navbar-end gap-2">
          <button 
            onClick={() => setShowAddListModal(true)}
            className="btn btn-secondary"
          >
            + Nieuwe Lijst
          </button>
          <button 
            onClick={() => setShowAddWordModal(true)}
            disabled={!selectedList}
            className="btn btn-primary"
          >
            + Nieuw Woord
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Word Lists Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="card bg-white shadow-xl"
              >
                <div className="card-body">
                  <h2 className="card-title">Beschikbare Woordlijsten</h2>
                  <div className="space-y-2">
                    {wordLists.map((list) => (
                      <motion.div
                        key={list.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`card shadow-xl cursor-pointer transition-all duration-200 ${
                          list.name === "Moeilijke Woorden" 
                            ? "bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200" 
                            : selectedList === list.id 
                            ? "bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300" 
                            : "bg-white hover:bg-gray-50"}`}
                        onClick={() => setSelectedList(list.id)}
                      >
                        <div className="card-body">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="card-title flex items-center gap-2">
                                📚 {list.name}
                                {list.name === "Moeilijke Woorden" && (
                                  <div className="badge badge-error badge-sm">
                                    🤖 Automatisch
                                  </div>
                                )}
                              </h3>
                              <p className="text-gray-600 mb-4">
                                {list.description || 'Geen beschrijving'}
                              </p>
                              {list.name === "Moeilijke Woorden" && (
                                <div className="alert alert-info alert-sm mb-4">
                                  <span className="text-sm">
                                    ℹ️ Deze lijst wordt automatisch gevuld met foutgespelde woorden. 
                                    Woorden verdwijnen na 5 correcte pogingen.
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="dropdown dropdown-end">
                              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                                ⋮
                              </div>
                              <ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                                {list.name !== "Moeilijke Woorden" && (
                                  <li>
                                    <button onClick={() => {
                                      setEditingList(list);
                                      setShowEditListModal(true);
                                    }}>
                                      ✏️ Bewerken
                                    </button>
                                  </li>
                                )}
                                {list.name !== "Moeilijke Woorden" && (
                                  <li>
                                    <button 
                                      onClick={() => handleDeleteList(list.id)}
                                      className="text-error"
                                    >
                                      🗑️ Verwijderen
                                    </button>
                                  </li>
                                )}
                                {list.name === "Moeilijke Woorden" && (
                                  <li>
                                    <button disabled className="text-gray-400">
                                      🤖 Automatisch beheerd
                                    </button>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {wordLists.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      <p>Nog geen woordlijsten.</p>
                      <p className="text-sm">Maak er een aan!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Words List */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="card bg-white shadow-xl"
              >
                <div className="card-body">
                  {selectedList ? (
                    <>
                      <h2 className="card-title">
                        Woorden in "{wordLists.find(l => l.id === selectedList)?.name}"
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Woord</th>
                              <th>Uitleg</th>
                              <th>Acties</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getWordsForList(selectedList).map((word) => (
                              <tr key={word.id}>
                                <td className="font-semibold">{word.word}</td>
                                <td className="max-w-xs truncate">{word.explanation}</td>
                                <td>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingWord(word);
                                        setShowEditWordModal(true);
                                      }}
                                      className="btn btn-sm btn-ghost"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWord(word.id)}
                                      className="btn btn-sm btn-ghost text-error"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {getWordsForList(selectedList).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            Geen woorden in deze lijst. Voeg er een toe!
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20 text-gray-500">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-xl font-semibold mb-2">Selecteer een woordlijst</h3>
                      <p>Kies een woordlijst uit het linkermenu om de woorden te bekijken en te bewerken.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Add List Modal */}
      <AnimatePresence>
        {showAddListModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddListModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="card bg-white shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body">
                <h2 className="card-title">Nieuwe Woordlijst Aanmaken</h2>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Naam</span>
                  </label>
                  <input
                    type="text"
                    value={newList.name}
                    onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                    placeholder="Bijv. Nederlands Week 2"
                    className="input input-bordered w-full"
                    autoFocus
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Beschrijving</span>
                  </label>
                  <textarea
                    value={newList.description}
                    onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                    placeholder="Korte beschrijving van deze woordlijst..."
                    className="textarea textarea-bordered w-full"
                    rows={2}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Moeilijkheidsgraad</span>
                  </label>
                  <select 
                    value={newList.difficulty}
                    onChange={(e) => setNewList({ ...newList, difficulty: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="Makkelijk">Makkelijk</option>
                    <option value="Gemiddeld">Gemiddeld</option>
                    <option value="Moeilijk">Moeilijk</option>
                  </select>
                </div>

                <div className="card-actions justify-end">
                  <button onClick={() => setShowAddListModal(false)} className="btn btn-ghost">
                    Annuleren
                  </button>
                  <button onClick={handleAddList} className="btn btn-primary">
                    Aanmaken
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit List Modal */}
      <AnimatePresence>
        {showEditListModal && editingList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditListModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="card bg-white shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body">
                <h2 className="card-title">Woordlijst Bewerken</h2>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Naam</span>
                  </label>
                  <input
                    type="text"
                    value={editingList.name}
                    onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                    className="input input-bordered w-full"
                    autoFocus
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Beschrijving</span>
                  </label>
                  <textarea
                    value={editingList.description}
                    onChange={(e) => setEditingList({ ...editingList, description: e.target.value })}
                    className="textarea textarea-bordered w-full"
                    rows={2}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Moeilijkheidsgraad</span>
                  </label>
                  <select 
                    value={editingList.difficulty}
                    onChange={(e) => setEditingList({ ...editingList, difficulty: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="Makkelijk">Makkelijk</option>
                    <option value="Gemiddeld">Gemiddeld</option>
                    <option value="Moeilijk">Moeilijk</option>
                  </select>
                </div>

                <div className="card-actions justify-end">
                  <button onClick={() => setShowEditListModal(false)} className="btn btn-ghost">
                    Annuleren
                  </button>
                  <button onClick={handleEditList} className="btn btn-primary">
                    Opslaan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Word Modal */}
      <AnimatePresence>
        {showAddWordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddWordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="card bg-white shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body">
                <h2 className="card-title">Nieuw Woord Toevoegen</h2>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Woord</span>
                  </label>
                  <input
                    type="text"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    placeholder="Bijv. astronaut"
                    className="input input-bordered w-full"
                    autoFocus
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Uitleg</span>
                  </label>
                  <textarea
                    value={newWord.explanation}
                    onChange={(e) => setNewWord({ ...newWord, explanation: e.target.value })}
                    placeholder="Korte uitleg van het woord..."
                    className="textarea textarea-bordered w-full"
                    rows={3}
                  />
                </div>

                <div className="card-actions justify-end">
                  <button onClick={() => setShowAddWordModal(false)} className="btn btn-ghost">
                    Annuleren
                  </button>
                  <button onClick={handleAddWord} className="btn btn-primary">
                    Toevoegen
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Word Modal */}
      <AnimatePresence>
        {showEditWordModal && editingWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditWordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="card bg-white shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body">
                <h2 className="card-title">Woord Bewerken</h2>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Woord</span>
                  </label>
                  <input
                    type="text"
                    value={editingWord.word}
                    onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                    className="input input-bordered w-full"
                    autoFocus
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Uitleg</span>
                  </label>
                  <textarea
                    value={editingWord.explanation}
                    onChange={(e) => setEditingWord({ ...editingWord, explanation: e.target.value })}
                    className="textarea textarea-bordered w-full"
                    rows={3}
                  />
                </div>

                <div className="card-actions justify-end">
                  <button onClick={() => setShowEditWordModal(false)} className="btn btn-ghost">
                    Annuleren
                  </button>
                  <button onClick={handleEditWord} className="btn btn-primary">
                    Opslaan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 