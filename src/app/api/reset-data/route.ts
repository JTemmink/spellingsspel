import { NextResponse } from 'next/server';
import { isVercel, supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// POST /api/reset-data - Reset all user data
export async function POST() {
  try {
    // Supabase reset
    if (isSupabaseConfigured) {
      try {
        // Let op: alleen uitvoeren met service role key!
        const tables = [
          'spelling_attempts',
          'practice_sessions',
          'points',
          'special_practice_list'
        ];
        for (const table of tables) {
          const res = await supabase.from(table).delete().neq('id', '');
          if (res.error) {
            return NextResponse.json({
              success: false,
              error: `Fout bij resetten van ${table}: ${res.error.message}`
            }, { status: 500 });
          }
        }
        return NextResponse.json({
          success: true,
          message: 'Alle Supabase data is succesvol gereset!'
        });
      } catch (supabaseError) {
        return NextResponse.json({
          success: false,
          error: 'Fout bij resetten van Supabase data: ' + (supabaseError instanceof Error ? supabaseError.message : 'Onbekende fout')
        }, { status: 500 });
      }
    }

    // If running on Vercel zonder Supabase, geef een duidelijke foutmelding
    if (isVercel) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resetten van data is niet mogelijk op Vercel zonder Supabase (read-only filesystem). Probeer lokaal.' 
      }, { status: 500 });
    }

    // Local development met file system access
    try {
      const {
        writeSpellingAttempts,
        writePracticeSessions,
        writePoints,
        writeSpecialPracticeList
      } = await import('@/lib/database');

      // Reset all data arrays to empty
      await Promise.all([
        writeSpellingAttempts([]),
        writePracticeSessions([]),
        writePoints([{
          id: 'points_1',
          user_id: 'user_1',
          total_points: 0,
          activity_type: 'initial',
          amount: 0,
          timestamp: new Date().toISOString()
        }]),
        writeSpecialPracticeList([])
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'Alle data is succesvol gereset!' 
      });

    } catch (fileError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Fout bij resetten van data: ' + (fileError instanceof Error ? fileError.message : 'Onbekende fout') 
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Fout bij resetten van data: ' + (error instanceof Error ? error.message : 'Onbekende fout')
    }, { status: 500 });
  }
} 