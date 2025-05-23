import { NextRequest, NextResponse } from 'next/server';
import { isVercel } from '@/lib/supabaseClient';

// POST /api/reset-data - Reset all user data
export async function POST(request: NextRequest) {
  try {
    // If running on Vercel, just return success (can't write files)
    if (isVercel) {
      console.log('Data reset attempted (Vercel mode) - cannot reset files');
      return NextResponse.json({ success: true, message: 'Data reset attempted (Vercel mode)' });
    }

    // Local development with file system access
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

      console.log('All user data has been reset successfully');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Alle data is succesvol gereset!' 
      });

    } catch (fileError) {
      console.error('File system operation failed:', fileError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to reset data: ' + fileError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing data reset:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to reset data' 
    }, { status: 500 });
  }
} 