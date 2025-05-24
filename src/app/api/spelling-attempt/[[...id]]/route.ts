import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 503 });
  }
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
  }
  const res = await supabase.from('spelling_attempts').delete().eq('id', id);
  if (res.error) {
    return NextResponse.json({ error: res.error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 