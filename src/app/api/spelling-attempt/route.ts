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

    // Case-sensitive spelling check
    const isCorrect = userInput.trim() === word.trim();
    let points = isCorrect ? (settings.correct_word_points || 10) : 0;
    let alreadyWrong = false;

    if (isVercel) {
      // In Vercel mode geen bestandschecks, alleen feedback
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

      // Check of dit woord in deze sessie al fout is gegaan
      const attempts = await readSpellingAttempts();
      alreadyWrong = attempts.some(a => a.session_id === sessionId && a.word_id === wordId && a.correct === false);

      // Punten alleen als het de eerste poging is (nog geen fout gemaakt)
      if (alreadyWrong) {
        points = 0;
      }

      // Sla de poging op
      const spellingAttempt = {
        id: generateId('attempt'),
        session_id: sessionId,
        word_id: wordId,
        input: userInput.trim(),
        correct: isCorrect
      };

      console.log('Created spelling attempt:', spellingAttempt);

      // Save spelling attempt
      attempts.push(spellingAttempt);
      await writeSpellingAttempts(attempts);
      
      console.log('Saved spelling attempt, new count:', attempts.length);

      // Punten alleen als correct en niet eerder fout
      if (isCorrect && points > 0) {
        const pointsData = await readPoints();
        const newPointsEntry = {
          id: generateId('points'),
          user_id: userId,
          total_points: 0, // Wordt door frontend/statistiek berekend
          activity_type: 'correct_word',
          amount: points,
          timestamp: new Date().toISOString()
        };
        
        console.log('Adding points entry:', newPointsEntry);
        pointsData.push(newPointsEntry);
        await writePoints(pointsData);
        console.log('Points saved, new count:', pointsData.length);
      }

      // Update moeilijke woorden lijst: altijd aanroepen, ook bij correct (voor streaks)
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