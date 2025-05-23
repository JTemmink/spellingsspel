import { 
  Word, 
  SpecialPracticeItem, 
  Settings,
  readSpecialPracticeList,
  writeSpecialPracticeList,
  readSettings,
  readWordLists,
  readWords,
  writeWords,
  generateId
} from './database';

// Check if a spelling attempt is correct
export function checkSpelling(inputWord: string, correctWord: string): boolean {
  return inputWord.toLowerCase().trim() === correctWord.toLowerCase().trim();
}

// Calculate points for a spelling attempt
export function calculatePoints(
  isCorrect: boolean, 
  settings: Settings, 
  isFromSpecialList: boolean = false
): number {
  if (!isCorrect) return 0;
  
  // Extra points for words from special practice list
  const multiplier = isFromSpecialList ? 1.5 : 1;
  return Math.round(settings.correct_word_points * multiplier);
}

// Update special practice list based on spelling attempt
export async function updateSpecialPracticeList(
  userId: string,
  wordId: string,
  isCorrect: boolean
): Promise<void> {
  const specialList = await readSpecialPracticeList();
  const existingItem = specialList.find(
    item => item.word_id === wordId && item.user_id === userId
  );

  if (isCorrect) {
    if (existingItem) {
      existingItem.correct_streak++;
      existingItem.last_practiced = new Date().toISOString();
      
      // Remove from special list if 5 consecutive correct answers
      if (existingItem.correct_streak >= 5) {
        // Also remove from "Moeilijke Woorden" list
        await removeFromDifficultWordsList(userId, wordId);
        
        const updatedList = specialList.filter(
          item => !(item.word_id === wordId && item.user_id === userId)
        );
        await writeSpecialPracticeList(updatedList);
        return;
      }
    }
  } else {
    // Add word to "Moeilijke Woorden" list on first mistake
    await addToDifficultWordsList(userId, wordId);
    
    if (existingItem) {
      existingItem.mistake_count++;
      existingItem.correct_streak = 0;
      existingItem.last_practiced = new Date().toISOString();
    } else {
      // Add to special list if first mistake
      const newItem: SpecialPracticeItem = {
        id: generateId('special'),
        word_id: wordId,
        user_id: userId,
        mistake_count: 1,
        correct_streak: 0,
        last_practiced: new Date().toISOString()
      };
      specialList.push(newItem);
    }
  }

  await writeSpecialPracticeList(specialList);
}

// Get words for practice session (including special practice words)
export async function getWordsForPractice(
  userId: string,
  selectedWords: Word[],
  includeSpecialWords: boolean = true
): Promise<Word[]> {
  const practiceWords = [...selectedWords];

  if (includeSpecialWords) {
    const specialList = await readSpecialPracticeList();
    const userSpecialItems = specialList.filter(item => item.user_id === userId);
    
    // Add special practice words (with higher frequency)
    for (const specialItem of userSpecialItems) {
      const specialWord = selectedWords.find(word => word.id === specialItem.word_id);
      if (specialWord) {
        // Add the word multiple times based on mistake count (max 3 times)
        const frequency = Math.min(specialItem.mistake_count, 3);
        for (let i = 0; i < frequency; i++) {
          practiceWords.push(specialWord);
        }
      }
    }
  }

  // Shuffle the array
  return shuffleArray(practiceWords);
}

// Shuffle array utility function
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if user has daily streak
export function checkDailyStreak(lastPlayDate: string | null): boolean {
  if (!lastPlayDate) return false;
  
  const lastPlay = new Date(lastPlayDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if last play was yesterday
  return (
    lastPlay.toDateString() === yesterday.toDateString() ||
    lastPlay.toDateString() === today.toDateString()
  );
}

// Calculate streak points
export async function calculateStreakPoints(userId: string): Promise<number> {
  const settings = await readSettings();
  const userSettings = settings.find(s => s.user_id === userId);
  
  if (!userSettings) return 0;
  
  // This would need to be integrated with practice sessions
  // For now, return base streak points
  return userSettings.streak_points;
}

// Speech synthesis for word pronunciation
export function speakWord(word: string): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'nl-NL'; // Dutch language
    utterance.rate = 0.8; // Slightly slower for clarity
    utterance.pitch = 1.2; // Slightly higher pitch for kids
    speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech synthesis not supported in this browser');
  }
}

// Format time for display
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Check if session qualifies for time-based points
export function checkTimeBasedPoints(
  sessionDuration: number, 
  settings: Settings
): boolean {
  const minutesPlayed = Math.floor(sessionDuration / 60);
  return minutesPlayed >= settings.time_threshold;
}

// Add word to "Moeilijke Woorden" list if it doesn't exist there
async function addToDifficultWordsList(userId: string, wordId: string): Promise<void> {
  try {
    // Get the word details
    const words = await readWords();
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    // Find the "Moeilijke Woorden" list
    const wordLists = await readWordLists();
    const difficultList = wordLists.find(list => 
      list.user_id === userId && list.name === "Moeilijke Woorden"
    );
    
    if (!difficultList) return;

    // Check if word already exists in the difficult words list
    const existingWordInDifficultList = words.find(w => 
      w.list_id === difficultList.id && w.word === word.word
    );

    if (existingWordInDifficultList) return; // Word already in difficult list

    // Add word to difficult words list
    const newDifficultWord: Word = {
      id: generateId('word'),
      list_id: difficultList.id,
      word: word.word,
      explanation: word.explanation || `Moeilijk woord: ${word.word}`
    };

    words.push(newDifficultWord);
    await writeWords(words);
    
    console.log(`Added "${word.word}" to Moeilijke Woorden list`);
  } catch (error) {
    console.error('Error adding word to difficult words list:', error);
  }
}

// Remove word from "Moeilijke Woorden" list if mastered
async function removeFromDifficultWordsList(userId: string, wordId: string): Promise<void> {
  try {
    // Get the original word details
    const words = await readWords();
    const originalWord = words.find(w => w.id === wordId);
    if (!originalWord) return;

    // Find the "Moeilijke Woorden" list
    const wordLists = await readWordLists();
    const difficultList = wordLists.find(list => 
      list.user_id === userId && list.name === "Moeilijke Woorden"
    );
    
    if (!difficultList) return;

    // Find and remove the word from difficult words list
    const updatedWords = words.filter(w => 
      !(w.list_id === difficultList.id && w.word === originalWord.word)
    );

    if (updatedWords.length < words.length) {
      await writeWords(updatedWords);
      console.log(`Removed "${originalWord.word}" from Moeilijke Woorden list - mastered!`);
    }
  } catch (error) {
    console.error('Error removing word from difficult words list:', error);
  }
} 