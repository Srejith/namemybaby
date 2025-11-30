# Name My Baby - LangFlow Replacement Server

A standalone Python FastAPI server that replaces the LangFlow API functionality for the Name My Baby application.

This server can be hosted independently and provides the same API interface as LangFlow, handling chat requests with conversation memory and OpenAI integration.

## Features

- ✅ FastAPI-based REST API server
- ✅ Conversation memory per session
- ✅ OpenAI integration (gpt-4o-mini)
- ✅ LangFlow-compatible API interface
- ✅ Automatic session management
- ✅ Health check endpoint

## Quick Start

### 1. Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

Create a `.env` file in this directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
HOST=0.0.0.0
```

Or set environment variables:

```bash
export OPENAI_API_KEY=your_openai_api_key_here
export PORT=8000
export HOST=0.0.0.0
```

### 3. Run the Server

```bash
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000` by default.

## API Endpoints

### POST `/api/v1/run`

Main endpoint that replaces LangFlow API. Handles chat requests with memory.

**Request Body:**
```json
{
  "message": "User message here",
  "session_id": "optional-session-id",
  "input_value": "User message here",
  "user_id": "optional-user-id",
  "input_type": "chat",
  "output_type": "chat"
}
```

**Response:**
```json
{
  "outputs": [
    {
      "outputs": [
        {
          "outputs": {
            "message": {
              "message": "AI response here"
            }
          }
        }
      ]
    }
  ],
  "session_id": "session-id"
}
```

### POST `/api/v1/chat`

Alternative chat endpoint (aliases to `/api/v1/run`).

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `PORT` | Server port | `8000` |
| `HOST` | Server host | `0.0.0.0` |

## Development

### Running in Development Mode

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Testing the API

```bash
# Health check
curl http://localhost:8000/health

# Chat request
curl -X POST http://localhost:8000/api/v1/run \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Provide me with name suggestions for my baby boy",
    "session_id": "test-session-123"
  }'
```

## Production Deployment

### Option 1: Using Gunicorn

```bash
pip install gunicorn
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Option 2: Using Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t langflow-server .
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key_here langflow-server
```

### Option 3: Using PM2

```bash
npm install -g pm2
pm2 start "uvicorn app:app --host 0.0.0.0 --port 8000" --name langflow-server
```

## Integration with Next.js

To use this server with the Name My Baby Next.js application:

1. Deploy this server to a hosting platform (Fly.io, Railway, Heroku, etc.)

2. Set environment variables in your Next.js app's `.env.local`:

```env
USE_PYTHON_LANGFLOW=true
PYTHON_LANGFLOW_URL=https://your-langflow-server-url.com
```

3. The Next.js app will automatically route requests to this server.

## Session Memory

Session memory is currently stored in-memory, which means:
- Sessions are lost when the server restarts
- Each server instance has separate memory (not shared across multiple instances)

For production deployments with multiple instances, consider:
- Using Redis for shared session storage
- Using a database for persistent session storage
- Implementing a distributed cache solution

## Architecture

The server implements:

1. **Session Management**: Each session maintains its own conversation memory
2. **Prompt Template**: Uses the same classification prompt as the original LangFlow flow
3. **OpenAI Integration**: Uses LangChain with OpenAI's gpt-4o-mini model
4. **API Compatibility**: Matches LangFlow's response format exactly

## License

Part of the Name My Baby application.

