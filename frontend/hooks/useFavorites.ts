import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi, AddFavoritePayload } from '@/lib/api/favorites';
import { ApiClientError } from '@/lib/types';
import { toast } from 'sonner';

// Query Keys
export const favoriteKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoriteKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...favoriteKeys.lists(), page, limit] as const,
  check: (itemId: number) => [...favoriteKeys.all, 'check', itemId] as const,
};

// Get user's favorited items
export const useFavorites = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: favoriteKeys.list(page, limit),
    queryFn: () => favoritesApi.getUserFavorites(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Check if item is favorited
export const useCheckFavorite = (itemId: number) => {
  return useQuery({
    queryKey: favoriteKeys.check(itemId),
    queryFn: () => favoritesApi.checkFavorite(itemId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Add item to favorites
export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddFavoritePayload) => favoritesApi.add(payload),
    onSuccess: (data, variables) => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });

      // Update check favorite cache
      queryClient.setQueryData(favoriteKeys.check(variables.item_id), true);

      toast.success('Added to favorites!');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to add to favorites';
      toast.error(message);
    },
  });
};

// Remove item from favorites
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => favoritesApi.remove(itemId),
    onSuccess: (data, itemId) => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });

      // Update check favorite cache
      queryClient.setQueryData(favoriteKeys.check(itemId), false);

      toast.success('Removed from favorites');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to remove from favorites';
      toast.error(message);
    },
  });
};

// Toggle favorite (add or remove)
export const useToggleFavorite = () => {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  return {
    toggle: (itemId: number, isFavorited: boolean) => {
      if (isFavorited) {
        removeFavorite.mutate(itemId);
      } else {
        addFavorite.mutate({ item_id: itemId });
      }
    },
    isPending: addFavorite.isPending || removeFavorite.isPending,
  };
};
