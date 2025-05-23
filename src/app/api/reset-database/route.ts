import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST() {
  try {
    // Drop existing tables (in correct order due to foreign keys)
    const dropQueries = [
      'DROP TABLE IF EXISTS spelling_attempts CASCADE',
      'DROP TABLE IF EXISTS special_practice_list CASCADE', 
      'DROP TABLE IF EXISTS practice_sessions CASCADE',
      'DROP TABLE IF EXISTS words CASCADE',
      'DROP TABLE IF EXISTS word_lists CASCADE',
      'DROP TABLE IF EXISTS points CASCADE',
      'DROP TABLE IF EXISTS settings CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];

    for (const query of dropQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) console.log(`Drop error (expected): ${error.message}`);
    }

    // Create tables with correct structure matching JSON data
    const createQueries = [
      // Users table
      `CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Word lists table
      `CREATE TABLE word_lists (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        difficulty TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Words table
      `CREATE TABLE words (
        id TEXT PRIMARY KEY,
        list_id TEXT REFERENCES word_lists(id),
        word TEXT NOT NULL,
        explanation TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Practice sessions table
      `CREATE TABLE practice_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        word_list_id TEXT REFERENCES word_lists(id),
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        total_words INTEGER DEFAULT 0,
        correct_words INTEGER DEFAULT 0,
        points_earned INTEGER DEFAULT 0
      )`,
      
      // Spelling attempts table
      `CREATE TABLE spelling_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        word_id TEXT REFERENCES words(id),
        practice_session_id TEXT REFERENCES practice_sessions(id),
        user_input TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        points_earned INTEGER DEFAULT 0,
        attempt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Points table
      `CREATE TABLE points (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        total_points INTEGER DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Settings table
      `CREATE TABLE settings (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        points_correct INTEGER DEFAULT 10,
        points_incorrect INTEGER DEFAULT -2,
        points_streak_bonus INTEGER DEFAULT 5,
        parent_password TEXT DEFAULT '1001',
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Special practice list table
      `CREATE TABLE special_practice_list (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        word_id TEXT REFERENCES words(id),
        incorrect_count INTEGER DEFAULT 1,
        last_incorrect TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        consecutive_correct INTEGER DEFAULT 0,
        last_correct TIMESTAMP WITH TIME ZONE,
        added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];

    const results = [];
    for (const query of createQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) throw error;
        results.push(`✅ Table created successfully`);
      } catch (error: any) {
        results.push(`❌ Error: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database reset completed',
      results
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 