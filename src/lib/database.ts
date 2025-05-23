import { promises as fs } from 'fs';
import path from 'path';

// Types for our data structures
export interface User {
  id: string;
  email: string;
  password: string;
}

export interface WordList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  difficulty?: string;
}

export interface Word {
  id: string;
  list_id: string;
  word: string;
  explanation: string;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration: number;
}

export interface SpellingAttempt {
  id: string;
  session_id: string;
  word_id: string;
  input: string;
  correct: boolean;
}

export interface Points {
  id: string;
  user_id: string;
  total_points: number;
  activity_type: string;
  amount: number;
  timestamp: string;
}

export interface SpecialPracticeItem {
  id: string;
  word_id: string;
  user_id: string;
  mistake_count: number;
  correct_streak: number;
  last_practiced: string;
}

export interface Settings {
  id: string;
  user_id: string;
  correct_word_points: number;
  perfect_list_points: number;
  streak_points: number;
  time_points: number;
  time_threshold: number;
  parent_password: string;
}

// Helper function to get the data directory path
const getDataPath = (filename: string) => {
  return path.join(process.cwd(), 'data', filename);
};

// Generic function to read JSON files
export async function readJsonFile<T>(filename: string): Promise<T[]> {
  try {
    const filePath = getDataPath(filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

// Generic function to write JSON files
export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  try {
    const filePath = getDataPath(filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

// Specific functions for each data type
export const readUsers = () => readJsonFile<User>('users.json');
export const writeUsers = (users: User[]) => writeJsonFile('users.json', users);

export const readWordLists = () => readJsonFile<WordList>('word_lists.json');
export const writeWordLists = (wordLists: WordList[]) => writeJsonFile('word_lists.json', wordLists);

export const readWords = () => readJsonFile<Word>('words.json');
export const writeWords = (words: Word[]) => writeJsonFile('words.json', words);

export const readPracticeSessions = () => readJsonFile<PracticeSession>('practice_sessions.json');
export const writePracticeSessions = (sessions: PracticeSession[]) => writeJsonFile('practice_sessions.json', sessions);

export const readSpellingAttempts = () => readJsonFile<SpellingAttempt>('spelling_attempts.json');
export const writeSpellingAttempts = (attempts: SpellingAttempt[]) => writeJsonFile('spelling_attempts.json', attempts);

export const readPoints = () => readJsonFile<Points>('points.json');
export const writePoints = (points: Points[]) => writeJsonFile('points.json', points);

export const readSpecialPracticeList = () => readJsonFile<SpecialPracticeItem>('special_practice_list.json');
export const writeSpecialPracticeList = (items: SpecialPracticeItem[]) => writeJsonFile('special_practice_list.json', items);

export const readSettings = () => readJsonFile<Settings>('settings.json');
export const writeSettings = (settings: Settings[]) => writeJsonFile('settings.json', settings);

// Utility functions for ID generation
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${randomStr}`;
}

// Generate a session ID
export function generateSessionId(): string {
  return generateId('session');
}

// Generate a word ID
export function generateWordId(): string {
  return generateId('word');
}

// Generate a word list ID
export function generateWordListId(): string {
  return generateId('list');
} 