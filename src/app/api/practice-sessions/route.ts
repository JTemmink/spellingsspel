import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Interface for practice session objects
interface PracticeSession {
  id: string;
  user_id: string;
  word_list_id?: string;
  start_time: string;
  end_time?: string | null;
  total_words: number;
  correct_words: number;
  points_earned: number;
}

// Fallback session storage (in-memory for demo purposes)
// eslint-disable-next-line prefer-const
let fallbackSessions: PracticeSession[] = [];
let sessionIdCounter = 1;

// POST /api/practice-sessions - Start a new practice session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, listId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    const sessionId = `session_${sessionIdCounter++}`;
    const startTime = new Date().toISOString();

    // If Supabase is not configured, use fallback storage
    if (!isSupabaseConfigured) {
      console.log('Using fallback session storage for user:', userId);
      const newSession = {
        id: sessionId,
        user_id: userId,
        word_list_id: listId,
        start_time: startTime,
        end_time: null,
        total_words: 0,
        correct_words: 0,
        points_earned: 0
      };
      fallbackSessions.push(newSession);
      return NextResponse.json({ 
        sessionId,
        startTime
      });
    }

    try {
      const { data: newSession, error } = await supabase
        .from('practice_sessions')
        .insert([{
          user_id: userId,
          word_list_id: listId,
          start_time: startTime,
          total_words: 0,
          correct_words: 0,
          points_earned: 0
        }])
        .select()
        .single();

      if (error) {
        // Fallback to in-memory storage
        const fallbackSession: PracticeSession = {
          id: sessionId,
          user_id: userId,
          word_list_id: listId,
          start_time: startTime,
          end_time: null,
          total_words: 0,
          correct_words: 0,
          points_earned: 0
        };
        fallbackSessions.push(fallbackSession);
        return NextResponse.json({ 
          sessionId,
          startTime
        });
      }

      return NextResponse.json({ 
        sessionId: newSession.id,
        startTime: newSession.start_time
      });
    } catch (dbError) {
      console.log('Database error, using fallback session:', dbError);
      const fallbackSession: PracticeSession = {
        id: sessionId,
        user_id: userId,
        word_list_id: listId,
        start_time: startTime,
        end_time: null,
        total_words: 0,
        correct_words: 0,
        points_earned: 0
      };
      fallbackSessions.push(fallbackSession);
      return NextResponse.json({ 
        sessionId,
        startTime
      });
    }
  } catch (error) {
    console.error('Error creating practice session:', error);
    return NextResponse.json({ error: 'Failed to create practice session' }, { status: 500 });
  }
}

// PUT /api/practice-sessions - End a practice session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, totalWords, correctWords, pointsEarned } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'SessionId is required' }, { status: 400 });
    }

    const endTime = new Date().toISOString();

    // If Supabase is not configured, use fallback storage
    if (!isSupabaseConfigured) {
      console.log('Updating fallback session:', sessionId);
      const sessionIndex = fallbackSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        fallbackSessions[sessionIndex] = {
          ...fallbackSessions[sessionIndex],
          end_time: endTime,
          total_words: totalWords || 0,
          correct_words: correctWords || 0,
          points_earned: pointsEarned || 0
        };
      }
      return NextResponse.json({ 
        sessionId,
        endTime
      });
    }

    try {
      const { error } = await supabase
        .from('practice_sessions')
        .update({
          end_time: endTime,
          total_words: totalWords || 0,
          correct_words: correctWords || 0,
          points_earned: pointsEarned || 0
        })
        .eq('id', sessionId);

      if (error) {
        console.log('Database update error, using fallback');
      }

      return NextResponse.json({ 
        sessionId,
        endTime
      });
    } catch (dbError) {
      console.log('Database error during session update:', dbError);
      return NextResponse.json({ 
        sessionId,
        endTime
      });
    }
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

    // If Supabase is not configured, use fallback storage
    if (!isSupabaseConfigured) {
      console.log('Using fallback sessions for user:', userId);
      const userSessions = fallbackSessions.filter(session => session.user_id === userId);
      return NextResponse.json({ sessions: userSessions });
    }

    try {
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) {
        const userSessions = fallbackSessions.filter(session => session.user_id === userId);
        return NextResponse.json({ sessions: userSessions });
      }

      return NextResponse.json({ sessions: sessions || [] });
    } catch (dbError) {
      console.log('Database error, using fallback sessions:', dbError);
      const userSessions = fallbackSessions.filter(session => session.user_id === userId);
      return NextResponse.json({ sessions: userSessions });
    }
  } catch (error) {
    console.error('Error fetching practice sessions:', error);
    return NextResponse.json({ sessions: [] });
  }
} 