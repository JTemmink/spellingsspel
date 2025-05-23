import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Test basic Supabase connection
    const { data, error } = await supabase
      .from('word_lists')
      .select('count(*)')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection works!',
      data 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Connection failed',
      details: error 
    });
  }
} 