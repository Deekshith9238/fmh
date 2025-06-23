import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from '../services/firebase';
import { authAPI } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseAuthTypes.User | null;
  serverUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateServerUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [serverUser, setServerUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch server user data
  const fetchServerUser = async (user: FirebaseAuthTypes.User) => {
    try {
      const idToken = await user.getIdToken();
      const response = await authAPI.firebaseAuth(idToken);
      setServerUser(response.data);
    } catch (error) {
      console.error('Failed to fetch server user:', error);
      setServerUser(null);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchServerUser(user);
      } else {
        setServerUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login with email/password
  const login = async (email: string, password: string) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Register new user
  const register = async (userData: any) => {
    try {
      await auth.createUserWithEmailAndPassword(userData.email, userData.password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Google login
  const googleLogin = async () => {
    try {
      // For React Native, we'll need to implement Google Sign-In differently
      // This is a placeholder - you'll need to add Google Sign-In configuration
      throw new Error('Google Sign-In not yet implemented for React Native');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    try {
      await auth.sendPasswordResetEmail(email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Update server user
  const updateServerUser = async (userData: Partial<User>) => {
    try {
      const response = await authAPI.updateUser(userData);
      setServerUser(response.data);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value: AuthContextType = {
    firebaseUser,
    serverUser,
    loading,
    login,
    register,
    googleLogin,
    logout,
    forgotPassword,
    updateServerUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 