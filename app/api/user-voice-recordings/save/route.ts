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

    // Convert to base64 for transmission
    const base64String = Buffer.from(uint8Array).toString('base64');

    // Try to use RPC function first, fallback to delete+insert if RPC doesn't exist
    let error = null;
    let lastError: any = null;
    
    try {
      const { error: rpcError } = await supabase.rpc('upsert_user_voice_recording', {
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
      lastError = rpcErr;
      
      // Delete existing record first
      const { error: deleteError } = await supabase
        .from('user_voice_recordings')
        .delete()
        .eq('user_id', userId)
        .eq('name', name)
        .eq('voice_id', voiceId);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
      }

      // For direct insert, we need to use the binary data directly
      // PostgreSQL BYTEA can accept binary data, but Supabase might need it as a hex string
      // Convert uint8Array to a format Supabase can handle
      // Option 1: Use base64 and let PostgreSQL decode it
      // Option 2: Convert to hex format
      
      // Using hex format which PostgreSQL BYTEA accepts
      const hexString = '\\x' + Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Insert new record - use the hex format for BYTEA
      const { error: insertError } = await supabase
        .from('user_voice_recordings')
        .insert({
          user_id: userId,
          name: name,
          voice_id: voiceId,
          audio_data: hexString,
          updated_at: new Date().toISOString(),
        });
      
      error = insertError;
      if (insertError) {
        lastError = insertError;
      }
    }

    if (error) {
      console.error('Error saving user recording:', error);
      console.error('Last error details:', lastError);
      return NextResponse.json(
        { 
          error: 'Failed to save user recording',
          details: lastError?.message || error.message || 'Unknown error',
          code: lastError?.code || error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in save user recording route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to save user recording',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

