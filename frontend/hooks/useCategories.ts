import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories';

// Query Keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
  items: (id: number, page: number, limit: number) =>
    [...categoryKeys.all, 'items', id, page, limit] as const,
};

// Get all categories
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes (categories don't change often)
  });
};

// Get single category by ID
export const useCategory = (id: number) => {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoriesApi.getById(id),
    staleTime: 30 * 60 * 1000,
  });
};

// Get items by category
export const useCategoryItems = (categoryId: number, page = 1, limit = 20) => {
  return useQuery({
    queryKey: categoryKeys.items(categoryId, page, limit),
    queryFn: () => categoriesApi.getItems(categoryId, page, limit),
    staleTime: 5 * 60 * 1000,
  });
};
