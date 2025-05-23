import { NextRequest, NextResponse } from 'next/server';
import { 
  readSpellingAttempts,
  writeSpellingAttempts,
  readPoints,
  writePoints,
  generateId,
  SpellingAttempt,
  Points
} from '@/lib/database';
import { 
  checkSpelling, 
  calculatePoints, 
  updateSpecialPracticeList 
} from '@/lib/game-logic';

// POST /api/spelling-attempt - Process a spelling attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, wordId, word, userInput, settings, sessionId } = body;

    if (!userId || !wordId || !word || !userInput || !settings || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if spelling is correct
    const isCorrect = checkSpelling(userInput, word);
    
    // Calculate points
    const points = calculatePoints(isCorrect, settings);

    // Create spelling attempt record
    const spellingAttempt: SpellingAttempt = {
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
      const newPointsEntry: Points = {
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