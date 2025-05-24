import { NextRequest, NextResponse } from 'next/server';
import { isVercel } from '@/lib/supabaseClient';

// POST /api/spelling-attempt - Process a spelling attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, wordId, word, userInput, settings, sessionId } = body;

    console.log('Spelling attempt received:', { userId, wordId, word, userInput, sessionId, isVercel });

    if (!userId || !wordId || !word || !userInput || !settings || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simple spelling check
    const isCorrect = userInput.trim() === word.trim();
    
    // Calculate points
    const points = isCorrect ? (settings.correct_word_points || 10) : 0;

    console.log('Spelling result:', { isCorrect, points, isVercel });

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
    console.log('Processing locally - attempting to save to files...');
    
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

      console.log('Created spelling attempt:', spellingAttempt);

      // Save spelling attempt
      const attempts = await readSpellingAttempts();
      console.log('Current attempts count:', attempts.length);
      
      attempts.push(spellingAttempt);
      await writeSpellingAttempts(attempts);
      
      console.log('Saved spelling attempt, new count:', attempts.length);

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
        
        console.log('Adding points entry:', newPointsEntry);
        pointsData.push(newPointsEntry);
        await writePoints(pointsData);
        console.log('Points saved, new count:', pointsData.length);
      }

      // Update special practice list
      await updateSpecialPracticeList(userId, wordId, isCorrect);
      console.log('Special practice list updated');

    } catch (fileError) {
      console.error('File system operation failed:', fileError);
      // Continue anyway and return the result
    }

    console.log('Returning response...');
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