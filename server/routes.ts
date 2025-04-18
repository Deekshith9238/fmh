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

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

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
      
      // Fetch user and category info for each provider
      const providersWithDetails = await Promise.all(
        providers.map(async (provider) => {
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
      
      // Fetch user info for each provider
      const providersWithDetails = await Promise.all(
        providers.map(async (provider) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
