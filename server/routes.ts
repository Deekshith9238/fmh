import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertTaskSchema, 
  insertServiceRequestSchema,
  insertReviewSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { fileURLToPath } from "url";
import { EmailService } from "./email-service";
import { uploadToS3 } from './s3';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads', file.fieldname);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // User profile update route
  app.put("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update your profile" });
    }
    
    try {
      // Validate the update data
      const updateSchema = z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Invalid email address"),
        phoneNumber: z.string().optional(),
        profilePicture: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // Check if email is being changed and if it already exists
      if (validatedData.email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(req.user.id, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the session user data
      req.user = updatedUser;
      
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Service provider profile routes
  app.post("/api/providers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a provider profile" });
    }
    
    try {
      const providerSchema = z.object({
        categoryId: z.number().min(1, "Category is required"),
        hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
        bio: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        availability: z.string().optional(),
        idVerificationImage: z.string().optional(),
      });
      
      const validatedData = providerSchema.parse(req.body);
      
      // Check if user already has a provider profile
      const existingProvider = await storage.getServiceProviderByUserId(req.user.id);
      if (existingProvider) {
        return res.status(400).json({ message: "Provider profile already exists" });
      }
      
      // Determine approval status based on ID verification
      const approvalStatus = validatedData.idVerificationImage ? "pending" : "approved";
      const isVerified = !validatedData.idVerificationImage; // Auto-approve if no ID verification
      
      console.log(`Creating provider for user ${req.user.id} with approval status: ${approvalStatus}`);
      
      // Create the provider profile
      const provider = await storage.createServiceProvider({
        userId: req.user.id,
        ...validatedData,
        approvalStatus,
        isVerified,
        submittedAt: new Date(),
      });
      
      console.log(`Provider created with ID: ${provider.id}, status: ${provider.approvalStatus}`);
      
      // Send email notification to admin if provider is pending approval
      if (provider.approvalStatus === "pending") {
        try {
          // Get user and category details for the email
          const user = await storage.getUser(provider.userId);
          const category = await storage.getServiceCategory(provider.categoryId);
          
          if (user && category) {
            // Find admin user
            const adminUser = await storage.getUserByEmail("findmyhelper2025@gmail.com");
            
            if (adminUser) {
              await EmailService.sendProviderApplicationNotification(
                adminUser.email,
                {
                  providerName: `${user.firstName} ${user.lastName}`,
                  providerEmail: user.email,
                  category: category.name,
                  hourlyRate: provider.hourlyRate,
                  bio: provider.bio || "",
                  yearsOfExperience: provider.yearsOfExperience || 0,
                  availability: provider.availability || "",
                  submittedAt: provider.submittedAt || new Date(),
                }
              );
            }
          }
        } catch (error) {
          console.error("Failed to send provider application notification:", error);
        }
      }
      
      res.status(201).json(provider);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Failed to create provider profile" });
    }
  });

  app.put("/api/providers/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update your provider profile" });
    }
    
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.getServiceProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      // Check if the provider profile belongs to the current user
      if (provider.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own provider profile" });
      }
      
      const providerSchema = z.object({
        categoryId: z.number().min(1, "Category is required"),
        hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
        bio: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        availability: z.string().optional(),
        idVerificationImage: z.string().optional(),
      });
      
      const validatedData = providerSchema.parse(req.body);
      
      // Update the provider profile
      const updatedProvider = await storage.updateServiceProvider(providerId, validatedData);
      
      if (!updatedProvider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      res.json(updatedProvider);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Failed to update provider profile" });
    }
  });

  // Admin routes for provider approval
  app.get("/api/admin/pending-providers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in" });
    }
    
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const pendingProviders = await storage.getPendingServiceProviders();
      
      console.log(`Found ${pendingProviders.length} pending providers`);
      
      // Enhance with user and category info
      const providersWithDetails = await Promise.all(
        pendingProviders.map(async (provider) => {
          const user = await storage.getUser(provider.userId);
          const category = await storage.getServiceCategory(provider.categoryId);
          
          if (!user || !category) return null;
          
          return {
            ...provider,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              profilePicture: user.profilePicture,
              username: user.username
            },
            category
          };
        })
      );
      
      // Filter out null results
      const filteredProviders = providersWithDetails.filter(p => p !== null);
      console.log(`Returning ${filteredProviders.length} providers with details`);
      
      res.json(filteredProviders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch pending providers" });
    }
  });

  app.post("/api/admin/providers/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in" });
    }
    
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const providerId = parseInt(req.params.id);
      const { adminNotes } = req.body;
      
      const provider = await storage.getServiceProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      if (provider.approvalStatus !== "pending") {
        return res.status(400).json({ message: "Provider is not pending approval" });
      }
      
      const updatedProvider = await storage.updateServiceProvider(providerId, {
        approvalStatus: "approved",
        isVerified: true,
        adminNotes: adminNotes || null,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      });
      
      // Send approval notification to provider
      try {
        const user = await storage.getUser(provider.userId);
        if (user) {
          await EmailService.sendApprovalNotification({
            approved: true,
            adminNotes: adminNotes,
            providerName: `${user.firstName} ${user.lastName}`,
            providerEmail: user.email,
          });
        }
      } catch (error) {
        console.error("Failed to send approval notification:", error);
      }
      
      res.json(updatedProvider);
    } catch (err) {
      res.status(500).json({ message: "Failed to approve provider" });
    }
  });

  app.post("/api/admin/providers/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in" });
    }
    
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const providerId = parseInt(req.params.id);
      const { adminNotes } = req.body;
      
      if (!adminNotes) {
        return res.status(400).json({ message: "Admin notes are required for rejection" });
      }
      
      const provider = await storage.getServiceProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      if (provider.approvalStatus !== "pending") {
        return res.status(400).json({ message: "Provider is not pending approval" });
      }
      
      const updatedProvider = await storage.updateServiceProvider(providerId, {
        approvalStatus: "rejected",
        isVerified: false,
        adminNotes: adminNotes,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      });
      
      // Send rejection notification to provider
      try {
        const user = await storage.getUser(provider.userId);
        if (user) {
          await EmailService.sendApprovalNotification({
            approved: false,
            adminNotes: adminNotes,
            providerName: `${user.firstName} ${user.lastName}`,
            providerEmail: user.email,
          });
        }
      } catch (error) {
        console.error("Failed to send rejection notification:", error);
      }
      
      res.json(updatedProvider);
    } catch (err) {
      res.status(500).json({ message: "Failed to reject provider" });
    }
  });

  // Service categories routes
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getServiceCategory(parseInt(req.params.id));
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Service providers routes
  app.get("/api/providers", async (_req, res) => {
    try {
      const providers = await storage.getServiceProviders();
      
      // Filter to only show approved providers
      const approvedProviders = providers.filter(provider => provider.approvalStatus === "approved");
      
      // Fetch user and category info for each provider
      const providersWithDetails = await Promise.all(
        approvedProviders.map(async (provider) => {
          const user = await storage.getUser(provider.userId);
          const category = await storage.getServiceCategory(provider.categoryId);
          
          if (!user || !category) return null;
          
          return {
            ...provider,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePicture: user.profilePicture,
              username: user.username
            },
            category
          };
        })
      );
      
      // Filter out null results
      res.json(providersWithDetails.filter(p => p !== null));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch service providers" });
    }
  });
  
  app.get("/api/providers/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const providers = await storage.getServiceProvidersByCategory(categoryId);
      
      // Filter to only show approved providers
      const approvedProviders = providers.filter(provider => provider.approvalStatus === "approved");
      
      // Fetch user info for each provider
      const providersWithDetails = await Promise.all(
        approvedProviders.map(async (provider) => {
          const user = await storage.getUser(provider.userId);
          const category = await storage.getServiceCategory(provider.categoryId);
          
          if (!user || !category) return null;
          
          return {
            ...provider,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePicture: user.profilePicture,
              username: user.username
            },
            category
          };
        })
      );
      
      // Filter out null results
      res.json(providersWithDetails.filter(p => p !== null));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch service providers" });
    }
  });
  
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const providerWithDetails = await storage.getServiceProviderWithUser(providerId);
      
      if (!providerWithDetails) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Only allow access to approved providers
      if (providerWithDetails.approvalStatus !== "approved") {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Get reviews for this provider
      const reviews = await storage.getReviewsByProvider(providerId);
      
      // Enhance reviews with client info
      const reviewsWithClientInfo = await Promise.all(
        reviews.map(async (review) => {
          const client = await storage.getUser(review.clientId);
          return {
            ...review,
            client: client ? {
              id: client.id,
              firstName: client.firstName,
              lastName: client.lastName,
              profilePicture: client.profilePicture
            } : null
          };
        })
      );
      
      res.json({
        ...providerWithDetails,
        reviews: reviewsWithClientInfo
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch provider details" });
    }
  });

  // Tasks routes
  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a task" });
    }
    
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        clientId: req.user.id
      });
      
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  app.get("/api/tasks", async (_req, res) => {
    try {
      const tasks = await storage.getTasks();
      
      // Enhance tasks with client and category info
      const tasksWithDetails = await Promise.all(
        tasks.map(async (task) => {
          const client = await storage.getUser(task.clientId);
          const category = await storage.getServiceCategory(task.categoryId);
          
          if (!client || !category) return null;
          
          return {
            ...task,
            client: {
              id: client.id,
              firstName: client.firstName,
              lastName: client.lastName,
              profilePicture: client.profilePicture
            },
            category
          };
        })
      );
      
      // Filter out null results
      res.json(tasksWithDetails.filter(t => t !== null));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  app.get("/api/tasks/client", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view your tasks" });
    }
    
    try {
      const tasks = await storage.getTasksByClient(req.user.id);
      
      // Enhance tasks with category info
      const tasksWithDetails = await Promise.all(
        tasks.map(async (task) => {
          const category = await storage.getServiceCategory(task.categoryId);
          return category ? { ...task, category } : null;
        })
      );
      
      // Filter out null results
      res.json(tasksWithDetails.filter(t => t !== null));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const client = await storage.getUser(task.clientId);
      const category = await storage.getServiceCategory(task.categoryId);
      
      if (!client || !category) {
        return res.status(404).json({ message: "Task details not found" });
      }
      
      res.json({
        ...task,
        client: {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          profilePicture: client.profilePicture
        },
        category
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  
  app.put("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update a task" });
    }
    
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.clientId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own tasks" });
      }
      
      const updatedTask = await storage.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (err) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Service Requests routes
  app.post("/api/service-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a service request" });
    }
    
    try {
      // Get the service provider to ensure it exists
      const provider = await storage.getServiceProvider(req.body.providerId);
      if (!provider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      
      const requestData = insertServiceRequestSchema.parse({
        ...req.body,
        clientId: req.user.id
      });
      
      const serviceRequest = await storage.createServiceRequest(requestData);
      res.status(201).json(serviceRequest);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Failed to create service request" });
    }
  });
  
  app.get("/api/service-requests/client", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view your requests" });
    }
    
    try {
      const requests = await storage.getServiceRequestsByClient(req.user.id);
      
      // Enhance requests with provider info
      const requestsWithDetails = await Promise.all(
        requests.map(async (request) => {
          const providerWithDetails = await storage.getServiceProviderWithUser(request.providerId);
          
          if (!providerWithDetails) return null;
          
          return {
            ...request,
            provider: providerWithDetails
          };
        })
      );
      
      // Filter out null results
      res.json(requestsWithDetails.filter(r => r !== null));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch service requests" });
    }
  });
  
  app.get("/api/service-requests/provider", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view requests" });
    }
    
    try {
      // Get the provider profile for the current user
      const provider = await storage.getServiceProviderByUserId(req.user.id);
      
      if (!provider) {
        return res.status(404).json({ message: "Service provider profile not found" });
      }
      
      const requests = await storage.getServiceRequestsByProvider(provider.id);
      
      // Enhance requests with client info
      const requestsWithDetails = await Promise.all(
        requests.map(async (request) => {
          const client = await storage.getUser(request.clientId);
          
          if (!client) return null;
          
          return {
            ...request,
            client: {
              id: client.id,
              firstName: client.firstName,
              lastName: client.lastName,
              profilePicture: client.profilePicture
            }
          };
        })
      );
      
      // Filter out null results
      res.json(requestsWithDetails.filter(r => r !== null));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch service requests" });
    }
  });
  
  app.put("/api/service-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update a request" });
    }
    
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getServiceRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Get the provider profile for the current user
      const provider = await storage.getServiceProviderByUserId(req.user.id);
      
      // Check if user is either the client or the provider
      if (request.clientId !== req.user.id && (!provider || provider.id !== request.providerId)) {
        return res.status(403).json({ message: "You can only update your own requests" });
      }
      
      const updatedRequest = await storage.updateServiceRequest(requestId, req.body);
      res.json(updatedRequest);
    } catch (err) {
      res.status(500).json({ message: "Failed to update service request" });
    }
  });

  // Reviews routes
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a review" });
    }
    
    try {
      // Verify the service request exists and belongs to this user
      const request = await storage.getServiceRequest(req.body.serviceRequestId);
      
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      if (request.clientId !== req.user.id) {
        return res.status(403).json({ message: "You can only review your own service requests" });
      }
      
      // Only allow reviews for completed requests
      if (request.status !== "completed") {
        return res.status(400).json({ message: "You can only review completed service requests" });
      }
      
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        clientId: req.user.id,
        providerId: request.providerId
      });
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // File upload routes
  app.post("/api/upload/profile-picture", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to upload files" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    try {
      // Upload to S3
      const s3Url = await uploadToS3(req.file.buffer, req.file.originalname, 'profile', req.file.mimetype);
      // Update user profilePicture in DB
      await storage.updateUser(req.user.id, { profilePicture: s3Url });
      res.json({ url: s3Url });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.post("/api/upload/id-verification", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to upload files" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    try {
      // Upload to S3
      const s3Url = await uploadToS3(req.file.buffer, req.file.originalname, 'id', req.file.mimetype);
      // Update provider's idVerificationImage in DB
      const provider = await storage.getServiceProviderByUserId(req.user.id);
      if (provider) {
        await storage.updateServiceProvider(provider.id, { idVerificationImage: s3Url });
      }
      res.json({ url: s3Url });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
