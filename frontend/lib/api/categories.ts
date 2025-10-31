import apiClient, { extractData } from './client';
import { ApiResponse } from '../types/auth';
import { Category } from '../types/category';
import { PaginatedResponse } from '../types/user';
import { ItemWithDetails } from '../types/item';

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return extractData(response.data);
  },

  getById: async (id: number): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return extractData(response.data);
  },

  getItems: async (categoryId: number, page = 1, limit = 20) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ItemWithDetails>>>(
      `/categories/${categoryId}/items?page=${page}&limit=${limit}`
    );
    return extractData(response.data);
  },
};
