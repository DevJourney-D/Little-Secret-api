# Little-Secret-api

🐱💕 Neko U Backend API - A couple diary and relationship management application

## Overview

This is the backend API for the Little Secret (Neko U) application - a comprehensive platform for couples to share diaries, chat, manage todos, track productivity with Pomodoro sessions, practice math together, and interact with an AI companion.

## Features

- 👥 **User Management** - Registration, authentication, partner connections
- 📝 **Diary System** - Shared couple diaries with mood tracking
- 💬 **Real-time Chat** - Messaging between partners
- ✅ **Todo Management** - Shared and personal task tracking
- 🍅 **Pomodoro Sessions** - Focus tracking and productivity
- 📊 **Math Practice** - Educational math problems and progress
- 🐱 **Neko AI Chat** - AI companion interactions

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **Deployment**: Vercel (Serverless Functions)

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Set up Supabase database with provided schema
5. Run development server: `npm run dev`

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/users` - User registration
- `POST /api/users/login` - User login
- `/api/users/:userId/*` - User management (protected)
- `/api/:userId/diary/*` - Diary operations (protected)
- `/api/:userId/messages/*` - Chat operations (protected)
- `/api/:userId/todos/*` - Todo operations (protected)
- `/api/:userId/pomodoro/*` - Pomodoro operations (protected)
- `/api/:userId/math/*` - Math operations (protected)
- `/api/:userId/neko-chat/*` - AI chat operations (protected)

## Deployment

Ready for Vercel deployment with serverless functions. See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.

## Database

Complete database schema available in `database/complete_fresh_database.sql` with 22+ tables supporting all features.

---
Made with 💕 for couples everywhere
