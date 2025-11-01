import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  reviewsApi,
  CreateReviewPayload,
  UpdateReviewPayload,
} from "@/lib/api/reviews";
import { ApiClientError } from "@/lib/types";
import { toast } from "sonner";

// Query Keys
export const reviewKeys = {
  all: ["reviews"] as const,
  details: () => [...reviewKeys.all, "detail"] as const,
  detail: (id: number) => [...reviewKeys.details(), id] as const,
  itemReviews: (itemId: number) => [...reviewKeys.all, "item", itemId] as const,
};

// Get review by ID
export const useReview = (id: number) => {
  return useQuery({
    queryKey: reviewKeys.detail(id),
    queryFn: () => reviewsApi.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get reviews for an item
export const useItemReviews = (
  itemId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: reviewKeys.itemReviews(itemId),
    queryFn: () => reviewsApi.getItemReviews(itemId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: options?.enabled ?? true,
  });
};

// Create review
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsApi.create(payload),
    onSuccess: (data, variables) => {
      // Invalidate item reviews
      queryClient.invalidateQueries({
        queryKey: reviewKeys.itemReviews(variables.item_id),
      });

      // Invalidate user ratings (will need to create these keys when we implement user hooks)
      queryClient.invalidateQueries({ queryKey: ["users"] });

      toast.success("Review submitted successfully!");
    },
    onError: (error: ApiClientError) => {
      const message = error.message || "Failed to submit review";
      toast.error(message);

      if (error.fields) {
        Object.entries(error.fields).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      }
    },
  });
};

// Update review
export const useUpdateReview = (reviewId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateReviewPayload) =>
      reviewsApi.update(reviewId, payload),
    onSuccess: (data) => {
      // Update cache for this specific review
      queryClient.setQueryData(reviewKeys.detail(reviewId), data);

      // Invalidate item reviews
      queryClient.invalidateQueries({
        queryKey: reviewKeys.itemReviews(data.item_id),
      });

      // Invalidate user ratings
      queryClient.invalidateQueries({ queryKey: ["users"] });

      toast.success("Review updated successfully!");
    },
    onError: (error: ApiClientError) => {
      const message = error.message || "Failed to update review";
      toast.error(message);

      if (error.fields) {
        Object.entries(error.fields).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      }
    },
  });
};

// Delete review
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
    onSuccess: (data, reviewId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: reviewKeys.detail(reviewId) });

      // Invalidate all reviews (we don't know which item it belongs to)
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });

      // Invalidate user ratings
      queryClient.invalidateQueries({ queryKey: ["users"] });

      toast.success(data.message || "Review deleted successfully!");
    },
    onError: (error: ApiClientError) => {
      const message = error.message || "Failed to delete review";
      toast.error(message);
    },
  });
};
