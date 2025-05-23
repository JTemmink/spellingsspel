import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Fallback points storage (in-memory for demo purposes)
// eslint-disable-next-line prefer-const
let fallbackPoints: { [userId: string]: number } = {
  'user_1': 0
};

// GET /api/points - Get total points for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'user_1';

    // If Supabase is not configured, use fallback storage
    if (!isSupabaseConfigured) {
      console.log('Using fallback points for user:', userId);
      const totalPoints = fallbackPoints[userId] || 0;
      return NextResponse.json({ totalPoints });
    }

    try {
      const { data: pointsData, error } = await supabase
        .from('points')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (error || !pointsData) {
        // Return fallback if database error
        const totalPoints = fallbackPoints[userId] || 0;
        return NextResponse.json({ totalPoints });
      }

      return NextResponse.json({ totalPoints: pointsData.total_points });
    } catch (dbError) {
      console.log('Database error, using fallback points:', dbError);
      const totalPoints = fallbackPoints[userId] || 0;
      return NextResponse.json({ totalPoints });
    }
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json({ totalPoints: 0 });
  }
}

// PUT /api/points - Update total points for a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, totalPoints } = body;

    if (!userId || typeof totalPoints !== 'number') {
      return NextResponse.json({ error: 'UserId and totalPoints are required' }, { status: 400 });
    }

    // If Supabase is not configured, use fallback storage
    if (!isSupabaseConfigured) {
      console.log('Using fallback points storage for user:', userId);
      fallbackPoints[userId] = totalPoints;
      return NextResponse.json({ totalPoints });
    }

    try {
      const { error } = await supabase
        .from('points')
        .upsert({
          user_id: userId,
          total_points: totalPoints
        });

      if (error) {
        // Fallback to in-memory storage
        fallbackPoints[userId] = totalPoints;
      }

      return NextResponse.json({ totalPoints });
    } catch (dbError) {
      console.log('Database error, using fallback points:', dbError);
      fallbackPoints[userId] = totalPoints;
      return NextResponse.json({ totalPoints });
    }
  } catch (error) {
    console.error('Error updating points:', error);
    return NextResponse.json({ error: 'Failed to update points' }, { status: 500 });
  }
}

// POST /api/points - Add points to user's total
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pointsToAdd } = body;

    if (!userId || typeof pointsToAdd !== 'number') {
      return NextResponse.json({ error: 'UserId and pointsToAdd are required' }, { status: 400 });
    }

    // If Supabase is not configured, use fallback storage
    if (!isSupabaseConfigured) {
      console.log('Adding points to fallback storage for user:', userId);
      fallbackPoints[userId] = (fallbackPoints[userId] || 0) + pointsToAdd;
      return NextResponse.json({ totalPoints: fallbackPoints[userId] });
    }

    try {
      // Get current points first
      const { data: currentData } = await supabase
        .from('points')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      const currentPoints = currentData?.total_points || 0;
      const newTotal = currentPoints + pointsToAdd;

      const { error } = await supabase
        .from('points')
        .upsert({
          user_id: userId,
          total_points: newTotal
        });

      if (error) {
        // Fallback to in-memory storage
        fallbackPoints[userId] = (fallbackPoints[userId] || 0) + pointsToAdd;
        return NextResponse.json({ totalPoints: fallbackPoints[userId] });
      }

      return NextResponse.json({ totalPoints: newTotal });
    } catch (dbError) {
      console.log('Database error, using fallback points:', dbError);
      fallbackPoints[userId] = (fallbackPoints[userId] || 0) + pointsToAdd;
      return NextResponse.json({ totalPoints: fallbackPoints[userId] });
    }
  } catch (error) {
    console.error('Error adding points:', error);
    return NextResponse.json({ error: 'Failed to add points' }, { status: 500 });
  }
} 