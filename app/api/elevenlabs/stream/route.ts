import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const body = await request.json();
    const { voice_id, text } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Eleven Labs API key is not configured. Please set ELEVENLABS_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    if (!voice_id || !text) {
      return NextResponse.json(
        { error: 'voice_id and text are required' },
        { status: 400 }
      );
    }

    // Use the text-to-speech API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eleven Labs API error:', errorText);
      return NextResponse.json(
        { error: `Eleven Labs API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Return the audio blob
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error calling Eleven Labs API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect to Eleven Labs API' },
      { status: 500 }
    );
  }
}

