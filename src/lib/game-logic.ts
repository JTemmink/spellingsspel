import {   Word,   SpecialPracticeItem,   Settings,  readSpecialPracticeList,  writeSpecialPracticeList,  readSettings,  readWords,  generateId, shuffleArray } from './database';

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
      existingItem.correct_streak += 1;
      existingItem.last_practiced = new Date().toISOString();
      
      // Remove from special practice list if correct streak is high enough
      if (existingItem.correct_streak >= 3) {
        const index = specialList.indexOf(existingItem);
        specialList.splice(index, 1);
      }
    }
  } else {
    // Incorrect attempt
    if (existingItem) {
      existingItem.mistake_count += 1;
      existingItem.correct_streak = 0;
      existingItem.last_practiced = new Date().toISOString();
    } else {
      // Add new item to special practice list
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

// Get practice words for a specific word list
export async function getPracticeWords(
  listId: string, 
  includeSpecialWords: boolean = true,
  userId?: string
): Promise<Word[]> {
  const words = await readWords();
  const selectedWords = words.filter(word => word.list_id === listId);

  const practiceWords: Word[] = [...selectedWords];

  // Add special practice words if requested
  if (includeSpecialWords && userId) {
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