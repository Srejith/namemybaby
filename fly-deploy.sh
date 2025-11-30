#!/bin/bash

# Deploy to Fly.io with multiple build secrets
# Replace the values below with your actual secrets or environment variables

fly -a namemybaby deploy \
  --build-secret NEXT_PUBLIC_LANGFLOW_URL=https://nmclangflow.ngrok.dev/api/v1/run/222835eb-0e8f-45db-91db-005693d004cb \
  --build-secret NEXT_PUBLIC_LANGFLOW_API_KEY=sk-__Xna4vc2lqEIqUXujquJAE-3wm34kpSUneYAkuNiK0 \
  --build-secret NEXT_PUBLIC_SUPABASE_URL=https://tjddnhmhikcoziotnxsb.supabase.co \
  --build-secret NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGRuaG1oaWtjb3ppb3RueHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjQ0OTksImV4cCI6MjA3OTEwMDQ5OX0.Wb1-KdN3fHdoi-m-sRtWnfI-1zdal8eQSyaERn07yh0 \
  --build-secret ELEVENLABS_API_KEY=sk_59d9dca537b263b517cd2b2f55ee4bfdbde278434e717079  \
  --build-secret PYTHON_LANGFLOW_URL=https://namemybaby-langflow-server.fly.dev \
  --build-secret USE_PYTHON_LANGFLOW=true \

# Note: If you have these exported in your local terminal, you can use:
# --build-secret NEXT_PUBLIC_LANGFLOW_URL="$NEXT_PUBLIC_LANGFLOW_URL"
