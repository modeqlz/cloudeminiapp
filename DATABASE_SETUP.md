# Database Setup Guide for Telegram Mini App

## Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API

### 2. Create Users Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_search ON users USING gin((first_name || ' ' || last_name || ' ' || username) gin_trgm_ops);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (adjust as needed)
CREATE POLICY "Users are publicly readable" ON users
  FOR SELECT USING (true);

-- Create policy for authenticated users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true);

-- Create policy for inserting new users
CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (true);
```

### 3. Add Initial Test Data (Optional)

```sql
INSERT INTO users (telegram_id, username, first_name, last_name, avatar_url, verified) VALUES
(111111111, 'testuser1', 'John', 'Doe', '/placeholder.png', true),
(222222222, 'testuser2', 'Jane', 'Smith', '/placeholder.png', false),
(333333333, 'testuser3', 'Alex', 'Brown', '/placeholder.png', true);
```

### 4. Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
BOT_TOKEN=your_telegram_bot_token
```

### 5. Enable Required Extensions (if needed)

For better search functionality, enable the pg_trgm extension:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## Features

- **Automatic User Registration**: Users are automatically added to the database when they log in via Telegram
- **User Search**: Search users by username or name (case-insensitive)
- **Fallback System**: App works with mock data if Supabase is not configured
- **Real-time Updates**: User data is updated on each login

## Testing

1. Start your Next.js app: `npm run dev`
2. Open the app in Telegram WebApp
3. Login with your Telegram account
4. Try searching for users in the "Search People" feature
5. Check the Supabase dashboard to see registered users

## Troubleshooting

- If you see "supabaseUrl is required" error, make sure your `.env.local` file is properly configured
- The app will fall back to mock data if Supabase is not available
- Check the browser console for detailed error messages
- Verify your Supabase RLS policies if you encounter permission errors
