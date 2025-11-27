import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const voiceId = searchParams.get('voice_id');
    const userId = searchParams.get('user_id');

    if (!name || !voiceId || !userId) {
      return NextResponse.json(
        { error: 'name, voice_id, and user_id are required' },
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

    const { data, error } = await supabase
      .from('voice_audio_files')
      .select('audio_data')
      .eq('user_id', userId)
      .eq('name', name)
      .eq('voice_id', voiceId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }

    // Convert BYTEA to ArrayBuffer
    const audioData = data.audio_data;
    let arrayBuffer: ArrayBuffer;

    if (audioData instanceof ArrayBuffer) {
      arrayBuffer = audioData;
    } else if (audioData instanceof Uint8Array) {
      arrayBuffer = audioData.buffer;
    } else if (typeof audioData === 'string') {
      // Base64 string
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      return NextResponse.json(
        { error: 'Invalid audio data format' },
        { status: 500 }
      );
    }

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error fetching audio file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audio file' },
      { status: 500 }
    );
  }
}

