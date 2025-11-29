🤪 Name My Baby: Stop the Suffering, Start the Naming
The Actual Problem We're Solving
Congrats, you made a human! Now comes the hard part: Naming it.

If you’re an immigrant parent, you know the drill. You pick a gorgeous, meaningful name from your language, and then... you watch the cashier/teacher/doctor look at it, panic, and say something that sounds like an angry sneeze.

Name My Baby is here to fix that awkward, decades-long mess. We’re the only naming assistant that gets it. Seriously, stop inflicting unpronounceable tongue twisters on your kid just because "tradition."

How to Use This Thing (It's Easy, We Promise)
1. The Chatbot That Actually Helps
Tired of those dumb baby name books? Good. Just jump into our LLM-powered chat and spill the beans.

Tell us:

The Vibe: Boy/Girl/Unicorn?

Your Baggage: Any weird names you have to avoid? Oh, or are you the parent who wants short and a "modern" name?

The Crux: Where you were born (a place with real names, thank you very much) and the place you live now (where the only name they can confidently say is probably "John").

Our AI wizard will churn out names that are beautiful and won't require your kid to spell it out four times before ordering a latte.

2. The Voice Analysis: The Ultimate Vetting Tool
This is the part where we become your best friend. Forget hoping for the best—we bring the data.

Your Gold Standard: Say the name out loud into your phone. Get that perfect, native-speaker pronunciation recorded. That's the bar.

The Accent Gauntlet: We then make a bunch of digital strangers in your current country (think Generic American #4 or Slightly Grumpy British Guy) try to say the name.

Listen and Compare: Play back both recordings side by side. Hear exactly how your beautiful name gets butchered. Then make an informed decision about whether it's worth the pronunciation battles.

3. Crowd-Source the Stress (The Voting Poll)
You're a modern parent. You need validation.

Name Poll Fight Club: Whip up a quick poll of your favorite candidates.

Send it to the Masses: Share the link with your family and friends. Let them listen to the perfect (and the butchered!) versions and cast their sacred vote. They also get to rate how "cool" or "tragic" the name is.

Final Decision: Use the results to make the right choice. Or ignore everyone and pick the name you secretly loved all along. We're not your boss.

Get started with Name My Baby. Because your kid deserves a name that sounds awesome, not an apology.

What name have you been thinking about that the locals just cannot handle?

## LangFlow Server Configuration

The AI sidebar is powered by a LangFlow server. To connect your LangFlow instance:

1. **Create a `.env.local` file** in the root directory with the following variables:

```env
# LangFlow server URL (e.g., http://localhost:7860 or https://your-langflow-instance.com)
NEXT_PUBLIC_LANGFLOW_URL=http://localhost:7860

# LangFlow API endpoint (default is /api/v1/chat)
# Adjust based on your LangFlow setup:
# - /api/v1/chat for chat endpoints
# - /api/v1/run/{flow_id} for specific flow runs
LANGFLOW_ENDPOINT=/api/v1/chat

# Optional: API key for authenticated LangFlow instances
# LANGFLOW_API_KEY=your_api_key_here
```

2. **Update the API route** (`app/api/langflow/route.ts`) if your LangFlow setup uses a different:
   - Request payload structure
   - Response format
   - Authentication method

3. **Start your LangFlow server** before running the Next.js application.

The API route at `/api/langflow` will proxy requests to your LangFlow server, handling CORS and session management automatically.

## Supabase Database Setup

The application uses Supabase for persistent storage of names across four tables: `generated_list`, `shortlist`, `maybe`, and `rejected`.

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings > API

### 2. Configure Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Enable Google Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: Get from [Google Cloud Console](https://console.cloud.google.com/)
   - **Client Secret**: Get from Google Cloud Console
5. Add authorized redirect URL: `https://your-project-url.supabase.co/auth/v1/callback`
   - For local development: `http://localhost:3000/auth/callback`

### 4. Create Database Tables

Run the SQL script in `supabase-schema.sql` in your Supabase SQL Editor. This creates:
- Four tables: `generated_list`, `shortlist`, `maybe`, `rejected`
- `user_id` column in each table referencing `auth.users(id)`
- Unique constraints on `(user_id, LOWER(name))` to prevent duplicates per user (case-insensitive)
- Indexes for better query performance

### 5. (Optional) Enable Row Level Security (RLS)

For additional security, you can enable RLS in Supabase. Add these policies after running the schema:

```sql
ALTER TABLE generated_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE maybe ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejected ENABLE ROW LEVEL SECURITY;

-- Allow users to only see their own data
CREATE POLICY "Users can view own data" ON generated_list
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON generated_list
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON generated_list
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own data" ON generated_list
  FOR DELETE USING (auth.uid() = user_id);

-- Repeat for shortlist, maybe, and rejected tables
```

### 6. Database Features

- **User Authentication**: Google OAuth authentication required to use the app
- **User-Specific Data**: All data is scoped to the authenticated user via `user_id`
- **Automatic Persistence**: All name operations (add, delete, move) are automatically saved to Supabase
- **Duplicate Prevention**: Database enforces unique names per user within each table (case-insensitive)
- **Data Loading**: Names are automatically loaded from the database when a user signs in
- **Session Management**: User sessions persist across page refreshes

The application requires Google authentication. Users can only see and modify their own data.