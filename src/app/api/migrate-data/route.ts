import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), 'data');

    // Read all JSON files
    const usersData = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
    const wordListsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'word_lists.json'), 'utf8'));
    const wordsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'words.json'), 'utf8'));
    const spellingAttemptsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'spelling_attempts.json'), 'utf8'));
    const practiceSessionsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'practice_sessions.json'), 'utf8'));
    const pointsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'points.json'), 'utf8'));
    const settingsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'settings.json'), 'utf8'));
    const specialPracticeData = JSON.parse(fs.readFileSync(path.join(dataDir, 'special_practice_list.json'), 'utf8'));

    const results = {
      users: 0,
      word_lists: 0,
      words: 0,
      spelling_attempts: 0,
      practice_sessions: 0,
      points: 0,
      settings: 0,
      special_practice_list: 0,
      errors: []
    };

    // 1. Migrate users
    try {
      const { error: usersError } = await supabase
        .from('users')
        .insert(usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          created_at: new Date(user.created_at)
        })));
      
      if (usersError) throw usersError;
      results.users = usersData.length;
    } catch (error: any) {
      results.errors.push(`Users: ${error.message}`);
    }

    // 2. Migrate word_lists
    try {
      const { error: wordListsError } = await supabase
        .from('word_lists')
        .insert(wordListsData.map((list: any) => ({
          id: list.id,
          user_id: list.user_id,
          name: list.name,
          description: list.description,
          difficulty: list.difficulty,
          created_at: new Date()
        })));
      
      if (wordListsError) throw wordListsError;
      results.word_lists = wordListsData.length;
    } catch (error: any) {
      results.errors.push(`Word Lists: ${error.message}`);
    }

    // 3. Migrate words
    try {
      const { error: wordsError } = await supabase
        .from('words')
        .insert(wordsData.map((word: any) => ({
          id: word.id,
          list_id: word.list_id,
          word: word.word,
          explanation: word.explanation,
          created_at: new Date()
        })));
      
      if (wordsError) throw wordsError;
      results.words = wordsData.length;
    } catch (error: any) {
      results.errors.push(`Words: ${error.message}`);
    }

    // 4. Migrate practice_sessions
    try {
      const { error: sessionsError } = await supabase
        .from('practice_sessions')
        .insert(practiceSessionsData.map((session: any) => ({
          id: session.id,
          user_id: session.user_id,
          word_list_id: session.word_list_id,
          start_time: new Date(session.start_time),
          end_time: session.end_time ? new Date(session.end_time) : null,
          total_words: session.total_words,
          correct_words: session.correct_words,
          points_earned: session.points_earned
        })));
      
      if (sessionsError) throw sessionsError;
      results.practice_sessions = practiceSessionsData.length;
    } catch (error: any) {
      results.errors.push(`Practice Sessions: ${error.message}`);
    }

    // 5. Migrate spelling_attempts
    try {
      const { error: attemptsError } = await supabase
        .from('spelling_attempts')
        .insert(spellingAttemptsData.map((attempt: any) => ({
          id: attempt.id,
          user_id: attempt.user_id,
          word_id: attempt.word_id,
          practice_session_id: attempt.practice_session_id,
          user_input: attempt.user_input,
          is_correct: attempt.is_correct,
          points_earned: attempt.points_earned,
          attempt_date: new Date(attempt.attempt_date)
        })));
      
      if (attemptsError) throw attemptsError;
      results.spelling_attempts = spellingAttemptsData.length;
    } catch (error: any) {
      results.errors.push(`Spelling Attempts: ${error.message}`);
    }

    // 6. Migrate points
    try {
      const { error: pointsError } = await supabase
        .from('points')
        .insert(pointsData.map((point: any) => ({
          id: point.id,
          user_id: point.user_id,
          total_points: point.total_points,
          last_updated: new Date(point.last_updated)
        })));
      
      if (pointsError) throw pointsError;
      results.points = pointsData.length;
    } catch (error: any) {
      results.errors.push(`Points: ${error.message}`);
    }

    // 7. Migrate settings
    try {
      const { error: settingsError } = await supabase
        .from('settings')
        .insert(settingsData.map((setting: any) => ({
          id: setting.id,
          user_id: setting.user_id,
          points_correct: setting.points_correct,
          points_incorrect: setting.points_incorrect,
          points_streak_bonus: setting.points_streak_bonus,
          parent_password: setting.parent_password,
          last_updated: new Date(setting.last_updated)
        })));
      
      if (settingsError) throw settingsError;
      results.settings = settingsData.length;
    } catch (error: any) {
      results.errors.push(`Settings: ${error.message}`);
    }

    // 8. Migrate special_practice_list
    try {
      const { error: specialError } = await supabase
        .from('special_practice_list')
        .insert(specialPracticeData.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          word_id: item.word_id,
          incorrect_count: item.incorrect_count,
          last_incorrect: new Date(item.last_incorrect),
          consecutive_correct: item.consecutive_correct,
          last_correct: item.last_correct ? new Date(item.last_correct) : null,
          added_date: new Date(item.added_date)
        })));
      
      if (specialError) throw specialError;
      results.special_practice_list = specialPracticeData.length;
    } catch (error: any) {
      results.errors.push(`Special Practice List: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Data migration completed',
      results
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 