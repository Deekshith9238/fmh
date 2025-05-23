import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for both clients and service providers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isServiceProvider: boolean("is_service_provider").notNull().default(false),
  profilePicture: text("profile_picture"),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
});

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  providerProfile: one(serviceProviders, {
    fields: [users.id],
    references: [serviceProviders.userId],
  }),
  clientTasks: many(tasks),
  clientServiceRequests: many(serviceRequests, { relationName: 'client' }),
  clientReviews: many(reviews, { relationName: 'client' }),
}));

// Service categories
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
});

// Service categories relations
export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  providers: many(serviceProviders),
  tasks: many(tasks),
}));

// Service provider profiles
export const serviceProviders = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  bio: text("bio"),
  hourlyRate: doublePrecision("hourly_rate").notNull(),
  yearsOfExperience: integer("years_of_experience"),
  availability: text("availability"),
  rating: doublePrecision("rating"),
  completedJobs: integer("completed_jobs").default(0),
});

// Service providers relations
export const serviceProvidersRelations = relations(serviceProviders, ({ one, many }) => ({
  user: one(users, {
    fields: [serviceProviders.userId],
    references: [users.id],
  }),
  category: one(serviceCategories, {
    fields: [serviceProviders.categoryId],
    references: [serviceCategories.id],
  }),
  serviceRequests: many(serviceRequests),
  reviews: many(reviews),
}));

// Tasks or job postings
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  budget: doublePrecision("budget"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Tasks relations
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  client: one(users, {
    fields: [tasks.clientId],
    references: [users.id],
  }),
  category: one(serviceCategories, {
    fields: [tasks.categoryId],
    references: [serviceCategories.id],
  }),
  serviceRequests: many(serviceRequests),
}));

// Service requests
export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id),
  providerId: integer("provider_id").notNull().references(() => serviceProviders.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service requests relations
export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  task: one(tasks, {
    fields: [serviceRequests.taskId],
    references: [tasks.id],
  }),
  provider: one(serviceProviders, {
    fields: [serviceRequests.providerId],
    references: [serviceProviders.id],
  }),
  client: one(users, {
    fields: [serviceRequests.clientId],
    references: [users.id],
    relationName: 'client',
  }),
  reviews: many(reviews),
}));

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  serviceRequestId: integer("service_request_id").notNull().references(() => serviceRequests.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  providerId: integer("provider_id").notNull().references(() => serviceProviders.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [reviews.serviceRequestId],
    references: [serviceRequests.id],
  }),
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
    relationName: 'client',
  }),
  provider: one(serviceProviders, {
    fields: [reviews.providerId],
    references: [serviceProviders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  completedJobs: true,
  rating: true
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;

export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Extended provider type with user info
export type ServiceProviderWithUser = ServiceProvider & {
  user: User;
  category: ServiceCategory;
};

// Extended task type with user and category info
export type TaskWithDetails = Task & {
  client: User;
  category: ServiceCategory;
};
