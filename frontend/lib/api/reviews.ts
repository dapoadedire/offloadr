import apiClient from "./client";
import type { Review } from "@/lib/types/user";
import type { MessageResponse } from "@/lib/types";

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
    const response = await apiClient.post<Review>("/reviews", payload);
    return response.data;
  },

  // Get review details
  getById: async (id: number): Promise<Review> => {
    const response = await apiClient.get<Review>(`/reviews/${id}`);
    return response.data;
  },

  // Update own review
  update: async (id: number, payload: UpdateReviewPayload): Promise<Review> => {
    const response = await apiClient.patch<Review>(`/reviews/${id}`, payload);
    return response.data;
  },

  // Delete own review
  delete: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/reviews/${id}`);
    return response.data;
  },

  // Get reviews for specific item
  getItemReviews: async (itemId: number): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`/items/${itemId}/reviews`);
    return response.data;
  },
};
