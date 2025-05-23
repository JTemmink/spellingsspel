import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Fallback settings
const fallbackSettings = {
  id: 'settings_1',
  user_id: 'user_1',
  points_correct: 10,
  points_incorrect: -2,
  points_streak_bonus: 5,
  parent_password: '1001'
};

// GET /api/practice-words - Get words for a practice session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'user_1';
    const listId = searchParams.get('listId');
    const maxWords = parseInt(searchParams.get('maxWords') || '10');

    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }

    // Get words from the word-lists API (which already has fallback logic)
    try {
      const baseUrl = request.url.split('/api/')[0];
      const wordsResponse = await fetch(`${baseUrl}/api/word-lists/words?listId=${listId}`);
      
      if (!wordsResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch words for this list' }, { status: 404 });
      }

      const wordsData = await wordsResponse.json();
      const words = wordsData.words || [];

      if (words.length === 0) {
        return NextResponse.json({ error: 'No words found for this list' }, { status: 404 });
      }

      // Shuffle words for practice session
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      
      // Limit to maxWords
      const sessionWords = shuffledWords.slice(0, Math.min(maxWords, shuffledWords.length));

      // Get settings (fallback or from database)
      let settings = fallbackSettings;
      
      if (isSupabaseConfigured) {
        try {
          const { data: userSettings } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (userSettings) {
            settings = userSettings;
          }
        } catch (dbError) {
          console.log('Database error fetching settings, using fallback:', dbError);
        }
      }

      return NextResponse.json({
        words: sessionWords,
        settings
      });

    } catch (fetchError) {
      console.error('Error fetching words from API:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch practice words' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in practice-words API:', error);
    return NextResponse.json({ error: 'Failed to fetch practice words' }, { status: 500 });
  }
} 