import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/word-lists - Haal alle woordlijsten op voor een user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'user_1';

    const { data: wordLists, error } = await supabase
      .from('word_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch word lists' }, { status: 500 });
    }

    return NextResponse.json({ wordLists });
  } catch (error) {
    console.error('Error fetching word lists:', error);
    return NextResponse.json({ error: 'Failed to fetch word lists' }, { status: 500 });
  }
}

// POST /api/word-lists - Create a new word list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, name, description, difficulty } = body;

    if (!user_id || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 });
    }

    const wordLists = await readWordLists();
    const newWordList: WordList = {
      id: generateId('list'),
      user_id,
      name: name.trim(),
      description: description?.trim() || '',
      difficulty: difficulty || 'Gemiddeld'
    };

    wordLists.push(newWordList);
    await writeWordLists(wordLists);

    return NextResponse.json(newWordList, { status: 201 });
  } catch (error) {
    console.error('Error creating word list:', error);
    return NextResponse.json({ error: 'Failed to create word list' }, { status: 500 });
  }
}

// PUT /api/word-lists - Update a word list
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, difficulty } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    const wordLists = await readWordLists();
    const listIndex = wordLists.findIndex(list => list.id === id);

    if (listIndex === -1) {
      return NextResponse.json({ error: 'Word list not found' }, { status: 404 });
    }

    wordLists[listIndex] = {
      ...wordLists[listIndex],
      name: name.trim(),
      description: description?.trim() || '',
      difficulty: difficulty || 'Gemiddeld'
    };
    await writeWordLists(wordLists);

    return NextResponse.json(wordLists[listIndex]);
  } catch (error) {
    console.error('Error updating word list:', error);
    return NextResponse.json({ error: 'Failed to update word list' }, { status: 500 });
  }
}

// DELETE /api/word-lists - Delete a word list and its words
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Remove the word list
    const wordLists = await readWordLists();
    const updatedWordLists = wordLists.filter(list => list.id !== id);
    await writeWordLists(updatedWordLists);

    // Remove all words associated with this list
    const words = await readWords();
    const updatedWords = words.filter(word => word.list_id !== id);
    await writeWords(updatedWords);

    return NextResponse.json({ message: 'Word list deleted successfully' });
  } catch (error) {
    console.error('Error deleting word list:', error);
    return NextResponse.json({ error: 'Failed to delete word list' }, { status: 500 });
  }
} 