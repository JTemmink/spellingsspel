import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), 'data');

    // Read all JSON files
    const usersData = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
    const wordListsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'word_lists.json'), 'utf8'));
    const wordsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'words.json'), 'utf8'));

    const results = {
      success: true,
      users: 0,
      updated_word_lists: 0,
      words: 0,
      errors: []
    };

    // Step 1: Create a default user if not exists
    try {
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', 'user_1')
        .single();

      if (userCheckError && userCheckError.code === 'PGRST116') {
        // User doesn't exist, create one
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            id: 'user_1',
            name: 'Test Gebruiker'
          }])
          .select()
          .single();

        if (createError) {
          results.errors.push(`Create user error: ${createError.message}`);
        } else {
          results.users = 1;
        }
      }
    } catch (error: any) {
      results.errors.push(`User creation: ${error.message}`);
    }

    // Step 2: Update word_lists to have correct user_id
    try {
      const { data: updatedLists, error: updateError } = await supabase
        .from('word_lists')
        .update({ user_id: 'user_1' })
        .is('user_id', null)
        .select();

      if (updateError) {
        results.errors.push(`Update word lists error: ${updateError.message}`);
      } else {
        results.updated_word_lists = updatedLists?.length || 0;
      }
    } catch (error: any) {
      results.errors.push(`Word lists update: ${error.message}`);
    }

    // Step 3: Get the current word_lists from database to map old IDs to new UUIDs
    const { data: currentWordLists, error: fetchError } = await supabase
      .from('word_lists')
      .select('id, name')
      .eq('user_id', 'user_1');

    if (fetchError) {
      results.errors.push(`Fetch word lists error: ${fetchError.message}`);
      return NextResponse.json(results);
    }

    // Create a mapping from old list names to new UUIDs
    const listMapping: { [key: string]: string } = {};
    const originalListMapping: { [key: string]: string } = {};
    
    wordListsData.forEach((oldList: any) => {
      const matchingNewList = currentWordLists?.find(newList => newList.name === oldList.name);
      if (matchingNewList) {
        listMapping[oldList.id] = matchingNewList.id;
        originalListMapping[oldList.name] = matchingNewList.id;
      }
    });

    // Step 4: Migrate words with correct list_id references
    try {
      // Clear existing words first to avoid duplicates
      const { error: clearError } = await supabase
        .from('words')
        .delete()
        .in('list_id', Object.values(listMapping));

      if (clearError) {
        results.errors.push(`Clear words error: ${clearError.message}`);
      }

      // Prepare words data with correct list_id mappings
      const wordsToInsert = wordsData
        .filter((word: any) => listMapping[word.list_id]) // Only include words with valid list mappings
        .map((word: any) => ({
          word: word.word,
          explanation: word.explanation,
          list_id: listMapping[word.list_id]
        }));

      if (wordsToInsert.length > 0) {
        const { data: insertedWords, error: wordsError } = await supabase
          .from('words')
          .insert(wordsToInsert)
          .select();

        if (wordsError) {
          results.errors.push(`Words insert error: ${wordsError.message}`);
        } else {
          results.words = insertedWords?.length || 0;
        }
      }
    } catch (error: any) {
      results.errors.push(`Words migration: ${error.message}`);
    }

    results.success = results.errors.length === 0;

    return NextResponse.json({
      ...results,
      message: results.success ? 'Complete migration successful!' : 'Migration completed with some errors',
      listMapping,
      totalWordLists: currentWordLists?.length || 0
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 