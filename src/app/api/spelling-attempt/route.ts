import { NextRequest, NextResponse } from 'next/server';
import { isVercel } from '@/lib/supabaseClient';

// POST /api/spelling-attempt - Process a spelling attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, wordId, word, userInput, settings, sessionId } = body;

    if (!userId || !wordId || !word || !userInput || !settings || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simple spelling check
    const isCorrect = userInput.toLowerCase().trim() === word.toLowerCase().trim();
    
    // Calculate points
    const points = isCorrect ? (settings.correct_word_points || 10) : 0;

    // If running on Vercel, we can't write to files, so just return the result
    if (isVercel) {
      console.log('Spelling attempt (Vercel mode):', {
        userId,
        wordId,
        word,
        userInput,
        isCorrect,
        points,
        sessionId
      });

      return NextResponse.json({
        correct: isCorrect,
        points: points,
        explanation: isCorrect ? null : `Het correcte woord is "${word}"`
      });
    }

    // Local development with file system access
    try {
      const { 
        readSpellingAttempts,
        writeSpellingAttempts,
        readPoints,
        writePoints,
        generateId
      } = await import('@/lib/database');
      
      const { 
        updateSpecialPracticeList 
      } = await import('@/lib/game-logic');

      // Create spelling attempt record
      const spellingAttempt = {
        id: generateId('attempt'),
        session_id: sessionId,
        word_id: wordId,
        input: userInput.trim(),
        correct: isCorrect
      };

      // Save spelling attempt
      const attempts = await readSpellingAttempts();
      attempts.push(spellingAttempt);
      await writeSpellingAttempts(attempts);

      // Update points if correct
      if (isCorrect && points > 0) {
        const pointsData = await readPoints();
        const newPointsEntry = {
          id: generateId('points'),
          user_id: userId,
          total_points: 0, // Will be calculated by frontend
          activity_type: 'correct_word',
          amount: points,
          timestamp: new Date().toISOString()
        };
        pointsData.push(newPointsEntry);
        await writePoints(pointsData);
      }

      // Update special practice list
      await updateSpecialPracticeList(userId, wordId, isCorrect);

    } catch (fileError) {
      console.error('File system operation failed:', fileError);
      // Continue anyway and return the result
    }

    return NextResponse.json({
      correct: isCorrect,
      points: points,
      explanation: isCorrect ? null : `Het correcte woord is "${word}"`
    });

  } catch (error) {
    console.error('Error processing spelling attempt:', error);
    return NextResponse.json({ error: 'Failed to process spelling attempt' }, { status: 500 });
  }
} 