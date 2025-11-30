
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userId } = body;

    // Check if we should use Python script instead of LangFlow
    const usePythonScript = process.env.USE_PYTHON_LANGFLOW === 'true';
    const pythonScriptUrl = process.env.PYTHON_LANGFLOW_URL || 'http://localhost:8000';
    
    const langflowUrl = process.env.NEXT_PUBLIC_LANGFLOW_URL;
    
    // Determine which service to use
    let apiUrl: string;
    if (usePythonScript) {
      apiUrl = `${pythonScriptUrl}/api/v1/run`;
    } else {
      if (!langflowUrl) {
        return NextResponse.json(
          { error: 'LangFlow server URL is not configured. Please set NEXT_PUBLIC_LANGFLOW_URL or LANGFLOW_URL environment variable.' },
          { status: 500 }
        );
      }
      const langflowEndpoint = process.env.LANGFLOW_ENDPOINT || '/api/v1/run';
      apiUrl = `${langflowUrl}${langflowEndpoint}`;
    }

    // Prepare the request payload (works for both LangFlow and Python script)
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
        // Add authorization if needed (only for LangFlow, not Python script)
        ...(!usePythonScript && process.env.LANGFLOW_API_KEY && {
          'Authorization': `Bearer ${process.env.LANGFLOW_API_KEY}`,
        }),
        ...(process.env.LANGFLOW_API_KEY && !usePythonScript && {
          'x-api-key': process.env.LANGFLOW_API_KEY,
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
        const innerOutput = output.outputs[0];
        if (innerOutput.outputs && innerOutput.outputs.message) {
          responseText = innerOutput.outputs.message.message || innerOutput.outputs.message;
        } else if (innerOutput.message) {
          responseText = innerOutput.message.message || innerOutput.message;
        } else {
          responseText = innerOutput.message || innerOutput.text || JSON.stringify(innerOutput);
        }
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

