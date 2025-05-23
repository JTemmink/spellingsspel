import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/word-lists/words?listId=xxx - Haal alle woorden op uit een specifieke woordlijst
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listId = searchParams.get('listId');

    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }

    const { data: words, error } = await supabase
      .from('words')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch words', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ words });
  } catch (error: any) {
    console.error('Error fetching words:', error);
    return NextResponse.json({ error: 'Failed to fetch words', details: error.message }, { status: 500 });
  }
}

// POST /api/word-lists/words - Voeg een nieuw woord toe aan een woordlijst
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { list_id, word, explanation } = body;

    if (!list_id || !word) {
      return NextResponse.json({ error: 'List ID and word are required' }, { status: 400 });
    }

    const { data: newWord, error } = await supabase
      .from('words')
      .insert([{
        list_id,
        word: word.trim(),
        explanation: explanation?.trim() || ''
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create word' }, { status: 500 });
    }

    return NextResponse.json(newWord, { status: 201 });
  } catch (error) {
    console.error('Error creating word:', error);
    return NextResponse.json({ error: 'Failed to create word' }, { status: 500 });
  }
}

// PUT /api/word-lists/words - Update een woord
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, word, explanation } = body;

    if (!id || !word) {
      return NextResponse.json({ error: 'ID and word are required' }, { status: 400 });
    }

    const { data: updatedWord, error } = await supabase
      .from('words')
      .update({
        word: word.trim(),
        explanation: explanation?.trim() || ''
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
    }

    if (!updatedWord) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    return NextResponse.json(updatedWord);
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
  }
}

// DELETE /api/word-lists/words - Verwijder een woord
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Word deleted successfully' });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
  }
} 