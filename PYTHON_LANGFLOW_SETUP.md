# Python LangFlow Replacement Setup

This document explains how to use the standalone Python LangFlow server with the Name My Baby application.

## Overview

The Python server is located in the `langflow-server/` folder and can be hosted independently. It replicates the LangFlow functionality as a standalone FastAPI server. It handles chat requests with conversation memory and OpenAI integration.

## Setup Instructions

### 1. Navigate to the LangFlow Server Directory

```bash
cd langflow-server
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Environment Variables

Create a `.env` file in the `langflow-server/` directory (copy from `env.example`):

```bash
cp env.example .env
```

Then edit `.env` and set your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
HOST=0.0.0.0
```

### 4. Start the Python Server

```bash
python app.py
```

The server will start on `http://localhost:8000` by default.

For more detailed setup instructions, see `langflow-server/README.md`.

### 4. Configure Next.js to Use Python Server

In your Next.js `.env.local` file (in the project root):

```env
USE_PYTHON_LANGFLOW=true
PYTHON_LANGFLOW_URL=http://localhost:8000
```

**Or** if hosting the Python server separately, use its deployment URL:

```env
USE_PYTHON_LANGFLOW=true
PYTHON_LANGFLOW_URL=https://your-langflow-server-url.com
```

**Or** set it in your environment:

```bash
export USE_PYTHON_LANGFLOW=true
export PYTHON_LANGFLOW_URL=http://localhost:8000
```

### 5. Start Next.js Application

```bash
npm run dev
```

## API Compatibility

The Python server provides the same API interface as LangFlow:

- **Endpoint**: `/api/v1/run`
- **Method**: POST
- **Request Format**: Same as LangFlow
- **Response Format**: Same as LangFlow (nested outputs structure)

## Features

- ✅ Conversation memory per session
- ✅ OpenAI integration (gpt-4o-mini)
- ✅ Same prompt template as LangFlow
- ✅ Compatible API response format
- ✅ Session management

## Switching Back to LangFlow

To switch back to LangFlow, simply remove or set:

```env
USE_PYTHON_LANGFLOW=false
```

Or remove the environment variable entirely.

## Troubleshooting

1. **Python server won't start**: Make sure `OPENAI_API_KEY` is set
2. **Connection errors**: Ensure Python server is running before starting Next.js
3. **Memory issues**: Session memory is stored in-memory. For production, consider using Redis or database storage

## Production Deployment

For production, consider:
- Using Redis or database for session memory storage
- Running Python server as a systemd service
- Using a process manager like PM2 or supervisor
- Setting up proper logging and monitoring

