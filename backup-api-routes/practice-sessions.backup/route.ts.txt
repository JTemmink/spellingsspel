import { NextRequest, NextResponse } from 'next/server';
import { 
  readPracticeSessions,
  writePracticeSessions,
  generateId,
  PracticeSession
} from '@/lib/database';

// POST /api/practice-sessions - Start a new practice session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, listId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    // Create new practice session
    const newSession: PracticeSession = {
      id: generateId('session'),
      user_id: userId,
      start_time: new Date().toISOString(),
      duration: 0
    };

    // Save session
    const sessions = await readPracticeSessions();
    sessions.push(newSession);
    await writePracticeSessions(sessions);

    return NextResponse.json({ 
      sessionId: newSession.id,
      startTime: newSession.start_time
    });

  } catch (error) {
    console.error('Error creating practice session:', error);
    return NextResponse.json({ error: 'Failed to create practice session' }, { status: 500 });
  }
}

// PUT /api/practice-sessions - End a practice session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'SessionId is required' }, { status: 400 });
    }

    // Find and update session
    const sessions = await readPracticeSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessions[sessionIndex];
    const endTime = new Date();
    const startTime = new Date(session.start_time);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Update session
    sessions[sessionIndex] = {
      ...session,
      end_time: endTime.toISOString(),
      duration: duration
    };

    await writePracticeSessions(sessions);

    return NextResponse.json({ 
      sessionId,
      duration,
      endTime: endTime.toISOString()
    });

  } catch (error) {
    console.error('Error ending practice session:', error);
    return NextResponse.json({ error: 'Failed to end practice session' }, { status: 500 });
  }
}

// GET /api/practice-sessions - Get practice sessions for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'user_1';

    const sessions = await readPracticeSessions();
    const userSessions = sessions.filter(session => session.user_id === userId);

    return NextResponse.json({ sessions: userSessions });

  } catch (error) {
    console.error('Error fetching practice sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch practice sessions' }, { status: 500 });
  }
} 