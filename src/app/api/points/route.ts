import { NextRequest, NextResponse } from 'next/server';
import { readPoints, writePoints, generateId } from '@/lib/database';

// GET /api/points - Get total points for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'user_1';

    const pointsData = await readPoints();
    let userPoints = pointsData.find(p => p.user_id === userId);
    
    if (!userPoints) {
      // Create initial points record if it doesn't exist
      userPoints = {
        id: generateId('points'),
        user_id: userId,
        total_points: 0
      };
      pointsData.push(userPoints);
      await writePoints(pointsData);
    }

    return NextResponse.json({ totalPoints: userPoints.total_points });
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
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

    const pointsData = await readPoints();
    let userPointsIndex = pointsData.findIndex(p => p.user_id === userId);
    
    if (userPointsIndex === -1) {
      // Create new points record
      pointsData.push({
        id: generateId('points'),
        user_id: userId,
        total_points: totalPoints
      });
    } else {
      // Update existing record
      pointsData[userPointsIndex].total_points = totalPoints;
    }

    await writePoints(pointsData);

    return NextResponse.json({ totalPoints });
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

    const pointsData = await readPoints();
    let userPointsIndex = pointsData.findIndex(p => p.user_id === userId);
    
    if (userPointsIndex === -1) {
      // Create new points record
      pointsData.push({
        id: generateId('points'),
        user_id: userId,
        total_points: pointsToAdd
      });
    } else {
      // Add to existing points
      pointsData[userPointsIndex].total_points += pointsToAdd;
    }

    await writePoints(pointsData);

    return NextResponse.json({ totalPoints: pointsData[userPointsIndex]?.total_points || pointsToAdd });
  } catch (error) {
    console.error('Error adding points:', error);
    return NextResponse.json({ error: 'Failed to add points' }, { status: 500 });
  }
} 