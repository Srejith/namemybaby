import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const voiceId = formData.get('voice_id') as string;
    const audioFile = formData.get('audio') as File;
    const userId = formData.get('user_id') as string;

    if (!name || !voiceId || !audioFile || !userId) {
      return NextResponse.json(
        { error: 'name, voice_id, audio, and user_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Supabase Postgres BYTEA expects binary data
    // We'll convert to base64 for transmission, then convert on server
    const base64String = Buffer.from(uint8Array).toString('base64');

    // Try to use RPC function first, fallback to delete+insert if RPC doesn't exist
    let error = null;
    
    try {
      const { error: rpcError } = await supabase.rpc('upsert_voice_audio', {
        p_user_id: userId,
        p_name: name,
        p_voice_id: voiceId,
        p_audio_data: base64String,
      });
      
      if (rpcError) {
        throw rpcError;
      }
    } catch (rpcErr: any) {
      // RPC doesn't exist or failed - use fallback method
      // Delete existing record first
      await supabase
        .from('voice_audio_files')
        .delete()
        .eq('user_id', userId)
        .eq('name', name)
        .eq('voice_id', voiceId);

      // Insert new record - PostgreSQL BYTEA can accept base64 strings
      const { error: insertError } = await supabase
        .from('voice_audio_files')
        .insert({
          user_id: userId,
          name: name,
          voice_id: voiceId,
          audio_data: base64String,
          updated_at: new Date().toISOString(),
        });
      
      error = insertError;
    }

    if (error) {
      console.error('Error saving audio file:', error);
      return NextResponse.json(
        { error: 'Failed to save audio file' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in save audio route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save audio file' },
      { status: 500 }
    );
  }
}

