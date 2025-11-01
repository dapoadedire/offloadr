import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { ApiClientError } from "@/lib/types";

// Query Keys
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
  items: (id: number, page: number, limit: number) =>
    [...categoryKeys.all, "items", id, page, limit] as const,
};

// Get all categories
export const useCategories = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes (categories don't change often)
    enabled: options?.enabled ?? true,
  });
};

// Get single category by ID
export const useCategory = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoriesApi.getById(id),
    staleTime: 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 errors
      if ((error as ApiClientError)?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Get items by category
export const useCategoryItems = (
  categoryId: number,
  page = 1,
  limit = 20,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: categoryKeys.items(categoryId, page, limit),
    queryFn: () => categoriesApi.getItems(categoryId, page, limit),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};
