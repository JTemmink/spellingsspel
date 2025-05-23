import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// POST /api/parent-auth - Verify parent password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Get settings from Supabase (voor nu gebruiken we user_1)
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', 'user_1')
      .single();

    if (error || !settings) {
      // Als er geen settings zijn, maak default settings aan met wachtwoord "1001"
      const { error: createError } = await supabase
        .from('settings')
        .insert([{
          user_id: 'user_1',
          correct_word_points: 10,
          streak_points: 5,
          time_threshold: 15
        }]);

      if (createError) {
        console.error('Error creating default settings:', createError);
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
      }

      // Voor nu gebruiken we een hardcoded wachtwoord "1001"
      const isValidPassword = password === '1001';
      return NextResponse.json({ 
        success: isValidPassword,
        message: isValidPassword ? 'Login successful' : 'Invalid password'
      });
    }

    // Voor nu gebruiken we een hardcoded wachtwoord "1001"
    // Later kunnen we dit in de database opslaan
    const isValidPassword = password === '1001';

    return NextResponse.json({ 
      success: isValidPassword,
      message: isValidPassword ? 'Login successful' : 'Invalid password'
    });

  } catch (error) {
    console.error('Error verifying parent password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/parent-auth - Change parent password (voor later)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    // Voor nu simpele validatie
    if (currentPassword !== '1001') {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // TODO: Later implementeren we password storage in Supabase
    return NextResponse.json({ 
      success: true,
      message: 'Password change feature coming soon'
    });

  } catch (error) {
    console.error('Error changing parent password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 