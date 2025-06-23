# FindMyHelper Mobile App

A React Native mobile application for the FindMyHelper platform, connecting service providers with clients.

## Features

### 🔐 Authentication
- Email/Password login and registration
- Google Sign-in integration
- Forgot password functionality
- Firebase authentication with backend sync

### 🏠 Home Screen
- Personalized greeting
- Quick action buttons (Post Task, Find Services, My Tasks)
- Service categories grid
- Featured providers showcase
- Platform statistics

### 🔍 Search & Discovery
- Search providers by name or category
- Filter by service categories
- Provider listings with ratings and pricing
- Provider details view

### 👤 User Management
- User profiles with profile pictures
- Account type selection (Client/Provider)
- Profile editing capabilities

### 🛠️ Service Provider Features
- Provider registration with ID verification
- Service category selection
- Hourly rate setting
- Bio and experience details
- Approval system integration

### 📋 Task Management
- Create and manage tasks
- Task details and status tracking
- Service request system

### 👨‍💼 Admin Features
- Provider approval system
- Admin dashboard (for admin users)
- User management capabilities

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Firebase** for authentication
- **React Navigation** for routing
- **Axios** for API communication
- **Expo Vector Icons** for icons

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd FindMyHelperMobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update Firebase configuration in `src/services/firebase.ts`
   - Ensure Firebase project is set up with Authentication enabled

4. **Configure API**
   - Update the API base URL in `src/services/api.ts`
   - Replace `http://your-ec2-ip:3000/api` with your actual backend URL

5. **Start the development server**
   ```bash
   npm start
   ```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web (for testing)
```bash
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── AuthScreen.tsx
│   ├── HomeScreen.tsx
│   ├── SearchScreen.tsx
│   ├── TasksScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── AdminScreen.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   └── useAuth.tsx
├── services/           # API and external services
│   ├── api.ts
│   └── firebase.ts
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
└── constants/          # App constants
```

## API Integration

The mobile app connects to the same backend as the web application:

- **Authentication**: Firebase + custom backend endpoints
- **User Management**: Full CRUD operations
- **Service Providers**: Registration, approval, and management
- **Tasks**: Creation, management, and tracking
- **File Uploads**: Profile pictures and ID verification (S3)

## Environment Configuration

Make sure your backend is running and accessible. Update the API base URL in `src/services/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://your-ec2-ip:3000/api', // Update this
  timeout: 10000,
});
```

## Development Notes

### Authentication Flow
1. User authenticates with Firebase
2. Firebase ID token is sent to backend
3. Backend validates token and creates/updates user
4. User session is maintained across app

### Navigation Structure
- **Auth Stack**: Login/Register screens
- **Main Tabs**: Home, Search, Tasks, Profile, Admin
- **Modal Screens**: Provider details, task details, etc.

### State Management
- Authentication state managed with React Context
- API calls use Axios with interceptors for auth tokens
- Local state for UI components

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions, please contact the development team.

## License

This project is proprietary software for FindMyHelper platform. 