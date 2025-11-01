import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { itemsApi } from '@/lib/api/items';
import {
  CreateItemPayload,
  UpdateItemPayload,
  UpdateItemStatusPayload,
  MarkSoldPayload,
  ItemsFilterQuery,
  ApiClientError,
} from '@/lib/types';
import { toast } from 'sonner';

// Query Keys
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: ItemsFilterQuery) => [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: number) => [...itemKeys.details(), id] as const,
  contact: (id: number) => [...itemKeys.all, 'contact', id] as const,
  related: (id: number) => [...itemKeys.all, 'related', id] as const,
};

// Get all items with filters
export const useItems = (filters?: ItemsFilterQuery) => {
  return useQuery({
    queryKey: itemKeys.list(filters || {}),
    queryFn: () => itemsApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Search items
export const useSearchItems = (filters?: ItemsFilterQuery) => {
  return useQuery({
    queryKey: ['items', 'search', filters],
    queryFn: () => itemsApi.search(filters),
    enabled: !!filters?.search, // Only run if there's a search query
    staleTime: 2 * 60 * 1000,
  });
};

// Get single item by ID
export const useItem = (id: number) => {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemsApi.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get seller contact info
export const useItemContact = (id: number) => {
  return useQuery({
    queryKey: itemKeys.contact(id),
    queryFn: () => itemsApi.getContact(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: false, // Only fetch when explicitly requested
  });
};

// Get related items
export const useRelatedItems = (id: number) => {
  return useQuery({
    queryKey: itemKeys.related(id),
    queryFn: () => itemsApi.getRelated(id),
    staleTime: 5 * 60 * 1000,
  });
};

// Create item
export const useCreateItem = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateItemPayload) => itemsApi.create(payload),
    onSuccess: (data) => {
      // Invalidate items lists
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['users', 'current', 'items'] });

      toast.success(
        data.status === 'draft'
          ? 'Item saved as draft!'
          : 'Item posted successfully!'
      );

      // Redirect to the item page
      router.push(`/items/${data.id}`);
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to create item';
      toast.error(message);

      if (error.fields) {
        Object.entries(error.fields).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      }
    },
  });
};

// Update item
export const useUpdateItem = (itemId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateItemPayload) => itemsApi.update(itemId, payload),
    onSuccess: (data) => {
      // Update cache for this specific item
      queryClient.setQueryData(itemKeys.detail(itemId), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['users', 'current', 'items'] });

      toast.success('Item updated successfully!');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to update item';
      toast.error(message);

      if (error.fields) {
        Object.entries(error.fields).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      }
    },
  });
};

// Delete item
export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => itemsApi.delete(itemId),
    onSuccess: (data, itemId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: itemKeys.detail(itemId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['users', 'current', 'items'] });

      toast.success(data.message || 'Item deleted successfully!');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to delete item';
      toast.error(message);
    },
  });
};

// Update item status (draft/published/archived)
export const useUpdateItemStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: UpdateItemStatusPayload }) =>
      itemsApi.updateStatus(itemId, payload),
    onSuccess: (data, { itemId }) => {
      // Invalidate the item and lists
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['users', 'current', 'items'] });

      toast.success(data.message || 'Item status updated!');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to update status';
      toast.error(message);
    },
  });
};

// Mark item as sold
export const useMarkAsSold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload?: MarkSoldPayload }) =>
      itemsApi.markAsSold(itemId, payload),
    onSuccess: (data, { itemId }) => {
      // Invalidate the item and lists
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['users', 'current', 'items'] });

      toast.success(data.message || 'Item marked as sold!');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to mark as sold';
      toast.error(message);
    },
  });
};

// Convenience hook for marking a specific item as sold
export const useMarkItemAsSold = (itemId: number) => {
  const markAsSold = useMarkAsSold();

  return useMutation({
    mutationFn: (payload?: MarkSoldPayload) =>
      markAsSold.mutateAsync({ itemId, payload }),
    onSuccess: markAsSold.onSuccess,
    onError: markAsSold.onError,
  });
};

// Repost item
export const useRepostItem = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => itemsApi.repost(itemId),
    onSuccess: (data) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['users', 'current', 'items'] });

      toast.success('Item reposted successfully!');

      // Redirect to the new item
      router.push(`/items/${data.id}`);
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to repost item';
      toast.error(message);
    },
  });
};
