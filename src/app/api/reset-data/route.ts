import { NextResponse } from 'next/server';
import { isVercel } from '@/lib/supabaseClient';

// POST /api/reset-data - Reset all user data
export async function POST() {
  try {
    // If running on Vercel, geef een duidelijke foutmelding
    if (isVercel) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resetten van data is niet mogelijk op Vercel (read-only filesystem). Probeer lokaal.' 
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
      error: 'Fout bij resetten van data' 
    }, { status: 500 });
  }
} 