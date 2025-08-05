# Little-Secret-api

🐱💕 Neko U Backend API - A couple diary and relationship management application

## Overview

This is the backend API for the Little Secret (Neko U) application - a comprehensive platform for couples to share diaries, chat, manage todos, track productivity with Pomodoro sessions, practice math together, and interact with an AI companion.

## 🎉 Recent Updates (August 2025)

### Database Schema Migration
- ✅ **ID System Upgrade**: Migrated from UUID to BigInt auto-increment for better performance
- ✅ **Enhanced Tables**: Added new fields for reactions, activity logs, and improved user preferences
- ✅ **Modern Schema**: Updated all tables to use the latest PostgreSQL best practices
- ✅ **Code Optimization**: Removed UUID dependencies and optimized all service classes

See [Database Migration Notes](./database/migration-notes.md) for detailed changes.

## Features

- 👥 **User Management** - Registration, authentication, partner connections
- 📝 **Diary System** - Shared couple diaries with mood tracking and reactions
- 💬 **Real-time Chat** - Messaging between partners with reactions and rich media
- ✅ **Todo Management** - Shared and personal task tracking with advanced features
- 🍅 **Pomodoro Sessions** - Focus tracking and productivity analysis
- 📊 **Math Practice** - Educational math problems with detailed analytics
- 🐱 **Neko AI Chat** - AI companion interactions with context awareness
- 📊 **Activity Logging** - Comprehensive user activity tracking

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL) with BigInt IDs
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
