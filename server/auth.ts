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
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

declare global {
  namespace Express {
    interface User extends SelectUser {}
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

async function sendVerificationEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.***REMOVED***,
    },
  });
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your email address",
    html: `<p>Click <a href='${verifyUrl}'>here</a> to verify your email address.</p>`
  });
}

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
      
      // Generate verification token
      const emailVerificationToken = randomBytes(32).toString("hex");
      // Hash password and create the user
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
        isEmailVerified: false,
        emailVerificationToken,
      });
      // Send verification email
      await sendVerificationEmail(user.email, emailVerificationToken);
      
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

      // Do not log the user in until they verify their email
      return res.status(201).json({ message: "Registration successful. Please check your email to verify your account." });
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
    passport.authenticate("local", async (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      // Check if email is verified
      if (!user.isEmailVerified) {
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
}
