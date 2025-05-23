import { NextRequest, NextResponse } from 'next/server';

// POST /api/parent-auth - Verify parent password
export async function POST(request: NextRequest) {
  try {
    console.log('Parent auth route called');
    
    const body = await request.json();
    console.log('Received body:', body);
    
    const { password } = body;
    console.log('Password:', password);

    if (!password) {
      console.log('No password provided');
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Simpele hardcoded check voor nu
    const isValidPassword = password === '1001';
    console.log('Password check result:', isValidPassword);
    
    return NextResponse.json({ 
      success: isValidPassword,
      message: isValidPassword ? 'Login successful' : 'Invalid password'
    });

  } catch (error) {
    console.error('Error in parent auth:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
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