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
      .from('user_voice_recordings')
      .select('audio_data')
      .eq('user_id', userId)
      .eq('name', name)
      .eq('voice_id', voiceId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user recording:', error);
      return NextResponse.json(
        { error: 'User recording not found' },
        { status: 404 }
      );
    }

    // Convert BYTEA to ArrayBuffer
    const audioData = data.audio_data;
    
    if (!audioData) {
      console.error('Audio data is null or undefined');
      return NextResponse.json(
        { error: 'Audio data is empty' },
        { status: 500 }
      );
    }
    
    console.log('Audio data type:', typeof audioData, 'is ArrayBuffer:', audioData instanceof ArrayBuffer, 'is Uint8Array:', audioData instanceof Uint8Array);
    
    let arrayBuffer: ArrayBuffer;

    if (audioData instanceof ArrayBuffer) {
      arrayBuffer = audioData;
    } else if (audioData instanceof Uint8Array) {
      arrayBuffer = audioData.buffer;
    } else if (typeof audioData === 'string') {
      // Supabase typically returns BYTEA as base64, but can also return hex
      let bytes: Uint8Array;
      
      // Try base64 first (most common format from Supabase)
      try {
        // Use Buffer.from() for base64 decoding in Node.js
        const buffer = Buffer.from(audioData, 'base64');
        bytes = new Uint8Array(buffer);
      } catch (e) {
        // If base64 decoding fails, try hex format
        try {
          // Check if it's hex format (starts with \x or is pure hex)
          let hexString = audioData;
          
          // Remove \x prefix if present
          if (hexString.startsWith('\\x')) {
            hexString = hexString.substring(2);
          }
          
          // Remove any remaining \x sequences
          hexString = hexString.replace(/\\x/g, '');
          
          // Validate it's hex
          if (/^[0-9a-fA-F]+$/.test(hexString) && hexString.length % 2 === 0) {
            bytes = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
              bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
            }
          } else {
            throw new Error('Invalid hex format');
          }
        } catch (hexError) {
          console.error('Failed to decode audio data as base64 or hex:', {
            base64Error: e instanceof Error ? e.message : String(e),
            hexError: hexError instanceof Error ? hexError.message : String(hexError),
            dataLength: audioData.length,
            dataPreview: audioData.substring(0, 50),
          });
          throw new Error('Invalid audio data format: not base64 or hex');
        }
      }
      arrayBuffer = bytes.buffer;
    } else {
      console.error('Audio data is not in a supported format:', typeof audioData);
      return NextResponse.json(
        { error: 'Invalid audio data format' },
        { status: 500 }
      );
    }

    // Validate arrayBuffer has data
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error('ArrayBuffer is empty or invalid');
      return NextResponse.json(
        { error: 'Audio data is empty' },
        { status: 500 }
      );
    }

    console.log('Returning audio data, size:', arrayBuffer.byteLength, 'bytes');

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/webm; codecs=opus',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error fetching user recording:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user recording' },
      { status: 500 }
    );
  }
}

