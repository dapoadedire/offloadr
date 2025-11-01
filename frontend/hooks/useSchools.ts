import { useQuery } from "@tanstack/react-query";
import { schoolsApi } from "@/lib/api/schools";
import { ApiClientError } from "@/lib/types";

// Query Keys
export const schoolKeys = {
  all: ["schools"] as const,
  lists: () => [...schoolKeys.all, "list"] as const,
  list: () => [...schoolKeys.lists()] as const,
  details: () => [...schoolKeys.all, "detail"] as const,
  detail: (id: number) => [...schoolKeys.details(), id] as const,
};

// Get all schools
export const useSchools = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: schoolKeys.list(),
    queryFn: () => schoolsApi.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes (schools don't change often)
    enabled: options?.enabled ?? true,
  });
};

// Get single school by ID
export const useSchool = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: schoolKeys.detail(id),
    queryFn: () => schoolsApi.getById(id),
    staleTime: 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 errors
      if ((error as ApiClientError)?.status === 404) return false;
      return failureCount < 3;
    },
  });
};
