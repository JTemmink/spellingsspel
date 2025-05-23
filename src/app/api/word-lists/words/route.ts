import { NextRequest, NextResponse } from 'next/server';
import { 
  readWords, 
  writeWords, 
  generateId,
  Word 
} from '@/lib/database';

// GET /api/word-lists/words - Get all words
export async function GET(request: NextRequest) {
  try {
    const words = await readWords();
    return NextResponse.json({ words });
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
  }
}

// POST /api/word-lists/words - Add a new word
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listId, word, explanation } = body;

    if (!listId || !word) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const words = await readWords();
    
    const newWord: Word = {
      id: generateId('word'),
      list_id: listId,
      word: word.trim(),
      explanation: explanation?.trim() || ''
    };

    words.push(newWord);
    await writeWords(words);

    return NextResponse.json({ word: newWord }, { status: 201 });
  } catch (error) {
    console.error('Error adding word:', error);
    return NextResponse.json({ error: 'Failed to add word' }, { status: 500 });
  }
}

// PUT /api/word-lists/words - Update an existing word
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, word, explanation } = body;

    if (!id || !word) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const words = await readWords();
    const wordIndex = words.findIndex(w => w.id === id);

    if (wordIndex === -1) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    words[wordIndex] = {
      ...words[wordIndex],
      word: word.trim(),
      explanation: explanation?.trim() || ''
    };

    await writeWords(words);

    return NextResponse.json({ word: words[wordIndex] });
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
  }
}

// DELETE /api/word-lists/words - Delete a word
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing word ID' }, { status: 400 });
    }

    const words = await readWords();
    const filteredWords = words.filter(w => w.id !== id);

    if (filteredWords.length === words.length) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    await writeWords(filteredWords);

    return NextResponse.json({ message: 'Word deleted successfully' });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
  }
} 