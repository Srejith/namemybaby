
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userId } = body;

    const langflowUrl = process.env.NEXT_PUBLIC_LANGFLOW_URL;
    
    if (!langflowUrl) {
      return NextResponse.json(
        { error: 'LangFlow server URL is not configured. Please set NEXT_PUBLIC_LANGFLOW_URL or LANGFLOW_URL environment variable.' },
        { status: 500 }
      );
    }

    // LangFlow API endpoint - adjust based on your LangFlow setup
    // Common patterns:
    // - /api/v1/chat for chat endpoints
    // - /api/v1/run/{flow_id} for flow runs
    const langflowEndpoint = process.env.LANGFLOW_ENDPOINT;
    const apiUrl = `${langflowUrl}${langflowEndpoint}`;

    // Prepare the request payload for LangFlow
    // Adjust this based on your LangFlow flow configuration
    const payload = {
      message: message,
      session_id: sessionId || `session-${Date.now()}`,
      // Add any other required parameters for your LangFlow setup
      input_type: "chat",
      output_type: "chat",
      input_value: message,
      user_id: userId || null
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization if needed
        ...(process.env.LANGFLOW_API_KEY && {
          'Authorization': `Bearer ${process.env.LANGFLOW_API_KEY}`,
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LangFlow API error:', errorText);
      return NextResponse.json(
        { error: `LangFlow server error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the response text based on LangFlow's response structure
    // Adjust this based on your LangFlow response format
    let responseText = '';
    
    if (data.outputs && data.outputs.length > 0) {
      // LangFlow typically returns outputs array
      const output = data.outputs[0];
      if (output.outputs && output.outputs.length > 0) {
        responseText = output.outputs[0].message || output.outputs[0].text || JSON.stringify(output.outputs[0]);
      } else if (output.message) {
        responseText = output.message;
      } else if (output.text) {
        responseText = output.text;
      }
    } else if (data.message) {
      responseText = data.message;
    } else if (data.text) {
      responseText = data.text;
    } else if (data.output) {
      responseText = data.output;
    } else {
      // Fallback: try to extract from any response structure
      responseText = JSON.stringify(data);
    }

    return NextResponse.json({
      message: responseText,
      sessionId: data.session_id || sessionId || `session-${Date.now()}`,
    });
  } catch (error) {
    console.error('Error calling LangFlow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect to LangFlow server' },
      { status: 500 }
    );
  }
}

