import axios from 'axios';
import { auth } from './firebase';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Replace with your actual EC2 IP
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/login', { email, password }),
  
  register: (userData: any) => 
    api.post('/register', userData),
  
  firebaseAuth: (idToken: string) => 
    api.post('/auth/firebase', {}, { 
      headers: { Authorization: `Bearer ${idToken}` } 
    }),
  
  getCurrentUser: () => 
    api.get('/user'),
  
  updateUser: (userData: any) => 
    api.put('/user', userData),
};

// Service categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: number) => api.get(`/categories/${id}`),
};

// Service providers
export const providersAPI = {
  getAll: () => api.get('/providers'),
  getByCategory: (categoryId: number) => api.get(`/providers/category/${categoryId}`),
  getById: (id: number) => api.get(`/providers/${id}`),
  create: (providerData: any) => api.post('/providers', providerData),
  update: (id: number, providerData: any) => api.put(`/providers/${id}`, providerData),
  getCurrentUserProvider: () => api.get('/user/provider'),
};

// Tasks
export const tasksAPI = {
  create: (taskData: any) => api.post('/tasks', taskData),
  getAll: () => api.get('/tasks'),
  getByClient: () => api.get('/tasks/client'),
  getById: (id: number) => api.get(`/tasks/${id}`),
  update: (id: number, taskData: any) => api.put(`/tasks/${id}`, taskData),
};

// Service requests
export const serviceRequestsAPI = {
  create: (requestData: any) => api.post('/service-requests', requestData),
  getByClient: () => api.get('/service-requests/client'),
  getByProvider: () => api.get('/service-requests/provider'),
  update: (id: number, requestData: any) => api.put(`/service-requests/${id}`, requestData),
};

// Reviews
export const reviewsAPI = {
  create: (reviewData: any) => api.post('/reviews', reviewData),
};

// File uploads
export const uploadAPI = {
  profilePicture: (formData: FormData) => 
    api.post('/upload/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  idVerification: (formData: FormData) => 
    api.post('/upload/id-verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Admin endpoints
export const adminAPI = {
  getPendingProviders: () => api.get('/admin/pending-providers'),
  approveProvider: (id: number, adminNotes?: string) => 
    api.post(`/admin/providers/${id}/approve`, { adminNotes }),
  rejectProvider: (id: number, adminNotes: string) => 
    api.post(`/admin/providers/${id}/reject`, { adminNotes }),
};

export default api; 