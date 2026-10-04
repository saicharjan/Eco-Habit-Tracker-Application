# React Native Authentication System

A complete authentication system built with React Native (Expo), supporting three user roles: User, Admin, and NGO. The system includes JWT-based authentication, role-based navigation, and WebView integration for role-specific dashboards.

## Features

- User authentication (Login/Signup)
- Role-based access control (User, Admin, NGO)
- JWT token-based authentication
- Secure token storage using Expo Secure Store
- Protected routes
- Role-specific WebView dashboards
- MongoDB database integration
- Express.js backend API

## Prerequisites

- Node.js (v14 or later)
- MongoDB (running locally or a remote instance)
- Expo CLI (`npm install -g expo-cli`)

## Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Update the environment variables as needed

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the Expo development server:
   ```bash
   # In a new terminal, from the project root
   npm start
   ```

3. Run on your device or emulator:
   - Press 'a' for Android
   - Press 'i' for iOS
   - Scan QR code with Expo Go app for physical devices

## Project Structure

```
.
├── app/
│   ├── context/
│   │   └── AuthContext.js
│   │   
│   │   └── screens/
│   │       ├── LoginScreen.js
│   │       ├── SignupScreen.js
│   │       └── DashboardScreen.js
│   └── config/
│       └── api.js
├── backend/
│   ├── server.js
│   └── .env
└── package.json
```

## API Endpoints

### Authentication
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- GET `/auth/user` - Get user profile (protected)

### User Management (Admin only)
- GET `/users` - Get list of all users
- PUT `/users/:userId/activate` - Activate a user account
- PUT `/users/:userId/deactivate` - Deactivate a user account

## User Management

The application includes an admin dashboard that allows administrators to:

1. View all users in the system
2. Activate or deactivate user accounts
3. Monitor user registration statistics

Deactivated users cannot log into the application and will be automatically logged out if already logged in.

## Security Considerations

- JWT tokens are stored securely using Expo Secure Store
- Passwords are hashed using bcrypt
- Protected routes require valid JWT tokens
- Environment variables for sensitive data

## WebView Integration

The application uses WebView to display role-specific dashboards:
- User Dashboard: `https://yourapp.com/user-dashboard`
- Admin Dashboard: `https://yourapp.com/admin-dashboard`
- NGO Dashboard: `https://yourapp.com/ngo-dashboard`

Replace these URLs with your actual dashboard URLs.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
