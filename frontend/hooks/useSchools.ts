import { useQuery } from '@tanstack/react-query';
import { schoolsApi } from '@/lib/api/schools';

// Query Keys
export const schoolKeys = {
  all: ['schools'] as const,
  lists: () => [...schoolKeys.all, 'list'] as const,
  list: () => [...schoolKeys.lists()] as const,
  details: () => [...schoolKeys.all, 'detail'] as const,
  detail: (id: number) => [...schoolKeys.details(), id] as const,
};

// Get all schools
export const useSchools = () => {
  return useQuery({
    queryKey: schoolKeys.list(),
    queryFn: () => schoolsApi.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes (schools don't change often)
  });
};

// Get single school by ID
export const useSchool = (id: number) => {
  return useQuery({
    queryKey: schoolKeys.detail(id),
    queryFn: () => schoolsApi.getById(id),
    staleTime: 30 * 60 * 1000,
  });
};
