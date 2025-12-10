import apiClient, { extractData } from './client';
import {
  RegisterPayload,
  LoginPayload,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthResponse,
  MessageResponse,
  UserWithMessageResponse,
  UsernameAvailabilityResponse,
  ApiResponse,
} from '../types/auth';

export const authApi = {
  // POST /auth/register
  register: async (payload: RegisterPayload): Promise<UserWithMessageResponse> => {
    const response = await apiClient.post<ApiResponse<UserWithMessageResponse>>(
      '/auth/register',
      payload
    );
    return extractData(response.data);
  },

  // PUT /auth/verify-email/{token}
  verifyEmail: async (token: string): Promise<MessageResponse> => {
    const response = await apiClient.put<ApiResponse<MessageResponse>>(
      `/auth/verify-email/${token}`
    );
    return extractData(response.data);
  },

  // POST /auth/resend-verification
  resendVerification: async (payload: ResendVerificationPayload): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(
      '/auth/resend-verification',
      payload
    );
    return extractData(response.data);
  },

  // POST /auth/login
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      payload
    );
    return extractData(response.data);
  },

  // POST /auth/forgot-password
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(
      '/auth/forgot-password',
      payload
    );
    return extractData(response.data);
  },

  // POST /auth/reset-password
  resetPassword: async (payload: ResetPasswordPayload): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(
      '/auth/reset-password',
      payload
    );
    return extractData(response.data);
  },

  // GET /auth/check-username/{username}
  checkUsernameAvailability: async (username: string): Promise<UsernameAvailabilityResponse> => {
    const response = await apiClient.get<ApiResponse<UsernameAvailabilityResponse>>(
      `/auth/check-username/${encodeURIComponent(username)}`
    );
    return extractData(response.data);
  },

  // Logout (client-side only)
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },
};
