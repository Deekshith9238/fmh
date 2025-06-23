// User types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
  firebaseUid?: string;
  createdAt: string;
  updatedAt: string;
}

// Service category types
export interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
}

// Service provider types
export interface ServiceProvider {
  id: number;
  userId: number;
  categoryId: number;
  hourlyRate: number;
  bio?: string;
  yearsOfExperience?: number;
  availability?: string;
  rating: number;
  completedJobs: number;
  isVerified: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  idVerificationImage?: string;
  adminNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: number;
  user?: User;
  category?: ServiceCategory;
}

// Task types
export interface Task {
  id: number;
  clientId: number;
  categoryId: number;
  title: string;
  description: string;
  location: string;
  budget: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  client?: User;
  category?: ServiceCategory;
}

// Service request types
export interface ServiceRequest {
  id: number;
  clientId: number;
  providerId: number;
  taskId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  proposedPrice: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
  client?: User;
  provider?: ServiceProvider;
  task?: Task;
}

// Review types
export interface Review {
  id: number;
  clientId: number;
  providerId: number;
  serviceRequestId: number;
  rating: number;
  comment: string;
  createdAt: string;
  client?: User;
  provider?: ServiceProvider;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isServiceProvider: boolean;
  categoryId?: number;
  hourlyRate?: number;
  bio?: string;
  yearsOfExperience?: number;
  availability?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProviderDetails: { providerId: number };
  TaskDetails: { taskId: number };
  CreateTask: undefined;
  Profile: undefined;
  Admin: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Tasks: undefined;
  Profile: undefined;
  Admin: undefined;
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
} 