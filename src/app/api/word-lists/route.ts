import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { parseWoordlijstenMd } from '@/lib/parseWoordlijsten';

// Fallback data for when database is not available
const fallbackWordLists = [
  {
    id: 'list_1_fallback',
    name: 'Demo Lijst 1',
    description: 'Basis woordenschat',
    difficulty: 'Gemakkelijk',
    created_at: new Date().toISOString()
  },
  {
    id: 'list_2_fallback', 
    name: 'Demo Lijst 2',
    description: 'Gevorderde woorden',
    difficulty: 'Gemiddeld',
    created_at: new Date().toISOString()
  }
];

// GET /api/word-lists - Haal alle woordlijsten op voor een user
export async function GET() {
  // If Supabase is not configured, return data from woordlijsten.md
  if (!isSupabaseConfigured) {
    const lijsten = parseWoordlijstenMd();
    const wordLists = lijsten.map((l, i) => ({
      id: `md_list_${i + 1}`,
      name: l.name,
      description: '',
      difficulty: 'Onbekend',
      created_at: new Date().toISOString()
    }));
    return NextResponse.json({ wordLists });
  }

  try {
    const { data: wordLists, error } = await supabase
      .from('word_lists')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error, falling back to demo data:', error);
      return NextResponse.json({ wordLists: fallbackWordLists });
    }

    return NextResponse.json({ wordLists: wordLists || fallbackWordLists });
  } catch (error) {
    console.error('Database connection failed, using fallback data:', error);
    return NextResponse.json({ wordLists: fallbackWordLists });
  }
}

// POST /api/word-lists - Create a new word list
export async function POST(request: NextRequest) {
  // Early return if Supabase is not configured
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { user_id, name, description, difficulty } = body;

    if (!user_id || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 });
    }

    const { data: newWordList, error } = await supabase
      .from('word_lists')
      .insert([{
        user_id,
        name: name.trim(),
        description: description?.trim() || '',
        difficulty: difficulty || 'Gemiddeld'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json(newWordList, { status: 201 });
  } catch (error) {
    console.error('Error creating word list:', error);
    return NextResponse.json({ error: 'Failed to create word list' }, { status: 500 });
  }
}

// PUT /api/word-lists - Update a word list
export async function PUT(request: NextRequest) {
  // Early return if Supabase is not configured
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, name, description, difficulty } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    const { data: updatedWordList, error } = await supabase
      .from('word_lists')
      .update({
        name: name.trim(),
        description: description?.trim() || '',
        difficulty: difficulty || 'Gemiddeld'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update word list' }, { status: 500 });
    }

    if (!updatedWordList) {
      return NextResponse.json({ error: 'Word list not found' }, { status: 404 });
    }

    return NextResponse.json(updatedWordList);
  } catch (error) {
    console.error('Error updating word list:', error);
    return NextResponse.json({ error: 'Failed to update word list' }, { status: 500 });
  }
}

// DELETE /api/word-lists - Delete a word list and its words
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

    // Remove all words associated with this list first (due to foreign key constraint)
    const { error: wordsError } = await supabase
      .from('words')
      .delete()
      .eq('list_id', id);

    if (wordsError) {
      console.error('Supabase error deleting words:', wordsError);
      return NextResponse.json({ error: 'Failed to delete associated words' }, { status: 500 });
    }

    // Remove the word list
    const { error: listError } = await supabase
      .from('word_lists')
      .delete()
      .eq('id', id);

    if (listError) {
      console.error('Supabase error deleting word list:', listError);
      return NextResponse.json({ error: 'Failed to delete word list' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Word list deleted successfully' });
  } catch (error) {
    console.error('Error deleting word list:', error);
    return NextResponse.json({ error: 'Failed to delete word list' }, { status: 500 });
  }
} 