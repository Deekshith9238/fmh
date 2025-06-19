# Firebase Authentication Setup Guide

This guide will help you migrate from AWS SMTP authentication to Firebase Authentication with Google and email login.

## Prerequisites

- A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
- Node.js and npm installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Enable "Google" authentication
   - Add your authorized domain (localhost for development)
   - Configure OAuth consent screen if needed

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to "Project Settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web"
4. Register your app and copy the configuration

## Step 4: Get Firebase Admin SDK

1. In Firebase Console, go to "Project Settings" > "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file

## Step 5: Configure Environment Variables

1. Copy `env.example` to `.env`
2. Fill in your Firebase configuration:

```env
# Firebase Configuration (Client-side)
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id",...}
```

3. Replace the `FIREBASE_SERVICE_ACCOUNT` value with the entire content of the JSON file you downloaded

## Step 6: Update Database Schema

Run the database migration to add the Firebase UID field:

```bash
npm run db:push
```

## Step 7: Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Navigate to your authentication page
3. Try logging in with Google
4. Try registering with email/password

## Features Added

- ✅ Google OAuth authentication
- ✅ Email/password authentication
- ✅ Automatic email verification (Firebase handles this)
- ✅ Secure token-based authentication
- ✅ Backward compatibility with existing users

## Migration Notes

- Existing users can still log in with their email/password
- New users can choose between Google OAuth or email/password
- Firebase handles email verification automatically
- No more SMTP configuration needed for new users

## Troubleshooting

### Common Issues

1. **"Firebase service account not configured"**
   - Make sure you've set the `FIREBASE_SERVICE_ACCOUNT` environment variable
   - The value should be the entire JSON content, not just a path

2. **"Invalid token" errors**
   - Check that your Firebase configuration is correct
   - Ensure your domain is authorized in Firebase Console

3. **Google OAuth not working**
   - Verify Google authentication is enabled in Firebase Console
   - Check that your domain is added to authorized domains

### Support

If you encounter issues, check:
- Firebase Console logs
- Browser console for client-side errors
- Server logs for backend errors 