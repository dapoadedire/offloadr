"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { moderationApi } from "@/lib/api/moderation";
import {
  ModerationQueueFilter,
  TriggerScanPayload,
  SubmitReviewPayload,
  SubmitAppealPayload,
  ResolveAppealPayload,
} from "@/lib/types/moderation";
import { toast } from "sonner";

// Query Keys
export const moderationKeys = {
  all: ["moderation"] as const,
  queue: () => [...moderationKeys.all, "queue"] as const,
  queueFiltered: (filters: ModerationQueueFilter) =>
    [...moderationKeys.queue(), filters] as const,
  item: (itemId: number) => [...moderationKeys.all, "item", itemId] as const,
  analytics: () => [...moderationKeys.all, "analytics"] as const,
  analyticsFiltered: (params: {
    from_date?: string;
    to_date?: string;
    school_id?: number;
  }) => [...moderationKeys.analytics(), params] as const,
  trends: (schoolId?: number) =>
    [...moderationKeys.all, "trends", schoolId] as const,
  appeals: () => [...moderationKeys.all, "appeals"] as const,
  userAppeals: () => [...moderationKeys.appeals(), "user"] as const,
  pendingAppeals: () => [...moderationKeys.appeals(), "pending"] as const,
  appeal: (id: number) => [...moderationKeys.appeals(), id] as const,
};

// ===== Admin Hooks =====

// Get moderation queue
export const useModerationQueue = (filters?: ModerationQueueFilter) => {
  return useQuery({
    queryKey: moderationKeys.queueFiltered(filters || {}),
    queryFn: () => moderationApi.getQueue(filters),
    staleTime: 30 * 1000, // 30 seconds - queue changes frequently
  });
};

// Trigger scan for an item
export const useTriggerScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TriggerScanPayload) =>
      moderationApi.triggerScan(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: moderationKeys.item(variables.item_id),
      });
      queryClient.invalidateQueries({ queryKey: moderationKeys.queue() });

      if (data.scan_details.passed) {
        toast.success("Item passed moderation scan");
      } else {
        toast.warning(
          `Item flagged: ${data.scan_details.flags_count} issue(s) found`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to trigger scan");
    },
  });
};

// Get moderation result for an item
export const useItemModeration = (itemId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: moderationKeys.item(itemId),
    queryFn: () => moderationApi.getItemModeration(itemId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: options?.enabled ?? true,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 errors (no moderation result exists)
      const apiError = error as { status?: number };
      if (apiError?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Submit review decision
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resultId,
      payload,
    }: {
      resultId: number;
      payload: SubmitReviewPayload;
    }) => moderationApi.submitReview(resultId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.queue() });
      queryClient.invalidateQueries({
        queryKey: moderationKeys.item(data.item_id),
      });
      queryClient.invalidateQueries({ queryKey: moderationKeys.analytics() });

      toast.success(
        data.review_decision === "approved"
          ? "Item approved and published"
          : "Item rejected"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });
};

// Get moderation analytics
export const useModerationAnalytics = (params?: {
  from_date?: string;
  to_date?: string;
  school_id?: number;
}) => {
  return useQuery({
    queryKey: moderationKeys.analyticsFiltered(params || {}),
    queryFn: () => moderationApi.getAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get moderation trends
export const useModerationTrends = (schoolId?: number) => {
  return useQuery({
    queryKey: moderationKeys.trends(schoolId),
    queryFn: () => moderationApi.getTrends({ school_id: schoolId }),
    staleTime: 5 * 60 * 1000,
  });
};

// Get pending appeals (admin)
export const usePendingAppeals = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...moderationKeys.pendingAppeals(), params],
    queryFn: () => moderationApi.getPendingAppeals(params),
    staleTime: 30 * 1000,
  });
};

// Resolve appeal
export const useResolveAppeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appealId,
      payload,
    }: {
      appealId: number;
      payload: ResolveAppealPayload;
    }) => moderationApi.resolveAppeal(appealId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.appeals() });
      queryClient.invalidateQueries({ queryKey: moderationKeys.queue() });
      queryClient.invalidateQueries({ queryKey: moderationKeys.analytics() });

      toast.success(
        data.status === "approved"
          ? "Appeal approved - item will be published"
          : "Appeal denied"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resolve appeal");
    },
  });
};

// ===== User Hooks =====

// Submit appeal
export const useSubmitAppeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitAppealPayload) =>
      moderationApi.submitAppeal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.userAppeals() });
      toast.success("Appeal submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit appeal");
    },
  });
};

// Get user's appeals
export const useUserAppeals = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...moderationKeys.userAppeals(), params],
    queryFn: () => moderationApi.getUserAppeals(params),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Get single appeal
export const useAppeal = (appealId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: moderationKeys.appeal(appealId),
    queryFn: () => moderationApi.getAppeal(appealId),
    staleTime: 2 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};
