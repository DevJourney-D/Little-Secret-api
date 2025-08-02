# Username/Password Authentication System

## Overview

The system has been updated to use username and password authentication instead of email-based Supabase Auth. This provides a simpler user experience where users can log in with just their username and password.

## Key Changes

### Database Schema
- Added `password_hash` column to `users` table for storing bcrypt-hashed passwords
- Updated `user_sessions` table with additional session management columns
- Added proper indexes for performance
- Enhanced RLS policies for security

### Backend API (v2)
- **POST** `/api/v2/auth/register` - Register new user with username/password
- **POST** `/api/v2/auth/login` - Login with username/password
- **POST** `/api/v2/auth/verify-session` - Verify session token
- **POST** `/api/v2/auth/logout` - Logout and invalidate session

### Frontend Updates
- Updated registration form to use backend API
- Updated login form to use backend API
- Modified session management to work with custom tokens
- Updated user-info.js to handle new authentication flow

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds = 12
- Password minimum length: 6 characters
- Passwords are never stored in plain text

### Session Management
- Session tokens are generated using crypto.randomUUID()
- Sessions expire after 24 hours
- Session validation includes database verification
- Automatic cleanup of expired sessions

### Data Validation
- Username: 3-30 characters, lowercase, alphanumeric + underscore
- Email: Standard email format validation
- Case-insensitive username/email checks to prevent duplicates

## Authentication Flow

### Registration
1. User fills registration form
2. Frontend validates input
3. Frontend sends data to `/api/v2/auth/register`
4. Backend validates data and checks for duplicates
5. Backend hashes password with bcrypt
6. Backend creates user record with hashed password
7. Backend handles partner matching if partner code provided
8. Backend creates user preferences and relationships
9. Frontend shows success message and redirects to login

### Login
1. User enters username and password
2. Frontend sends credentials to `/api/v2/auth/login`
3. Backend finds user by username (case-insensitive)
4. Backend verifies password using bcrypt
5. Backend creates session token and stores in database
6. Backend updates user's last_seen and online status
7. Backend returns user data and session token
8. Frontend stores session locally and redirects to dashboard

### Session Verification
1. Frontend checks local session on page load
2. If session exists, verify with `/api/v2/auth/verify-session`
3. Backend checks session token in database
4. Backend verifies expiration time
5. If valid, update last_activity timestamp
6. Return verification result to frontend

### Logout
1. User clicks logout
2. Frontend calls `/api/v2/auth/logout`
3. Backend deletes session from database
4. Backend updates user status to offline
5. Backend logs logout activity
6. Frontend clears local session data
7. Frontend redirects to login page

## Database Migration

Run the migration file to add required columns and indexes:

```sql
-- Run this in your Supabase SQL editor
\i backend/database/username_password_migration.sql
```

## Configuration

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Backend Dependencies
- bcryptjs (for password hashing)
- crypto (for session tokens)
- express (for API endpoints)
- @supabase/supabase-js (for database operations)

## API Endpoints Documentation

### Register User
```http
POST /api/v2/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "nickname": "Johnny",
  "email": "john@example.com",
  "username": "john_doe",
  "password": "securepassword123",
  "gender": "male",
  "partnerCode": "ABC123" // optional
}
```

### Login User
```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

### Verify Session
```http
POST /api/v2/auth/verify-session
Content-Type: application/json

{
  "sessionToken": "uuid-session-token",
  "userId": "user-uuid"
}
```

### Logout User
```http
POST /api/v2/auth/logout
Content-Type: application/json

{
  "sessionToken": "uuid-session-token",
  "userId": "user-uuid"
}
```

## Testing

Test the authentication system:

1. Start the backend server: `npm run dev`
2. Access frontend pages
3. Try registering a new user
4. Try logging in with username/password
5. Verify session persistence across page reloads
6. Test logout functionality

## Security Notes

- Always use HTTPS in production
- Store session tokens securely in client
- Implement rate limiting for authentication endpoints
- Regular cleanup of expired sessions
- Monitor for suspicious login attempts
- Consider implementing password complexity requirements
- Add password reset functionality for forgot password

## Future Enhancements

- Two-factor authentication (2FA)
- Password reset via email
- Social login integration
- Session management dashboard
- Login attempt monitoring
- Password strength meter
- Account lockout after failed attempts
