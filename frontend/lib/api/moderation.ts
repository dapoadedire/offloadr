import apiClient, { extractData } from './client';
import { ApiResponse } from '../types/auth';
import {
  ModerationResult,
  ModerationResultWithDetails,
  ModerationAppeal,
  ModerationAppealWithDetails,
  ModerationAnalyticsResponse,
  ModerationTrendsResponse,
  ScanResultResponse,
  TriggerScanPayload,
  SubmitReviewPayload,
  SubmitAppealPayload,
  ResolveAppealPayload,
  ModerationQueueFilter,
  PaginatedModerationResults,
  PaginatedAppeals,
  ImageModeration,
} from '../types/moderation';

export const moderationApi = {
  // ===== Admin Endpoints =====

  // Trigger a moderation scan for an item
  triggerScan: async (payload: TriggerScanPayload): Promise<ScanResultResponse> => {
    const response = await apiClient.post<ApiResponse<ScanResultResponse>>(
      '/moderation/scan',
      payload
    );
    return extractData(response.data);
  },

  // Get moderation queue (pending/flagged items)
  getQueue: async (filters?: ModerationQueueFilter): Promise<PaginatedModerationResults> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/moderation/queue?${queryString}` : '/moderation/queue';

    const response = await apiClient.get<ApiResponse<PaginatedModerationResults>>(url);
    return extractData(response.data);
  },

  // Get moderation result for an item
  getItemModeration: async (
    itemId: number
  ): Promise<{ moderation_result: ModerationResult; image_results: ImageModeration[] }> => {
    const response = await apiClient.get<
      ApiResponse<{ moderation_result: ModerationResult; image_results: ImageModeration[] }>
    >(`/moderation/item/${itemId}`);
    return extractData(response.data);
  },

  // Submit review decision for a moderation result
  submitReview: async (
    resultId: number,
    payload: SubmitReviewPayload
  ): Promise<ModerationResult> => {
    const response = await apiClient.patch<ApiResponse<ModerationResult>>(
      `/moderation/item/${resultId}/review`,
      payload
    );
    return extractData(response.data);
  },

  // Get moderation analytics
  getAnalytics: async (params?: {
    from_date?: string;
    to_date?: string;
    school_id?: number;
  }): Promise<ModerationAnalyticsResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/moderation/analytics?${queryString}` : '/moderation/analytics';

    const response = await apiClient.get<ApiResponse<ModerationAnalyticsResponse>>(url);
    return extractData(response.data);
  },

  // Get moderation trends
  getTrends: async (params?: { school_id?: number }): Promise<ModerationTrendsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.school_id) {
      searchParams.append('school_id', params.school_id.toString());
    }
    const queryString = searchParams.toString();
    const url = queryString
      ? `/moderation/analytics/trends?${queryString}`
      : '/moderation/analytics/trends';

    const response = await apiClient.get<ApiResponse<ModerationTrendsResponse>>(url);
    return extractData(response.data);
  },

  // Get pending appeals (admin)
  getPendingAppeals: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedAppeals> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString
      ? `/moderation/appeals/pending?${queryString}`
      : '/moderation/appeals/pending';

    const response = await apiClient.get<ApiResponse<PaginatedAppeals>>(url);
    return extractData(response.data);
  },

  // Resolve an appeal (admin)
  resolveAppeal: async (
    appealId: number,
    payload: ResolveAppealPayload
  ): Promise<ModerationAppeal> => {
    const response = await apiClient.patch<ApiResponse<ModerationAppeal>>(
      `/moderation/appeals/${appealId}/resolve`,
      payload
    );
    return extractData(response.data);
  },

  // ===== User Endpoints =====

  // Submit an appeal
  submitAppeal: async (payload: SubmitAppealPayload): Promise<ModerationAppeal> => {
    const response = await apiClient.post<ApiResponse<ModerationAppeal>>(
      '/moderation/appeals',
      payload
    );
    return extractData(response.data);
  },

  // Get user's appeals
  getUserAppeals: async (params?: { page?: number; limit?: number }): Promise<PaginatedAppeals> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/moderation/appeals?${queryString}` : '/moderation/appeals';

    const response = await apiClient.get<ApiResponse<PaginatedAppeals>>(url);
    return extractData(response.data);
  },

  // Get appeal by ID
  getAppeal: async (appealId: number): Promise<ModerationAppeal> => {
    const response = await apiClient.get<ApiResponse<ModerationAppeal>>(
      `/moderation/appeals/${appealId}`
    );
    return extractData(response.data);
  },
};
