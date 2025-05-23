import { NextRequest, NextResponse } from 'next/server';
import { readSettings, writeSettings } from '@/lib/database';

// GET /api/settings - Get current settings
export async function GET(request: NextRequest) {
  try {
    const settings = await readSettings();
    const userSettings = settings.find(s => s.user_id === 'user_1') || settings[0];

    if (!userSettings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    return NextResponse.json({ settings: userSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings - Update points settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      correct_word_points, 
      perfect_list_points, 
      streak_points, 
      time_points, 
      time_threshold 
    } = body;

    const settings = await readSettings();
    const userSettingsIndex = settings.findIndex(s => s.user_id === 'user_1');
    
    if (userSettingsIndex === -1) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    // Update settings while preserving password
    settings[userSettingsIndex] = {
      ...settings[userSettingsIndex],
      correct_word_points: Number(correct_word_points) || 10,
      perfect_list_points: Number(perfect_list_points) || 50,
      streak_points: Number(streak_points) || 20,
      time_points: Number(time_points) || 30,
      time_threshold: Number(time_threshold) || 15
    };

    await writeSettings(settings);

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: settings[userSettingsIndex]
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 