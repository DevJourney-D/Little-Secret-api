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


## API Endpoints

### General
- `GET /api/health` — Health check

### Authentication & User Management
- `POST /api/users` — Register new user
- `POST /api/users/login` — User login
- `GET /api/users/email/:email` — Get user by email
- `GET /api/users/username/:username` — Get user by username
- `GET /api/users/availability/username/:username` — Check username availability
- `GET /api/users/availability/email/:email` — Check email availability
- `POST /auth/register` — User registration (frontend compatibility)
- `POST /auth/login` — User login (frontend compatibility)
- `GET /auth/check/username/:username` — Check username availability (frontend compatibility)
- `GET /auth/check/email/:email` — Check email availability (frontend compatibility)
- `GET /api/users/:userId` — Get user profile (protected)
- `PUT /api/users/:userId` — Update user profile (protected)
- `DELETE /api/users/:userId` — Delete user (protected)
- `POST /api/users/:userId/partner` — Connect with partner (protected)
- `DELETE /api/users/:userId/partner` — Disconnect partner (protected)

### Diary
- `GET /api/:userId/diaries` — Get all diaries (protected)
- `POST /api/:userId/diaries` — Create new diary (protected)
- `GET /api/:userId/diaries/:diaryId` — Get diary by ID (protected)
- `PUT /api/:userId/diaries/:diaryId` — Update diary (protected)
- `DELETE /api/:userId/diaries/:diaryId` — Delete diary (protected)
- `POST /api/:userId/diaries/:diaryId/react` — React to diary (protected)

### Chat
- `GET /api/:userId/messages` — Get all chat messages (protected)
- `POST /api/:userId/messages` — Send new message (protected)
- `GET /api/:userId/messages/:messageId` — Get message by ID (protected)
- `DELETE /api/:userId/messages/:messageId` — Delete message (protected)
- `POST /api/:userId/messages/:messageId/react` — React to message (protected)

### Todo
- `GET /api/:userId/todos` — Get all todos (protected)
- `POST /api/:userId/todos` — Create new todo (protected)
- `GET /api/:userId/todos/:todoId` — Get todo by ID (protected)
- `PUT /api/:userId/todos/:todoId` — Update todo (protected)
- `DELETE /api/:userId/todos/:todoId` — Delete todo (protected)

### Pomodoro
- `GET /api/:userId/pomodoro` — Get all pomodoro sessions (protected)
- `POST /api/:userId/pomodoro` — Create new pomodoro session (protected)
- `GET /api/:userId/pomodoro/:sessionId` — Get session by ID (protected)
- `PUT /api/:userId/pomodoro/:sessionId` — Update session (protected)
- `DELETE /api/:userId/pomodoro/:sessionId` — Delete session (protected)

### Math Practice
- `GET /api/:userId/math` — Get all math problems (protected)
- `POST /api/:userId/math` — Create new math problem (protected)
- `GET /api/:userId/math/:problemId` — Get problem by ID (protected)
- `PUT /api/:userId/math/:problemId` — Update problem (protected)
- `DELETE /api/:userId/math/:problemId` — Delete problem (protected)

### Neko AI Chat
- `POST /api/:userId/neko` — Send message to Neko AI (protected)
- `GET /api/:userId/neko/history` — Get Neko AI chat history (protected)

---

## Deployment

Ready for Vercel deployment with serverless functions. See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.

## Database

Complete database schema available in `database/complete_fresh_database.sql` with 22+ tables supporting all features.

---
Made with 💕 for couples everywhere
