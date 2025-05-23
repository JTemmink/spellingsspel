import { NextRequest, NextResponse } from 'next/server';
import { isVercel } from '@/lib/supabaseClient';

// GET /api/statistics - Get user statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_1';

    // If running on Vercel, return mock statistics
    if (isVercel) {
      const mockStats = {
        totalPoints: 150,
        totalSessions: 5,
        totalWords: 42,
        accuracy: 78,
        currentStreak: 3,
        totalPracticeTime: 1800, // 30 minutes
        averageSessionTime: 360, // 6 minutes
        lastPracticeDate: new Date().toISOString().split('T')[0],
        recentSessions: [
          {
            date: new Date().toISOString().split('T')[0],
            correct: 8,
            total: 10,
            accuracy: 80,
            duration: 300
          },
          {
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            correct: 7,
            total: 10,
            accuracy: 70,
            duration: 420
          }
        ],
        difficultWords: [
          {
            word: 'discussie',
            attempts: 5,
            correct: 2,
            accuracy: 40
          },
          {
            word: 'complex',
            attempts: 3,
            correct: 1,
            accuracy: 33
          }
        ]
      };

      return NextResponse.json({ statistics: mockStats });
    }

    // Local development with file system access
    try {
      const {
        readSpellingAttempts,
        readPracticeSessions,
        readPoints
      } = await import('@/lib/database');

      // Get data from JSON files
      const [attempts, sessions, points] = await Promise.all([
        readSpellingAttempts(),
        readPracticeSessions(),
        readPoints()
      ]);

      // Filter data for specific user
      const userAttempts = attempts;
      const userSessions = sessions.filter(s => s.user_id === userId);
      const userPoints = points.filter(p => p.user_id === userId);

      // Calculate statistics
      const totalPoints = userPoints.reduce((sum, p) => sum + p.amount, 0);
      const totalSessions = userSessions.length;
      const totalWords = userAttempts.length;
      const correctWords = userAttempts.filter(a => a.correct).length;
      const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

      // Calculate practice time
      const totalPracticeTime = userSessions.reduce((sum, s) => sum + s.duration, 0);
      const averageSessionTime = totalSessions > 0 ? Math.round(totalPracticeTime / totalSessions) : 0;

      // Get last practice date
      const lastSession = userSessions.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      )[0];
      const lastPracticeDate = lastSession ? lastSession.start_time.split('T')[0] : null;

      // Calculate current streak (simplified)
      const currentStreak = 2; // Mock value for now

      // Recent sessions (last 5)
      const recentSessions = userSessions
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        .slice(0, 5)
        .map(session => {
          const sessionAttempts = userAttempts.filter(a => a.session_id === session.id);
          const sessionCorrect = sessionAttempts.filter(a => a.correct).length;
          const sessionTotal = sessionAttempts.length;
          const sessionAccuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

          return {
            date: session.start_time.split('T')[0],
            correct: sessionCorrect,
            total: sessionTotal,
            accuracy: sessionAccuracy,
            duration: session.duration
          };
        });

      // Find difficult words (words with low accuracy)
      const wordStats = new Map();
      userAttempts.forEach(attempt => {
        const wordId = attempt.word_id;
        if (!wordStats.has(wordId)) {
          wordStats.set(wordId, { attempts: 0, correct: 0, word: 'unknown' });
        }
        const stats = wordStats.get(wordId);
        stats.attempts++;
        if (attempt.correct) stats.correct++;
      });

      const difficultWords = Array.from(wordStats.entries())
        .map(([wordId, stats]) => ({
          word: stats.word,
          attempts: stats.attempts,
          correct: stats.correct,
          accuracy: Math.round((stats.correct / stats.attempts) * 100)
        }))
        .filter(word => word.attempts >= 2 && word.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 10);

      const statistics = {
        totalPoints,
        totalSessions,
        totalWords,
        accuracy,
        currentStreak,
        totalPracticeTime,
        averageSessionTime,
        lastPracticeDate,
        recentSessions,
        difficultWords
      };

      return NextResponse.json({ statistics });

    } catch (fileError) {
      console.error('File system operation failed:', fileError);
      
      // Return empty statistics on error
      return NextResponse.json({
        statistics: {
          totalPoints: 0,
          totalSessions: 0,
          totalWords: 0,
          accuracy: 0,
          currentStreak: 0,
          totalPracticeTime: 0,
          averageSessionTime: 0,
          lastPracticeDate: null,
          recentSessions: [],
          difficultWords: []
        }
      });
    }

  } catch (error) {
    console.error('Error processing statistics request:', error);
    return NextResponse.json({ error: 'Failed to get statistics' }, { status: 500 });
  }
} 