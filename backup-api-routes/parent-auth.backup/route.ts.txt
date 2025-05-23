import { NextRequest, NextResponse } from 'next/server';
import { readSettings, writeSettings } from '@/lib/database';

// POST /api/parent-auth - Verify parent password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, action } = body;

    const settings = await readSettings();
    const userSettings = settings.find(s => s.user_id === 'user_1') || settings[0];

    if (!userSettings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    if (action === 'verify') {
      // Verify password
      const isValid = password === userSettings.parent_password;
      return NextResponse.json({ valid: isValid });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in parent auth:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// PUT /api/parent-auth - Change parent password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const settings = await readSettings();
    const userSettingsIndex = settings.findIndex(s => s.user_id === 'user_1');
    
    if (userSettingsIndex === -1) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    const userSettings = settings[userSettingsIndex];

    // Verify current password
    if (currentPassword !== userSettings.parent_password) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Update password
    settings[userSettingsIndex] = {
      ...userSettings,
      parent_password: newPassword
    };

    await writeSettings(settings);

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
} 