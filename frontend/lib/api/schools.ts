import apiClient, { extractData } from './client';
import { ApiResponse } from '../types/auth';

export interface School {
  id: number;
  name: string;
  domain: string;
  location: string;
  is_active: boolean;
  created_at: string;
}

export const schoolsApi = {
  // GET /schools
  list: async (): Promise<School[]> => {
    const response = await apiClient.get<ApiResponse<School[]>>('/schools');
    return extractData(response.data);
  },

  // GET /schools/{id}
  getById: async (id: number): Promise<School> => {
    const response = await apiClient.get<ApiResponse<School>>(`/schools/${id}`);
    return extractData(response.data);
  },
};
