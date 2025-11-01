import apiClient, { extractData } from "./client";
import type { Review, PaginatedResponse } from "@/lib/types/user";
import type { MessageResponse, ApiResponse } from "@/lib/types";

// Payload Types
export interface CreateReviewPayload {
  item_id: number;
  rating: number; // 1-5
  comment?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}

export const reviewsApi = {
  // Create review for item/seller
  create: async (payload: CreateReviewPayload): Promise<Review> => {
    const response = await apiClient.post<ApiResponse<Review>>(
      "/reviews",
      payload
    );
    return extractData(response.data);
  },

  // Get review details
  getById: async (id: number): Promise<Review> => {
    const response = await apiClient.get<ApiResponse<Review>>(`/reviews/${id}`);
    return extractData(response.data);
  },

  // Update own review
  update: async (id: number, payload: UpdateReviewPayload): Promise<Review> => {
    const response = await apiClient.patch<ApiResponse<Review>>(
      `/reviews/${id}`,
      payload
    );
    return extractData(response.data);
  },

  // Delete own review
  delete: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<ApiResponse<MessageResponse>>(
      `/reviews/${id}`
    );
    return extractData(response.data);
  },

  // Get reviews for specific item
  getItemReviews: async (itemId: number): Promise<Review[]> => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Review>>
    >(`/items/${itemId}/reviews`);
    const paginatedData = extractData(response.data);
    return paginatedData.data;
  },
};
