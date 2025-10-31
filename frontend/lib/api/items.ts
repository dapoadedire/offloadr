import apiClient, { extractData } from './client';
import { ApiResponse, MessageResponse } from '../types/auth';
import { PaginatedResponse } from '../types/user';
import {
  ItemWithDetails,
  SellerContact,
  CreateItemPayload,
  UpdateItemPayload,
  UpdateItemStatusPayload,
  MarkSoldPayload,
  ItemsFilterQuery,
} from '../types/item';

export const itemsApi = {
  // Browse and search
  getAll: async (filters?: ItemsFilterQuery) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/items?${queryString}` : '/items';

    const response = await apiClient.get<ApiResponse<PaginatedResponse<ItemWithDetails>>>(url);
    return extractData(response.data);
  },

  search: async (filters?: ItemsFilterQuery) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/items/search?${queryString}` : '/items/search';

    const response = await apiClient.get<ApiResponse<PaginatedResponse<ItemWithDetails>>>(url);
    return extractData(response.data);
  },

  getById: async (id: number): Promise<ItemWithDetails> => {
    const response = await apiClient.get<ApiResponse<ItemWithDetails>>(`/items/${id}`);
    return extractData(response.data);
  },

  getContact: async (id: number): Promise<SellerContact> => {
    const response = await apiClient.get<ApiResponse<SellerContact>>(`/items/${id}/contact`);
    return extractData(response.data);
  },

  getRelated: async (id: number): Promise<ItemWithDetails[]> => {
    const response = await apiClient.get<ApiResponse<ItemWithDetails[]>>(`/items/${id}/related`);
    return extractData(response.data);
  },

  // CRUD operations
  create: async (payload: CreateItemPayload): Promise<ItemWithDetails> => {
    const response = await apiClient.post<ApiResponse<ItemWithDetails>>('/items', payload);
    return extractData(response.data);
  },

  update: async (id: number, payload: UpdateItemPayload): Promise<ItemWithDetails> => {
    const response = await apiClient.patch<ApiResponse<ItemWithDetails>>(`/items/${id}`, payload);
    return extractData(response.data);
  },

  delete: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<ApiResponse<MessageResponse>>(`/items/${id}`);
    return extractData(response.data);
  },

  updateStatus: async (id: number, payload: UpdateItemStatusPayload): Promise<MessageResponse> => {
    const response = await apiClient.patch<ApiResponse<MessageResponse>>(
      `/items/${id}/status`,
      payload
    );
    return extractData(response.data);
  },

  markAsSold: async (id: number, payload?: MarkSoldPayload): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(
      `/items/${id}/mark-sold`,
      payload || {}
    );
    return extractData(response.data);
  },

  repost: async (id: number): Promise<ItemWithDetails> => {
    const response = await apiClient.post<ApiResponse<ItemWithDetails>>(`/items/${id}/repost`);
    return extractData(response.data);
  },
};
