import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';
import type { CreateReportPayload } from '@/lib/types/report';
import { ApiClientError } from '@/lib/types';
import { toast } from 'sonner';

// Query Keys
export const reportKeys = {
  all: ['reports'] as const,
  userReports: () => [...reportKeys.all, 'user'] as const,
};

// Get user's submitted reports
export const useUserReports = () => {
  return useQuery({
    queryKey: reportKeys.userReports(),
    queryFn: () => reportsApi.getUserReports(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create report
export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReportPayload) => reportsApi.create(payload),
    onSuccess: () => {
      // Invalidate user reports
      queryClient.invalidateQueries({ queryKey: reportKeys.userReports() });

      toast.success('Report submitted successfully. We will review it shortly.');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to submit report';
      toast.error(message);

      if (error.fields) {
        Object.entries(error.fields).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      }
    },
  });
};
