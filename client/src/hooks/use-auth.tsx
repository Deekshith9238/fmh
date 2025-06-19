import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  serverUser: any | null;
  loading: boolean;
  loginMutation: any;
  registerMutation: any;
  googleLoginMutation: any;
  googleSignupMutation: any;
  logoutMutation: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [serverUser, setServerUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch server user data
  const fetchServerUser = async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      if (response.ok) {
        const userData = await response.json();
        setServerUser(userData);
      } else {
        setServerUser(null);
      }
    } catch (error) {
      setServerUser(null);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch server user data when Firebase user is available
        await fetchServerUser();
      } else {
        setServerUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    },
    onSuccess: async (user) => {
      await fetchServerUser();
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      let message = "Login failed";
      if (error.code === "auth/user-not-found") {
        message = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password";
      } else if (error.code === "auth/user-disabled") {
        message = "Account has been disabled";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later";
      } else if (error.code === "auth/email-not-verified") {
        message = "Please verify your email before logging in";
      }
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Google Login
  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the ID token
      const idToken = await result.user.getIdToken();
      
      // Authenticate with the server
      const response = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate with server");
      }

      return result.user;
    },
    onSuccess: async (user) => {
      await fetchServerUser();
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Google login failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Email/Password Registration
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { email, password, firstName, lastName, isServiceProvider, ...providerData } = userData;
      
      // Create user with Firebase
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`.trim()
      });

      // Send email verification
      await sendEmailVerification(result.user);

      // Create user in your database
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userData,
          firebaseUid: result.user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create user in database");
      }

      return result.user;
    },
    onSuccess: async (user) => {
      await fetchServerUser();
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account",
      });
    },
    onError: (error: any) => {
      let message = "Registration failed";
      if (error.code === "auth/email-already-in-use") {
        message = "An account with this email already exists";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address";
      }
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Google Signup with additional details
  const googleSignupMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { profileImage, idImage, ...userDetails } = userData;
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('userData', JSON.stringify(userDetails));
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
      if (idImage) {
        formData.append('idImage', idImage);
      }
      
      // Create user in your database with additional details
      const response = await fetch("/api/register/google", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create user in database");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      await fetchServerUser();
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut(auth);
    },
    onSuccess: () => {
      setServerUser(null);
      queryClient.clear();
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        serverUser,
        loading,
        loginMutation,
        registerMutation,
        googleLoginMutation,
        googleSignupMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
