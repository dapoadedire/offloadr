import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError, ApiResponse } from '../types/auth';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Extract data from the response wrapper
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;

      // Handle 401 - unauthorized (token expired or invalid)
      // Only clear auth if this was an authenticated request (had a token)
      if (error.response.status === 401 && error.config?.headers?.Authorization) {
        // Clear auth state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');

          // Notify user with a friendly message
          toast.error('Your session has expired. Please log in again.', {
            duration: 5000,
          });

          // Trigger a custom event that the app can listen to
          // This allows for graceful handling rather than hard redirect
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }

      // Return structured error
      return Promise.reject({
        status: error.response.status,
        message: errorData?.error || 'An error occurred',
        fields: errorData?.fields,
      });
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
      });
    } else {
      // Something else happened
      return Promise.reject({
        status: 0,
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
);

// Helper function to extract data from API response
export const extractData = <T>(response: ApiResponse<T>): T => {
  return response.data;
};

export default apiClient;
