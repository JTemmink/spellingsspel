import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { parseWoordlijstenMd } from '@/lib/parseWoordlijsten';

// Type definition for word objects
interface Word {
  id: string;
  word: string;
  explanation: string;
}

// Fallback data for when database is not available
const fallbackWords: { [key: string]: Word[] } = {
  'list_1_fallback': [
    { id: 'word_1', word: 'huis', explanation: 'Een plek om te wonen' },
    { id: 'word_2', word: 'boom', explanation: 'Een grote plant met takken' },
    { id: 'word_3', word: 'auto', explanation: 'Een voertuig om mee te rijden' }
  ],
  'list_2_fallback': [
    { id: 'word_4', word: 'bibliotheek', explanation: 'Een plek met veel boeken' },
    { id: 'word_5', word: 'restaurant', explanation: 'Een plek om te eten' },
    { id: 'word_6', word: 'ziekenhuis', explanation: 'Een plek waar dokters werken' }
  ]
};

// GET /api/word-lists/words?listId=xxx - Haal alle woorden op uit een specifieke woordlijst
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listId = searchParams.get('listId');

    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }

    // If Supabase is not configured, return words from woordlijsten.md
    if (!isSupabaseConfigured) {
      const lijsten = parseWoordlijstenMd();
      const index = parseInt(listId.replace('md_list_', '')) - 1;
      const lijst = lijsten[index];
      const words = lijst
        ? lijst.words.map((w, j) => ({ id: `md_word_${index + 1}_${j + 1}`, word: w, explanation: '' }))
        : [];
      return NextResponse.json({ words });
    }

    try {
      const { data: words, error } = await supabase
        .from('words')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error, returning fallback words:', error);
        const fallbackWordsForList = fallbackWords[listId] || fallbackWords['list_1_fallback'];
        return NextResponse.json({ words: fallbackWordsForList });
      }

      // If no words found in database, return fallback words
      if (!words || words.length === 0) {
        console.log('No words found in database, returning fallback words');
        const fallbackWordsForList = fallbackWords[listId] || fallbackWords['list_1_fallback'];
        return NextResponse.json({ words: fallbackWordsForList });
      }

      return NextResponse.json({ words });
    } catch (dbError) {
      console.error('Database connection failed, using fallback words:', dbError);
      const fallbackWordsForList = fallbackWords[listId] || fallbackWords['list_1_fallback'];
      return NextResponse.json({ words: fallbackWordsForList });
    }
  } catch (error) {
    console.error('Error in words API:', error);
    // Return some words so the game can still work
    return NextResponse.json({ words: fallbackWords['list_1_fallback'] });
  }
}

// POST /api/word-lists/words - Voeg een nieuw woord toe aan een woordlijst
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { list_id, words } = body;

    if (!list_id || !words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'List ID and words array are required' }, { status: 400 });
    }

    const inserts = words.map(word => ({
      list_id,
      word: word.trim(),
      explanation: ''
    }));

    const { data, error } = await supabase
      .from('words')
      .insert(inserts);

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add words' }, { status: 500 });
  }
}

// PUT /api/word-lists/words - Update een woord
export async function PUT(request: NextRequest) {
  // Early return if Supabase is not configured
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, word, explanation } = body;

    if (!id || !word) {
      return NextResponse.json({ error: 'ID and word are required' }, { status: 400 });
    }

    const res = await supabase
      .from('words')
      .update({
        word: word.trim(),
        explanation: explanation?.trim() || ''
      })
      .eq('id', id)
      .select()
      .single();

    if (res.error) {
      console.error('Supabase error:', res.error);
      return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
    }

    if (!res.data) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    return NextResponse.json(res.data);
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
  }
}

// DELETE /api/word-lists/words - Verwijder een woord
export async function DELETE(request: NextRequest) {
  // Early return if Supabase is not configured
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const res = await supabase
      .from('words')
      .delete()
      .eq('id', id);

    if (res.error) {
      console.error('Supabase error:', res.error);
      return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Word deleted successfully' });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
  }
} 