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
      words_migrated: 0,
      errors: []
    };

    // Get current word_lists from database
    const { data: currentWordLists, error: fetchError } = await supabase
      .from('word_lists')
      .select('id, name');

    if (fetchError) {
      results.errors.push(`Fetch word lists error: ${fetchError.message}`);
      return NextResponse.json(results);
    }

    if (!currentWordLists || currentWordLists.length === 0) {
      results.errors.push('No word lists found in database');
      return NextResponse.json(results);
    }

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

    // Clear existing words first
    try {
      const { error: clearError } = await supabase
        .from('words')
        .delete()
        .in('list_id', Object.values(idMapping));

      if (clearError) {
        results.errors.push(`Clear words error: ${clearError.message}`);
      }
    } catch (error: any) {
      results.errors.push(`Clear words: ${error.message}`);
    }

    // Prepare words for insertion
    const wordsToInsert = wordsData
      .filter((word: any) => idMapping[word.list_id])
      .map((word: any) => ({
        word: word.word,
        explanation: word.explanation,
        list_id: idMapping[word.list_id]
      }));

    if (wordsToInsert.length > 0) {
      // Insert words in batches
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

    results.success = results.errors.length === 0;

    return NextResponse.json({
      ...results,
      message: results.success ? 'Words migration successful!' : 'Words migration completed with some errors',
      wordListsFound: currentWordLists.length,
      idMapping,
      totalWordsToMigrate: wordsToInsert.length
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 