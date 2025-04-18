import { 
  users, type User, type InsertUser,
  serviceCategories, type ServiceCategory, type InsertServiceCategory,
  serviceProviders, type ServiceProvider, type InsertServiceProvider,
  tasks, type Task, type InsertTask,
  serviceRequests, type ServiceRequest, type InsertServiceRequest,
  reviews, type Review, type InsertReview
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Service Category methods
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  
  // Service Provider methods
  createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider>;
  getServiceProvider(id: number): Promise<ServiceProvider | undefined>;
  getServiceProviderByUserId(userId: number): Promise<ServiceProvider | undefined>;
  getServiceProviders(): Promise<ServiceProvider[]>;
  getServiceProvidersByCategory(categoryId: number): Promise<ServiceProvider[]>;
  getServiceProviderWithUser(id: number): Promise<any | undefined>;
  updateServiceProvider(id: number, provider: Partial<ServiceProvider>): Promise<ServiceProvider | undefined>;
  
  // Task methods
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  getTasks(): Promise<Task[]>;
  getTasksByClient(clientId: number): Promise<Task[]>;
  getTasksByCategory(categoryId: number): Promise<Task[]>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Service Request methods
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  getServiceRequest(id: number): Promise<ServiceRequest | undefined>;
  getServiceRequestsByProvider(providerId: number): Promise<ServiceRequest[]>;
  getServiceRequestsByClient(clientId: number): Promise<ServiceRequest[]>;
  updateServiceRequest(id: number, request: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProvider(providerId: number): Promise<Review[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private serviceCategories: Map<number, ServiceCategory>;
  private serviceProviders: Map<number, ServiceProvider>;
  private tasks: Map<number, Task>;
  private serviceRequests: Map<number, ServiceRequest>;
  private reviews: Map<number, Review>;
  
  sessionStore: session.Store;
  currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.serviceCategories = new Map();
    this.serviceProviders = new Map();
    this.tasks = new Map();
    this.serviceRequests = new Map();
    this.reviews = new Map();
    
    this.currentId = {
      users: 1,
      serviceCategories: 1,
      serviceProviders: 1,
      tasks: 1,
      serviceRequests: 1,
      reviews: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some service categories
    this.initializeServiceCategories();
  }

  // Initialize service categories
  private async initializeServiceCategories() {
    const categories = [
      { name: "Home Cleaning", description: "House cleaning services", icon: "broom" },
      { name: "Handyman", description: "General home repairs and maintenance", icon: "tools" },
      { name: "Moving Help", description: "Help with moving and lifting items", icon: "truck" },
      { name: "Tech Support", description: "Technical support for computers and devices", icon: "laptop-code" },
      { name: "Painting", description: "Interior and exterior painting services", icon: "paint-roller" },
      { name: "Lawn Care", description: "Lawn mowing and garden maintenance", icon: "leaf" }
    ];
    
    for (const category of categories) {
      await this.createServiceCategory(category);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Service Category methods
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return Array.from(this.serviceCategories.values());
  }
  
  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    return this.serviceCategories.get(id);
  }
  
  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const id = this.currentId.serviceCategories++;
    const newCategory: ServiceCategory = { ...category, id };
    this.serviceCategories.set(id, newCategory);
    return newCategory;
  }

  // Service Provider methods
  async createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider> {
    const id = this.currentId.serviceProviders++;
    const newProvider: ServiceProvider = { 
      ...provider, 
      id, 
      rating: 0, 
      completedJobs: 0 
    };
    this.serviceProviders.set(id, newProvider);
    return newProvider;
  }
  
  async getServiceProvider(id: number): Promise<ServiceProvider | undefined> {
    return this.serviceProviders.get(id);
  }
  
  async getServiceProviderByUserId(userId: number): Promise<ServiceProvider | undefined> {
    return Array.from(this.serviceProviders.values()).find(
      (provider) => provider.userId === userId
    );
  }
  
  async getServiceProviders(): Promise<ServiceProvider[]> {
    return Array.from(this.serviceProviders.values());
  }
  
  async getServiceProvidersByCategory(categoryId: number): Promise<ServiceProvider[]> {
    return Array.from(this.serviceProviders.values()).filter(
      (provider) => provider.categoryId === categoryId
    );
  }
  
  async getServiceProviderWithUser(id: number): Promise<any | undefined> {
    const provider = await this.getServiceProvider(id);
    if (!provider) return undefined;
    
    const user = await this.getUser(provider.userId);
    const category = await this.getServiceCategory(provider.categoryId);
    
    if (!user || !category) return undefined;
    
    return {
      ...provider,
      user,
      category
    };
  }
  
  async updateServiceProvider(id: number, providerData: Partial<ServiceProvider>): Promise<ServiceProvider | undefined> {
    const provider = await this.getServiceProvider(id);
    if (!provider) return undefined;
    
    const updatedProvider = { ...provider, ...providerData };
    this.serviceProviders.set(id, updatedProvider);
    return updatedProvider;
  }

  // Task methods
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.currentId.tasks++;
    const createdAt = new Date();
    const newTask: Task = { ...task, id, createdAt, completedAt: null };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }
  
  async getTasksByClient(clientId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.clientId === clientId
    );
  }
  
  async getTasksByCategory(categoryId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.categoryId === categoryId
    );
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Service Request methods
  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const id = this.currentId.serviceRequests++;
    const createdAt = new Date();
    const newRequest: ServiceRequest = { ...request, id, createdAt };
    this.serviceRequests.set(id, newRequest);
    return newRequest;
  }
  
  async getServiceRequest(id: number): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.get(id);
  }
  
  async getServiceRequestsByProvider(providerId: number): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(
      (request) => request.providerId === providerId
    );
  }
  
  async getServiceRequestsByClient(clientId: number): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(
      (request) => request.clientId === clientId
    );
  }
  
  async updateServiceRequest(id: number, requestData: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const request = await this.getServiceRequest(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...requestData };
    this.serviceRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Review methods
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.currentId.reviews++;
    const createdAt = new Date();
    const newReview: Review = { ...review, id, createdAt };
    this.reviews.set(id, newReview);
    
    // Update service provider rating
    const providerReviews = await this.getReviewsByProvider(review.providerId);
    const provider = await this.getServiceProvider(review.providerId);
    
    if (provider) {
      const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0) + review.rating;
      const newRating = totalRating / (providerReviews.length + 1);
      
      await this.updateServiceProvider(review.providerId, {
        rating: parseFloat(newRating.toFixed(1))
      });
    }
    
    return newReview;
  }
  
  async getReviewsByProvider(providerId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.providerId === providerId
    );
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Set up PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
    
    // Initialize sample service categories
    this.initializeServiceCategories();
  }
  
  private async initializeServiceCategories() {
    // Add some default service categories if none exist
    const categories = await db.select().from(serviceCategories);
    
    if (categories.length === 0) {
      await Promise.all([
        db.insert(serviceCategories).values({ 
          name: "Home Cleaning", 
          description: "House cleaning, carpet cleaning, and other home cleaning services",
          icon: "Trash2"
        }),
        
        db.insert(serviceCategories).values({ 
          name: "Handyman", 
          description: "General home repairs, furniture assembly, and other handyman services",
          icon: "Hammer"
        }),
        
        db.insert(serviceCategories).values({ 
          name: "Lawn Care", 
          description: "Lawn mowing, gardening, landscaping, and other yard work",
          icon: "Scissors"
        }),
        
        db.insert(serviceCategories).values({ 
          name: "Tutoring", 
          description: "Academic tutoring, test preparation, and other educational services",
          icon: "BookOpen"
        }),
        
        db.insert(serviceCategories).values({ 
          name: "Pet Care", 
          description: "Pet sitting, dog walking, grooming, and other pet services",
          icon: "Paw"
        })
      ]);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return db.select().from(serviceCategories);
  }

  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    return category;
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const [newCategory] = await db.insert(serviceCategories).values(category).returning();
    return newCategory;
  }

  async createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider> {
    const [newProvider] = await db.insert(serviceProviders).values({
      ...provider,
      rating: 0,
      completedJobs: 0
    }).returning();
    
    return newProvider;
  }

  async getServiceProvider(id: number): Promise<ServiceProvider | undefined> {
    const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
    return provider;
  }

  async getServiceProviderByUserId(userId: number): Promise<ServiceProvider | undefined> {
    const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.userId, userId));
    return provider;
  }

  async getServiceProviders(): Promise<ServiceProvider[]> {
    return db.select().from(serviceProviders);
  }

  async getServiceProvidersByCategory(categoryId: number): Promise<ServiceProvider[]> {
    return db.select().from(serviceProviders).where(eq(serviceProviders.categoryId, categoryId));
  }

  async getServiceProviderWithUser(id: number): Promise<any | undefined> {
    const provider = await this.getServiceProvider(id);
    
    if (!provider) {
      return undefined;
    }
    
    const user = await this.getUser(provider.userId);
    const category = await this.getServiceCategory(provider.categoryId);
    
    if (!user || !category) {
      return undefined;
    }
    
    return {
      ...provider,
      user,
      category
    };
  }

  async updateServiceProvider(id: number, providerData: Partial<ServiceProvider>): Promise<ServiceProvider | undefined> {
    const [provider] = await db.update(serviceProviders)
      .set(providerData)
      .where(eq(serviceProviders.id, id))
      .returning();
    
    return provider;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasks(): Promise<Task[]> {
    return db.select().from(tasks);
  }

  async getTasksByClient(clientId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.clientId, clientId));
  }

  async getTasksByCategory(categoryId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.categoryId, categoryId));
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    
    return task;
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [newRequest] = await db.insert(serviceRequests).values(request).returning();
    return newRequest;
  }

  async getServiceRequest(id: number): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return request;
  }

  async getServiceRequestsByProvider(providerId: number): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests).where(eq(serviceRequests.providerId, providerId));
  }

  async getServiceRequestsByClient(clientId: number): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests).where(eq(serviceRequests.clientId, clientId));
  }

  async updateServiceRequest(id: number, requestData: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const [request] = await db.update(serviceRequests)
      .set(requestData)
      .where(eq(serviceRequests.id, id))
      .returning();
    
    return request;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update service provider rating
    const providerReviews = await this.getReviewsByProvider(review.providerId);
    const provider = await this.getServiceProvider(review.providerId);
    
    if (provider) {
      const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0) + review.rating;
      const newRating = totalRating / (providerReviews.length + 1);
      
      await this.updateServiceProvider(review.providerId, {
        rating: parseFloat(newRating.toFixed(1))
      });
    }
    
    return newReview;
  }

  async getReviewsByProvider(providerId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.providerId, providerId));
  }
}

export const storage = new DatabaseStorage();
