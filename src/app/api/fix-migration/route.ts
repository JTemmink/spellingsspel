import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const wordsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'words.json'), 'utf8'));

    const results = {
      success: true,
      user_created: false,
      word_lists_updated: 0,
      words_migrated: 0,
      errors: []
    };

    // Step 1: Create a user with a proper UUID
    let userId = 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b6d2c1a'; // Fixed UUID for our default user

    try {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .upsert([{
          id: userId,
          name: 'Test Gebruiker'
        }])
        .select()
        .single();

      if (userError) {
        results.errors.push(`User creation error: ${userError.message}`);
      } else {
        results.user_created = true;
      }
    } catch (error: any) {
      results.errors.push(`User step: ${error.message}`);
    }

    // Step 2: Update existing word_lists to use the proper user_id
    try {
      const { data: updatedLists, error: updateError } = await supabase
        .from('word_lists')
        .update({ user_id: userId })
        .is('user_id', null)
        .select();

      if (updateError) {
        results.errors.push(`Word lists update error: ${updateError.message}`);
      } else {
        results.word_lists_updated = updatedLists?.length || 0;
      }
    } catch (error: any) {
      results.errors.push(`Word lists update: ${error.message}`);
    }

    // Step 3: Get current word_lists with their new UUIDs
    const { data: currentWordLists, error: fetchError } = await supabase
      .from('word_lists')
      .select('id, name')
      .eq('user_id', userId);

    if (fetchError) {
      results.errors.push(`Fetch word lists error: ${fetchError.message}`);
      return NextResponse.json(results);
    }

    // Step 4: Create mapping and migrate words
    if (currentWordLists && currentWordLists.length > 0) {
      // Create mapping from original list names to new UUIDs
      const nameToIdMap: { [key: string]: string } = {};
      currentWordLists.forEach(list => {
        nameToIdMap[list.name] = list.id;
      });

      // Map original list IDs to names, then to new UUIDs
      const originalLists = [
        { id: 'list_1', name: 'Lijst 1' },
        { id: 'list_2', name: 'Lijst 2' },
        { id: 'list_3', name: 'Lijst 3' },
        { id: 'list_4', name: 'Lijst 4' },
        { id: 'list_1748004319437_luz6ro5ko', name: 'Moeilijke Woorden' }
      ];

      const idMapping: { [key: string]: string } = {};
      originalLists.forEach(list => {
        if (nameToIdMap[list.name]) {
          idMapping[list.id] = nameToIdMap[list.name];
        }
      });

      // Prepare words for insertion
      const wordsToInsert = wordsData
        .filter((word: any) => idMapping[word.list_id])
        .map((word: any) => ({
          word: word.word,
          explanation: word.explanation,
          list_id: idMapping[word.list_id]
        }));

      if (wordsToInsert.length > 0) {
        // Insert words in batches to avoid overwhelming the database
        const batchSize = 50;
        let totalInserted = 0;

        for (let i = 0; i < wordsToInsert.length; i += batchSize) {
          const batch = wordsToInsert.slice(i, i + batchSize);
          
          try {
            const { data: insertedWords, error: wordsError } = await supabase
              .from('words')
              .insert(batch)
              .select();

            if (wordsError) {
              results.errors.push(`Words batch ${Math.floor(i/batchSize) + 1} error: ${wordsError.message}`);
            } else {
              totalInserted += insertedWords?.length || 0;
            }
          } catch (error: any) {
            results.errors.push(`Words batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
          }
        }

        results.words_migrated = totalInserted;
      }
    }

    results.success = results.errors.length === 0;

    return NextResponse.json({
      ...results,
      message: results.success ? 'Migration fixed successfully!' : 'Migration completed with some errors',
      userId,
      wordListsFound: currentWordLists?.length || 0
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 