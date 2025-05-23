import { NextRequest, NextResponse } from 'next/server';
import { 
  readSpellingAttempts, 
  readPracticeSessions,
  readWordLists,
  readWords,
  readPoints
} from '@/lib/database';

// GET /api/statistics - Get statistics for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'user_1';

    // Get all data including points
    const [attempts, sessions, wordLists, words, pointsData] = await Promise.all([
      readSpellingAttempts(),
      readPracticeSessions(),
      readWordLists(),
      readWords(),
      readPoints()
    ]);

    // Filter user data
    const userAttempts = attempts.filter(attempt => {
      // Find the session for this attempt
      const session = sessions.find(s => s.id === attempt.session_id);
      return session?.user_id === userId;
    });

    const userSessions = sessions.filter(session => session.user_id === userId);
    const userWordLists = wordLists.filter(list => list.user_id === userId);
    const userPoints = pointsData.find(p => p.user_id === userId);

    // Calculate statistics
    const totalAttempts = userAttempts.length;
    const correctAttempts = userAttempts.filter(attempt => attempt.correct).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    
    // Get unique words practiced
    const uniqueWords = new Set(userAttempts.map(attempt => attempt.word_id)).size;

    // Calculate session statistics with better date handling
    const sessionStats = userSessions.map(session => {
      const sessionAttempts = userAttempts.filter(attempt => attempt.session_id === session.id);
      const correct = sessionAttempts.filter(attempt => attempt.correct).length;
      const total = sessionAttempts.length;
      
      return {
        id: session.id,
        date: new Date(session.start_time).toLocaleDateString('nl-NL'),
        timestamp: new Date(session.start_time).getTime(),
        correct,
        total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        duration: session.end_time ? 
          Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000) : 0
      };
    });

    // Get recent sessions (last 10, sorted by most recent)
    const recentSessions = sessionStats
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    // Find most difficult words (most incorrect attempts)
    const wordMistakes = {};
    const wordStats = {};
    
    userAttempts.forEach(attempt => {
      const word = words.find(w => w.id === attempt.word_id);
      if (word) {
        if (!wordStats[word.word]) {
          wordStats[word.word] = { correct: 0, total: 0 };
        }
        wordStats[word.word].total++;
        
        if (attempt.correct) {
          wordStats[word.word].correct++;
        } else {
          wordMistakes[word.word] = (wordMistakes[word.word] || 0) + 1;
        }
      }
    });

    // Most difficult words (lowest accuracy with at least 2 attempts)
    const difficultWords = Object.entries(wordStats)
      .filter(([, stats]) => stats.total >= 2)
      .map(([word, stats]) => ({
        word,
        attempts: stats.total,
        correct: stats.correct,
        accuracy: Math.round((stats.correct / stats.total) * 100)
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Calculate total time spent practicing
    const totalPracticeTime = sessionStats.reduce((sum, session) => sum + session.duration, 0);
    
    // Calculate streak (consecutive days with sessions)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    const practicesByDate = {};
    userSessions.forEach(session => {
      const date = new Date(session.start_time);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.getTime();
      practicesByDate[dateKey] = true;
    });

    // Count consecutive days backwards from today
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = checkDate.getTime();
      
      if (practicesByDate[dateKey]) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today might not have practice yet)
        break;
      }
    }

    const statistics = {
      totalPoints: userPoints?.total_points || 0,
      totalSessions: userSessions.length,
      totalWords: uniqueWords,
      totalAttempts,
      accuracy,
      correctAttempts,
      incorrectAttempts: totalAttempts - correctAttempts,
      recentSessions,
      difficultWords,
      wordListsCount: userWordLists.length,
      totalPracticeTime, // in seconds
      currentStreak: streak,
      averageSessionTime: userSessions.length > 0 ? Math.round(totalPracticeTime / userSessions.length) : 0,
      lastPracticeDate: userSessions.length > 0 ? 
        new Date(Math.max(...userSessions.map(s => new Date(s.start_time).getTime()))).toLocaleDateString('nl-NL') : 
        null
    };

    return NextResponse.json({ statistics });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
} 