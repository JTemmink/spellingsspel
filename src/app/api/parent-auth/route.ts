import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// POST /api/parent-auth - Verify parent password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // If Supabase is not configured, use fallback password (for development/demo)
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, using fallback authentication');
      const isValidPassword = password === '1001';
      return NextResponse.json({ 
        success: isValidPassword,
        message: isValidPassword ? 'Login successful (fallback mode)' : 'Invalid password'
      });
    }

    // Try to get settings from Supabase with error handling
    try {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', 'user_1')
        .single();

      if (error || !settings) {
        // Fall back to hardcoded password if database is unavailable
        console.log('Database settings not available, using fallback');
        const isValidPassword = password === '1001';
        return NextResponse.json({ 
          success: isValidPassword,
          message: isValidPassword ? 'Login successful (fallback mode)' : 'Invalid password'
        });
      }

      // Use database settings if available
      const isValidPassword = password === '1001'; // Still hardcoded for now
      return NextResponse.json({ 
        success: isValidPassword,
        message: isValidPassword ? 'Login successful' : 'Invalid password'
      });

    } catch (dbError) {
      // Database error - fall back to hardcoded password
      console.log('Database error, using fallback authentication:', dbError);
      const isValidPassword = password === '1001';
      return NextResponse.json({ 
        success: isValidPassword,
        message: isValidPassword ? 'Login successful (fallback mode)' : 'Invalid password'
      });
    }

  } catch (error) {
    console.error('Error in parent auth:', error);
    // Even in case of complete failure, provide fallback authentication
    try {
      const body = await request.json();
      const isValidPassword = body.password === '1001';
      return NextResponse.json({ 
        success: isValidPassword,
        message: isValidPassword ? 'Login successful (emergency fallback)' : 'Invalid password'
      });
    } catch {
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
    }
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

    return NextResponse.json({ 
      success: true,
      message: 'Password change feature coming soon'
    });

  } catch (error) {
    console.error('Error changing parent password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
} 