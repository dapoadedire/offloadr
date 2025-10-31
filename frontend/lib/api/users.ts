import apiClient, { extractData } from './client';
import { ApiResponse, MessageResponse } from '../types/auth';
import {
  UserProfile,
  PublicUserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
  DeactivateAccountPayload,
  DeleteAccountPayload,
  UserRating,
  PaginatedResponse,
  Review,
} from '../types/user';
import { Item } from '../types/item';

export const usersApi = {
  // Current User endpoints
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
    return extractData(response.data);
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const response = await apiClient.patch<ApiResponse<UserProfile>>('/users/me', payload);
    return extractData(response.data);
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<MessageResponse> => {
    const response = await apiClient.patch<ApiResponse<MessageResponse>>(
      '/users/me/password',
      payload
    );
    return extractData(response.data);
  },

  deactivateAccount: async (payload: DeactivateAccountPayload): Promise<MessageResponse> => {
    const response = await apiClient.delete<ApiResponse<MessageResponse>>('/users/me', {
      data: payload,
    });
    return extractData(response.data);
  },

  deleteAccountPermanently: async (payload: DeleteAccountPayload): Promise<MessageResponse> => {
    const response = await apiClient.delete<ApiResponse<MessageResponse>>(
      '/users/me/permanent',
      {
        data: payload,
      }
    );
    return extractData(response.data);
  },

  getCurrentUserItems: async (page = 1, limit = 20) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Item>>>(
      `/users/me/items?page=${page}&limit=${limit}`
    );
    return extractData(response.data);
  },

  getCurrentUserSoldItems: async (page = 1, limit = 20) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Item>>>(
      `/users/me/items/sold?page=${page}&limit=${limit}`
    );
    return extractData(response.data);
  },

  // Public User endpoints
  getUserById: async (id: number): Promise<PublicUserProfile> => {
    const response = await apiClient.get<ApiResponse<PublicUserProfile>>(`/users/${id}`);
    return extractData(response.data);
  },

  getUserItems: async (id: number, page = 1, limit = 20) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Item>>>(
      `/users/${id}/items?page=${page}&limit=${limit}`
    );
    return extractData(response.data);
  },

  getUserReviews: async (id: number, page = 1, limit = 20) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Review>>>(
      `/users/${id}/reviews?page=${page}&limit=${limit}`
    );
    return extractData(response.data);
  },

  getUserRating: async (id: number): Promise<UserRating> => {
    const response = await apiClient.get<ApiResponse<UserRating>>(`/users/${id}/rating`);
    return extractData(response.data);
  },
};
