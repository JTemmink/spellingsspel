'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { speakWord, addPoints, addPointsToAPI, syncPoints } from '@/lib/utils';

interface Word {
  id: string;
  list_id: string;
  word: string;
  explanation: string;
}

interface Settings {
  id: string;
  user_id: string;
  correct_word_points: number;
  perfect_list_points: number;
  streak_points: number;
  time_points: number;
  time_threshold: number;
}

interface GameSession {
  words: Word[];
  currentWordIndex: number;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: Date;
  sessionPoints: number;
}

interface WordListData {
  id: string;
  name: string;
  description?: string;
}

export default function PlayPage() {
  const [mounted, setMounted] = useState(false);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | null; message: string }>({ type: null, message: '' });
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  // List selection state
  const [showListSelection, setShowListSelection] = useState(true);
  const [availableLists, setAvailableLists] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  
  // Ref for input focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when game starts or word changes
  useEffect(() => {
    if (!isLoading && !gameComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord, isLoading, gameComplete, feedback.type]);

  // Load initial game data
  useEffect(() => {
    setMounted(true);
    loadAvailableLists();
    // Sync points on game load
    syncPoints();
  }, []);

  const loadAvailableLists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/word-lists?userId=user_1');
      
      if (response.ok) {
        const data = await response.json();
        if (data.wordLists && data.wordLists.length > 0) {
          setAvailableLists(data.wordLists.map((list: WordListData) => ({
            id: list.id,
            name: list.name,
            description: list.description || ''
          })));
        }
      } else {
        console.error('Failed to fetch word lists:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading word lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListSelection = (listId: string) => {
    setSelectedListId(listId);
    setShowListSelection(false);
    initializeGame(listId);
  };

  const initializeGame = async (listId: string) => {
    try {
      setIsLoading(true);
      setGameComplete(false);
      setFeedback({ type: null, message: '' });
      setShowExplanation(false);
      
      // Start a new practice session
      const sessionResponse = await fetch('/api/practice-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_1', listId })
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to start practice session');
      }
      
      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.sessionId);
      
      // Fetch practice words and settings from API
      const response = await fetch('/api/practice-words?userId=user_1&listId=' + listId + '&maxWords=5');
      
      if (!response.ok) {
        throw new Error('Failed to fetch practice words');
      }
      
      const data = await response.json();
      
      if (!data.words || data.words.length === 0) {
        console.error('No words found for practice');
        return;
      }

      setSettings(data.settings);

      const session: GameSession = {
        words: data.words,
        currentWordIndex: 0,
        score: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        startTime: new Date(),
        sessionPoints: 0
      };

      setGameSession(session);
      setCurrentWord(session.words[0]);
      
      // Speak the first word after a short delay
      setTimeout(() => {
        speakWord(session.words[0].word);
      }, 1000);
      
    } catch (error) {
      console.error('Error initializing game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!currentWord || !gameSession || !settings || userInput.trim() === '' || isProcessing || !sessionId) return;

    setIsProcessing(true);

    try {
      // Send spelling attempt to API
      const response = await fetch('/api/spelling-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_1',
          wordId: currentWord.id,
          word: currentWord.word,
          userInput: userInput.trim(),
          settings: settings,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process spelling attempt');
      }

      const result = await response.json();
      const isCorrect = result.correct;
      const points = result.points || 0;
      
      // Update session stats
      const updatedSession = {
        ...gameSession,
        correctAnswers: gameSession.correctAnswers + (isCorrect ? 1 : 0),
        incorrectAnswers: gameSession.incorrectAnswers + (isCorrect ? 0 : 1),
        sessionPoints: gameSession.sessionPoints + points
      };

      setGameSession(updatedSession);

      if (isCorrect) {
        setFeedback({ 
          type: 'correct', 
          message: `🎉 Goed gedaan! Je hebt "${currentWord.word}" correct gespeld! (+${points} punten)` 
        });
        
        // Add points to database and sync with localStorage
        try {
          await addPointsToAPI(points);
        } catch (error) {
          console.error('Error adding points to API:', error);
          // Fallback to localStorage only
          addPoints(points);
        }
        
        // Move to next word after delay
        setTimeout(() => {
          nextWord(updatedSession);
        }, 2000);
      } else {
        setFeedback({ 
          type: 'incorrect', 
          message: `❌ Helaas, dat is niet goed. Het correcte woord is "${currentWord.word}".` 
        });
      }
    } catch (error) {
      console.error('Error processing spelling attempt:', error);
      setFeedback({ 
        type: 'incorrect', 
        message: 'Er ging iets mis. Probeer het opnieuw.' 
      });
    } finally {
      setIsProcessing(false);
      setUserInput('');
    }
  }, [currentWord, gameSession, settings, userInput, isProcessing, sessionId, nextWord]);

  const endPracticeSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await fetch('/api/practice-sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } catch (error) {
      console.error('Error ending practice session:', error);
    }
  }, [sessionId]);

  const nextWord = useCallback((session: GameSession) => {
    const nextIndex = session.currentWordIndex + 1;
    
    if (nextIndex >= session.words.length) {
      // Game complete - end the practice session
      endPracticeSession();
      setGameComplete(true);
      setFeedback({ type: null, message: '' });
      return;
    }

    const nextWordItem = session.words[nextIndex];
    const updatedSession = { ...session, currentWordIndex: nextIndex };
    
    setGameSession(updatedSession);
    setCurrentWord(nextWordItem);
    setFeedback({ type: null, message: '' });
    setShowExplanation(false);
    
    // Speak the next word
    setTimeout(() => {
      speakWord(nextWordItem.word);
    }, 500);
  }, [endPracticeSession]);

  const repeatWord = () => {
    if (currentWord) {
      speakWord(currentWord.word);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      if (feedback.type === 'incorrect' && !showExplanation) {
        return; // Don't submit until they see explanation or move on
      }
      handleSubmit();
    }
  };

  // Handle page unload to end session
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId) {
        // Use sendBeacon for reliable session ending on page unload
        navigator.sendBeacon('/api/practice-sessions', JSON.stringify({ sessionId }));
      }
    };

    const handleUnload = () => {
      endPracticeSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      // End session when component unmounts
      if (sessionId) {
        endPracticeSession();
      }
    };
  }, [sessionId, endPracticeSession]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 via-base-200 to-base-300 flex items-center justify-center" data-theme="spellingsspel">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-xl">Spel aan het opstarten... 🚀</p>
        </div>
      </div>
    );
  }

  if (showListSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 via-base-200 to-base-300 relative overflow-hidden" data-theme="spellingsspel">
        {/* Background stars */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-50"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 p-6">
          <div className="flex justify-between items-center">
            <Link href="/">
              <button className="btn btn-ghost">
                ← Terug
              </button>
            </Link>
            <h1 className="text-2xl font-bold">Kies je Woordlijst</h1>
            <div></div>
          </div>
        </div>

        {/* List selection */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] p-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bubblegum mb-4">
              🎯 Kies je Uitdaging!
            </h1>
            <p className="text-xl opacity-80">
              Welke woordlijst wil je oefenen?
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
            {availableLists.map((list, index) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleListSelection(list.id)}
                className="card bg-base-100/80 backdrop-blur-sm shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300"
              >
                <div className="card-body text-center">
                  <h2 className="card-title text-2xl justify-center mb-2">
                    📚 {list.name}
                  </h2>
                  <p className="text-lg opacity-80 mb-4">
                    {list.description}
                  </p>
                  <div className="card-actions justify-center">
                    <button className="btn btn-primary btn-lg">
                      Speel deze lijst! 🚀
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {availableLists.length === 0 && (
            <div className="text-center">
              <p className="text-xl mb-4">Geen woordlijsten gevonden!</p>
              <Link href="/parent-portal/word-lists">
                <button className="btn btn-primary">
                  Voeg woordlijsten toe
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameComplete && gameSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 via-base-200 to-base-300 flex items-center justify-center p-8" data-theme="spellingsspel">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-base-100/80 backdrop-blur-sm shadow-2xl max-w-2xl w-full"
        >
          <div className="card-body text-center">
            <h2 className="card-title text-4xl justify-center mb-6">🎊 Spel Voltooid!</h2>
            
            <div className="stats stats-vertical lg:stats-horizontal shadow mb-6">
              <div className="stat">
                <div className="stat-title">Correcte antwoorden</div>
                <div className="stat-value text-success">{gameSession.correctAnswers}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Foute antwoorden</div>
                <div className="stat-value text-error">{gameSession.incorrectAnswers}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Verdiende punten</div>
                <div className="stat-value text-primary">{gameSession.sessionPoints}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  endPracticeSession(); // End current session
                  setShowListSelection(true);
                  setGameComplete(false);
                  setGameSession(null);
                  setCurrentWord(null);
                  setFeedback({ type: null, message: '' });
                  setSessionId('');
                }}
                className="btn btn-primary btn-lg"
              >
                🔄 Andere Lijst Kiezen
              </button>
              <button 
                onClick={() => {
                  endPracticeSession(); // End current session
                  initializeGame(selectedListId);
                }}
                className="btn btn-secondary btn-lg"
              >
                🔁 Zelfde Lijst Opnieuw
              </button>
              <Link href="/">
                <button className="btn btn-outline btn-lg">
                  🏠 Terug naar Home
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!gameSession || !currentWord) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Er ging iets mis bij het laden van het spel.</p>
          <Link href="/">
            <button className="btn btn-primary">Terug naar Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 via-base-200 to-base-300 relative overflow-hidden" data-theme="spellingsspel">
      {/* Background stars */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex justify-between items-center">
          <Link href="/">
            <button className="btn btn-ghost">
              ← Terug
            </button>
          </Link>
          
          <div className="text-center">
            <div className="text-sm opacity-70">Woord {gameSession.currentWordIndex + 1} van {gameSession.words.length}</div>
            <div className="text-lg font-bold">Punten: {gameSession.sessionPoints}</div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-70">Goed: {gameSession.correctAnswers}</div>
            <div className="text-sm opacity-70">Fout: {gameSession.incorrectAnswers}</div>
          </div>
        </div>
      </div>

      {/* Main game area */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] p-8">
        
        {/* Word prompt */}
        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bubblegum mb-4">
            Spel het woord dat je hoort! 🎧
          </h1>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={repeatWord}
            className="btn btn-accent btn-lg text-2xl px-8 py-4 rounded-full shadow-xl"
          >
            🔊 Luister nog een keer
          </motion.button>
        </motion.div>

        {/* Input field */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md mb-6"
        >
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Typ hier het woord..."
            className="input input-bordered input-lg w-full text-center text-2xl font-bubblegum"
            disabled={feedback.type === 'incorrect' && !showExplanation || isProcessing}
            autoFocus
            ref={inputRef}
          />
        </motion.div>

        {/* Submit button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={userInput.trim() === '' || (feedback.type === 'incorrect' && !showExplanation) || isProcessing}
          className="btn btn-primary btn-lg text-xl px-12 py-4 rounded-full shadow-xl mb-6"
        >
          {isProcessing ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Controleren...
            </>
          ) : (
            '✅ Controleer'
          )}
        </motion.button>

        {/* Feedback */}
        <AnimatePresence>
          {feedback.message && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className={`alert ${feedback.type === 'correct' ? 'alert-success' : 'alert-error'} max-w-2xl shadow-xl`}
            >
              <span className="text-lg">{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explanation button for incorrect answers */}
        {feedback.type === 'incorrect' && !showExplanation && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowExplanation(true)}
            className="btn btn-info btn-lg mt-4"
          >
            💡 Uitleg bekijken
          </motion.button>
        )}

        {/* Explanation modal */}
        {showExplanation && currentWord.explanation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-info/20 backdrop-blur-sm shadow-xl max-w-lg mt-6"
          >
            <div className="card-body">
              <h3 className="card-title">💡 Uitleg</h3>
              <p className="text-lg">{currentWord.explanation}</p>
              <div className="card-actions justify-end">
                <button 
                  onClick={() => nextWord(gameSession)}
                  className="btn btn-primary"
                >
                  Volgende woord →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 