// Request Payloads
export interface RegisterPayload {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  school_id: number;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  confirm_password: string;
}

// Response Types
export interface School {
  id: number;
  name: string;
  domain: string;
  location: string;
}

export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  email_verified: boolean;
  school_id: number;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

export interface UserWithMessageResponse {
  message: string;
  user: User;
}

// API Response Wrapper
export interface ApiResponse<T> {
  data: T;
}

// Error Response
export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}

// Error from API client (after interceptor processing)
export interface ApiClientError {
  status: number;
  message: string;
  fields?: Record<string, string>;
}
