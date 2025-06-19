import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { EmailService } from "./email-service";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin
let serviceAccount;
try {
  const serviceAccountString = process.env.***REMOVED***;
  if (serviceAccountString) {
    // Try to parse the service account JSON
    serviceAccount = JSON.parse(serviceAccountString);
    console.log("Firebase service account loaded successfully");
  } else {
    console.warn("***REMOVED*** environment variable not set");
  }
} catch (error) {
  console.warn("Firebase service account not configured or invalid JSON, using default credentials");
  console.error("Service account parsing error:", error);
  serviceAccount = undefined;
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    // Don't throw error, let the app continue without Firebase Admin
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
    interface Request {
      firebaseUser?: any;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Schema for user registration
const registerSchema = insertUserSchema.extend({
  isServiceProvider: z.boolean(),
  firebaseUid: z.string().optional(), // Add Firebase UID
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Schema for service provider additional info
const providerExtendedSchema = z.object({
  categoryId: z.number(),
  hourlyRate: z.number().min(1),
  bio: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  availability: z.string().optional(),
});

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // Check if Firebase Admin is properly initialized
    if (admin.apps.length === 0) {
      console.warn("Firebase Admin not initialized, skipping token verification");
      // For development, we can proceed without verification
      // In production, this should be an error
      if (process.env.NODE_ENV === 'development') {
        req.firebaseUser = { uid: 'dev_uid', email: 'dev@example.com', emailVerified: true };
        return next();
      } else {
        return res.status(500).json({ message: 'Firebase Admin not configured' });
      }
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.***REMOVED*** || "Find My Helper-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          } else if (!user.firebaseUid && !user.isEmailVerified) {
            return done(null, false, { message: "Please verify your email before logging in." });
          } else {
            return done(null, user);
          }
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate the registration data
      const validatedData = registerSchema.parse(req.body);
      
      // If Firebase UID is provided, verify it (only if Firebase Admin is properly configured)
      if (validatedData.firebaseUid) {
        try {
          // Check if Firebase Admin is properly initialized
          if (admin.apps.length === 0) {
            console.warn("Firebase Admin not initialized, skipping UID verification");
          } else {
            const firebaseUser = await admin.auth().getUser(validatedData.firebaseUid);
            // Update email from Firebase if it's different
            if (firebaseUser.email && firebaseUser.email !== validatedData.email) {
              validatedData.email = firebaseUser.email;
            }
            // Mark as verified if Firebase user is verified
            if (firebaseUser.emailVerified) {
              validatedData.isEmailVerified = true;
            }
          }
        } catch (error: any) {
          console.error("Firebase UID verification failed:", error);
          // Don't fail registration if Firebase Admin is not configured
          if (error.code === 'app/no-app') {
            console.warn("Firebase Admin not configured, proceeding without UID verification");
          } else {
            return res.status(400).json({ message: "Invalid Firebase UID" });
          }
        }
      }
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if Firebase UID already exists
      if (validatedData.firebaseUid) {
        const existingUserByFirebaseUid = await storage.getUserByFirebaseUid(validatedData.firebaseUid);
        if (existingUserByFirebaseUid) {
          return res.status(400).json({ message: "User already exists" });
        }
      }
      
      // Generate verification token (only if not using Firebase)
      const emailVerificationToken = validatedData.firebaseUid ? null : randomBytes(32).toString("hex");
      
      // Hash password and create the user
      const user = await storage.createUser({
        ...validatedData,
        password: validatedData.firebaseUid ? "firebase_user" : await hashPassword(validatedData.password),
        isEmailVerified: validatedData.firebaseUid ? true : false, // Only Firebase users are pre-verified
        emailVerificationToken,
      });
      
      // Send verification email only if not using Firebase
      if (!validatedData.firebaseUid && !validatedData.isEmailVerified) {
        await EmailService.sendVerificationEmail(user.email, emailVerificationToken!);
      }
      
      // If user is a service provider, validate and create service provider profile
      if (validatedData.isServiceProvider) {
        try {
          const providerData = providerExtendedSchema.parse(req.body);
          
          await storage.createServiceProvider({
            userId: user.id,
            categoryId: providerData.categoryId,
            hourlyRate: providerData.hourlyRate,
            bio: providerData.bio || "",
            yearsOfExperience: providerData.yearsOfExperience || 0,
            availability: providerData.availability || ""
          });
        } catch (err) {
          // If service provider profile creation fails, still let the user register
          // but return a warning
          console.error("Failed to create service provider profile:", err);
          return res.status(201).json({ 
            user,
            warning: "User created but service provider profile could not be created"
          });
        }
      }

      // For Firebase users, log them in immediately
      if (validatedData.firebaseUid) {
        req.login(user, (err) => {
          if (err) return next(err);
          return res.status(201).json(user);
        });
      } else {
        // Do not log the user in until they verify their email
        return res.status(201).json({ message: "Registration successful. Please check your email to verify your account." });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      next(err);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      // Check if email is verified (only for non-Firebase users)
      if (!user.firebaseUid && !user.isEmailVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in." });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  app.get("/api/user/provider", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const provider = await storage.getServiceProviderByUserId(req.user.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      const providerWithDetails = await storage.getServiceProviderWithUser(provider.id);
      res.json(providerWithDetails);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/verify-email", async (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid or missing token." });
    }
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }
    await storage.updateUser(user.id, { isEmailVerified: true, emailVerificationToken: null });
    res.status(200).json({ message: "Email verified successfully. You can now log in." });
  });

  // Google signup with additional details endpoint
  app.post("/api/register/google", async (req, res) => {
    try {
      // Handle multipart form data for file uploads
      // In a real implementation, you would use multer or similar middleware
      // For now, we'll simulate the file handling
      
      const userData = JSON.parse(req.body.userData || '{}');
      const profileImage = req.body.profileImage; // In real app, this would be the uploaded file
      const idImage = req.body.idImage; // In real app, this would be the uploaded file
      
      // Validate the user data
      const validatedData = registerSchema.parse({
        ...userData,
        password: "google_user", // Placeholder for Google users
        confirmPassword: "google_user",
      });
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create the user
      const user = await storage.createUser({
        ...validatedData,
        password: "google_user",
        isEmailVerified: true, // Google users are pre-verified
        profilePicture: profileImage ? `uploads/profile/${Date.now()}_${profileImage.name}` : null,
      });
      
      // If user is a service provider, create service provider profile
      if (validatedData.isServiceProvider) {
        try {
          // Determine approval status based on ID verification
          const approvalStatus = idImage ? "pending" : "approved";
          const isVerified = !idImage; // Auto-approve if no ID verification
          
          await storage.createServiceProvider({
            userId: user.id,
            categoryId: parseInt(userData.categoryId || '1'),
            hourlyRate: parseFloat(userData.hourlyRate || '25'),
            bio: userData.bio || "",
            yearsOfExperience: userData.yearsOfExperience ? parseInt(userData.yearsOfExperience) : 0,
            availability: userData.availability || "",
            idVerificationImage: idImage ? `uploads/id/${Date.now()}_${idImage.name}` : null,
            isVerified,
            approvalStatus,
            submittedAt: new Date(),
          });
        } catch (err) {
          console.error("Failed to create service provider profile:", err);
          return res.status(201).json({ 
            user,
            warning: "User created but service provider profile could not be created"
          });
        }
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        return res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Firebase authentication endpoint
  app.post("/api/auth/firebase", verifyFirebaseToken, async (req, res) => {
    try {
      const { firebaseUser } = req;
      
      if (!firebaseUser) {
        return res.status(400).json({ message: "No Firebase user data" });
      }
      
      console.log("Processing Firebase authentication for user:", firebaseUser.uid);
      
      // Check if user exists in database
      let user = await storage.getUserByFirebaseUid(firebaseUser.uid);
      
      if (!user) {
        console.log("Creating new user from Firebase data");
        // Create new user from Firebase data
        try {
          user = await storage.createUser({
            username: firebaseUser.email?.split('@')[0] || `user_${Date.now()}`,
            email: firebaseUser.email!,
            password: "firebase_user",
            firstName: firebaseUser.displayName?.split(' ')[0] || "User",
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
            isServiceProvider: false,
            isAdmin: firebaseUser.email === "findmyhelper2025@gmail.com", // Set admin for specific email
            isEmailVerified: firebaseUser.emailVerified,
            firebaseUid: firebaseUser.uid,
          });
          console.log("New user created successfully:", user.id);
        } catch (createError) {
          console.error("Failed to create user:", createError);
          return res.status(500).json({ message: "Failed to create user account" });
        }
      } else {
        console.log("Existing user found:", user.id);
        // Update admin status if needed
        if (firebaseUser.email === "findmyhelper2025@gmail.com" && !user.isAdmin) {
          const updatedUser = await storage.updateUser(user.id, { isAdmin: true });
          if (updatedUser) {
            user = updatedUser;
            console.log("Updated user to admin:", user.id);
          }
        }
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login failed:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        console.log("User logged in successfully:", user.id);
        return res.status(200).json(user);
      });
    } catch (error) {
      console.error("Firebase authentication error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });
}
