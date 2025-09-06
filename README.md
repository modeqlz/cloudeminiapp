# Telegram Mini App - Mobile Skin Market

A modern Telegram Mini App for mobile skin trading and user interaction.

## Features

- 🔐 Telegram WebApp Authentication
- 👥 User Search by @username  
- 📱 iPhone 14 Pro Responsive Design
- 🎨 Modern UI with Figma-perfect styling
- 🔍 Real-time User Search
- 💾 Automatic User Registration
- 🗄️ Supabase Database Integration
- 🎭 Mock Data Fallback

## Tech Stack

- **Frontend**: Next.js, React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Telegram WebApp
- **Styling**: Custom CSS with CSS Variables
- **Fonts**: Manrope, Inter

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` with your Supabase credentials
4. Run development server: `npm run dev`

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
BOT_TOKEN=your_telegram_bot_token
```

## Database Setup

See `DATABASE_SETUP.md` for detailed Supabase configuration instructions.

## How It Works

1. **User Login**: Users authenticate via Telegram WebApp
2. **Auto Registration**: User data is automatically saved to Supabase/mock data
3. **Search**: Find registered users by @username in real-time
4. **Fallback**: Works with mock data if Supabase is not configured

## Testing

1. Login with different Telegram accounts
2. Each user gets automatically registered 
3. Use "Search by @username" to find other users
4. Search works in real-time as you type