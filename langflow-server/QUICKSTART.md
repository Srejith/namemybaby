# Quick Start Guide

Get the LangFlow server up and running in 5 minutes!

## Prerequisites

- Python 3.11 or higher
- OpenAI API key

## Setup Steps

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create `.env` file:**
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Run the server:**
   ```bash
   python app.py
   ```

4. **Test it:**
   ```bash
   curl http://localhost:8000/health
   ```

That's it! Your server is running on `http://localhost:8000`

## Next Steps

- See `README.md` for detailed documentation
- Deploy using Docker (see `Dockerfile`)
- Integrate with your Next.js app using the URL in your `.env.local`

