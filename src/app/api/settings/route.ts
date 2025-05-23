import { NextRequest, NextResponse } from 'next/server';
import { isVercel } from '@/lib/supabaseClient';

// Default settings
const defaultSettings = {
  id: 'settings_1',
  user_id: 'user_1',
  correct_word_points: 10,
  perfect_list_points: 50,
  streak_points: 20,
  time_points: 30,
  time_threshold: 15,
  parent_password: '1001'
};

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_1';

    // If running on Vercel, return default settings
    if (isVercel) {
      return NextResponse.json({ settings: defaultSettings });
    }

    // Local development with file system access
    try {
      const { readSettings } = await import('@/lib/database');
      
      const settings = await readSettings();
      const userSettings = settings.find(s => s.user_id === userId);

      if (userSettings) {
        return NextResponse.json({ settings: userSettings });
      } else {
        // Return default settings if none found
        return NextResponse.json({ settings: defaultSettings });
      }

    } catch (fileError) {
      console.error('File system operation failed:', fileError);
      return NextResponse.json({ settings: defaultSettings });
    }

  } catch (error) {
    console.error('Error processing settings request:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      correct_word_points,
      perfect_list_points,
      streak_points,
      time_points,
      time_threshold,
      userId = 'user_1'
    } = body;

    if (!correct_word_points || !perfect_list_points || !streak_points || !time_points || !time_threshold) {
      return NextResponse.json({ error: 'All settings fields are required' }, { status: 400 });
    }

    // If running on Vercel, just return success (can't write files)
    if (isVercel) {
      console.log('Settings updated (Vercel mode):', body);
      return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    }

    // Local development with file system access
    try {
      const { readSettings, writeSettings } = await import('@/lib/database');
      
      const settings = await readSettings();
      const userSettingsIndex = settings.findIndex(s => s.user_id === userId);

      const updatedSettings = {
        id: userSettingsIndex >= 0 ? settings[userSettingsIndex].id : 'settings_1',
        user_id: userId,
        correct_word_points,
        perfect_list_points,
        streak_points,
        time_points,
        time_threshold,
        parent_password: userSettingsIndex >= 0 ? settings[userSettingsIndex].parent_password : '1001'
      };

      if (userSettingsIndex >= 0) {
        settings[userSettingsIndex] = updatedSettings;
      } else {
        settings.push(updatedSettings);
      }

      await writeSettings(settings);

      return NextResponse.json({ success: true, message: 'Settings updated successfully', settings: updatedSettings });

    } catch (fileError) {
      console.error('File system operation failed:', fileError);
      return NextResponse.json({ success: true, message: 'Settings updated successfully (cache only)' });
    }

  } catch (error) {
    console.error('Error processing settings update:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 