import { NextRequest, NextResponse } from 'next/server';
import { 
  readWords, 
  readSettings,
  getWordsForList
} from '@/lib/database';
import { getWordsForPractice } from '@/lib/game-logic';

// GET /api/practice-words - Get words for a practice session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'user_1';
    const listId = searchParams.get('listId') || 'list_1';
    const maxWords = parseInt(searchParams.get('maxWords') || '10');

    // Get words for the specified list
    const listWords = await getWordsForList(listId);
    
    if (listWords.length === 0) {
      return NextResponse.json({ error: 'No words found for this list' }, { status: 404 });
    }

    // Get shuffled words including special practice words
    const practiceWords = await getWordsForPractice(userId, listWords);
    
    // Limit to maxWords
    const sessionWords = practiceWords.slice(0, Math.min(maxWords, practiceWords.length));

    // Get user settings
    const settings = await readSettings();
    const userSettings = settings.find(s => s.user_id === userId) || settings[0];

    return NextResponse.json({
      words: sessionWords,
      settings: userSettings
    });
  } catch (error) {
    console.error('Error fetching practice words:', error);
    return NextResponse.json({ error: 'Failed to fetch practice words' }, { status: 500 });
  }
} 