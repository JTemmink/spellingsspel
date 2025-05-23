import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Query to get all table schemas and columns
    const { data: tableInfo, error } = await supabase.rpc('get_table_info');

    if (error) {
      // Fallback: use manual SQL query
      const { data: manualData, error: manualError } = await supabase
        .from('information_schema.tables')
        .select(`
          table_name,
          table_schema
        `)
        .eq('table_schema', 'public');

      if (manualError) {
        throw manualError;
      }

      return NextResponse.json({
        success: true,
        tables: manualData,
        columns: {},
        note: 'Limited schema info - columns info not available'
      });
    }

    return NextResponse.json({
      success: true,
      data: tableInfo
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      tables: [
        'users', 'word_lists', 'words', 'spelling_attempts', 
        'practice_sessions', 'points', 'settings', 'special_practice_list'
      ],
      note: 'Using expected table names as fallback'
    });
  }
} 