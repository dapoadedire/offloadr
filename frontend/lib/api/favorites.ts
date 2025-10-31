import apiClient, { extractData } from './client';
import { ApiResponse, MessageResponse } from '../types/auth';
import { PaginatedResponse } from '../types/user';
import { ItemWithDetails } from '../types/item';

export interface AddFavoritePayload {
  item_id: number;
}

export interface Favorite {
  id: number;
  user_id: number;
  item_id: number;
  created_at: string;
}

export interface CheckFavoriteResponse {
  is_favorited: boolean;
}

export const favoritesApi = {
  // Get user's favorited items
  getUserFavorites: async (page = 1, limit = 20) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ItemWithDetails>>>(
      `/favorites?page=${page}&limit=${limit}`
    );
    return extractData(response.data);
  },

  // Add item to favorites
  add: async (payload: AddFavoritePayload): Promise<Favorite> => {
    const response = await apiClient.post<ApiResponse<Favorite>>('/favorites', payload);
    return extractData(response.data);
  },

  // Remove item from favorites
  remove: async (itemId: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<ApiResponse<MessageResponse>>(`/favorites/${itemId}`);
    return extractData(response.data);
  },

  // Check if item is favorited
  checkFavorite: async (itemId: number): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<CheckFavoriteResponse>>(
      `/favorites/check/${itemId}`
    );
    const data = extractData(response.data);
    return data.is_favorited;
  },
};
