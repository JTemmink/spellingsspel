import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), 'data');

    // Read essential JSON files
    const wordListsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'word_lists.json'), 'utf8'));
    const wordsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'words.json'), 'utf8'));

    const results = {
      word_lists: 0,
      words: 0,
      errors: []
    };

    // First check what tables exist
    const { data: existingTables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tableError) {
      results.errors.push(`Table check failed: ${tableError.message}`);
    }

    // Try to insert word lists with simple structure
    try {
      // Check if word_lists table exists and what columns it has
      const { data: testData, error: testError } = await supabase
        .from('word_lists')
        .select('*')
        .limit(1);

      if (testError) {
        results.errors.push(`Word lists table test: ${testError.message}`);
      } else {
        // Table exists, try to insert data
        const simplifiedWordLists = wordListsData.map((list: any) => ({
          name: list.name,
          description: list.description || '',
          // Only include fields that definitely exist in standard Supabase tables
        }));

        const { data, error } = await supabase
          .from('word_lists')
          .insert(simplifiedWordLists)
          .select();

        if (error) {
          results.errors.push(`Word lists insert: ${error.message}`);
        } else {
          results.word_lists = data?.length || 0;
        }
      }
    } catch (error: any) {
      results.errors.push(`Word lists: ${error.message}`);
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message: results.errors.length === 0 ? 'Simple migration completed' : 'Migration completed with errors',
      results,
      tableInfo: existingTables
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 