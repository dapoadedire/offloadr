import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/store/authStore";
import {
  UpdateProfilePayload,
  ChangePasswordPayload,
  DeactivateAccountPayload,
  DeleteAccountPayload,
  ApiClientError,
} from "@/lib/types";
import { toast } from "sonner";

// Query Keys
export const userKeys = {
  all: ["users"] as const,
  current: () => [...userKeys.all, "current"] as const,
  byId: (id: number) => [...userKeys.all, id] as const,
  items: (id: number) => [...userKeys.byId(id), "items"] as const,
  reviews: (id: number) => [...userKeys.byId(id), "reviews"] as const,
  rating: (id: number) => [...userKeys.byId(id), "rating"] as const,
};

// Get current user profile
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: userKeys.current(),
    queryFn: usersApi.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get public user profile by ID
export const useUserProfile = (id: number) => {
  return useQuery({
    queryKey: userKeys.byId(id),
    queryFn: () => usersApi.getUserById(id),
    staleTime: 5 * 60 * 1000,
  });
};

// Get user rating
export const useUserRating = (id: number) => {
  return useQuery({
    queryKey: userKeys.rating(id),
    queryFn: () => usersApi.getUserRating(id),
    staleTime: 5 * 60 * 1000,
  });
};

// Update profile
// Update profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      usersApi.updateProfile(payload),
    onSuccess: (data) => {
      // Update current user cache
      queryClient.setQueryData(userKeys.current(), data);

      // Convert UserProfile to User format for auth store
      const userForStore = {
        id: data.id,
        username: data.username,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        email_verified: data.email_verified,
        school_id: data.school.id,
        is_active: data.is_active,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
      };

      // Update auth store to reflect changes in header
      setUser(userForStore);
      toast.success("Profile updated successfully!");
    },
    onError: (error: ApiClientError) => {
      const message = error.message || "Failed to update profile";
      toast.error(message);

      if (error.fields) {
        Object.entries(error.fields).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      }
    },
  });
};

// Change password
export const useChangePassword = () => {
  const router = useRouter();
  const logout = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      usersApi.changePassword(payload),
    onSuccess: (data) => {
      toast.success(data.message || "Password changed successfully!");

      // Log out user and redirect to login
      setTimeout(() => {
        logout();
        router.push("/login?message=password-changed");
      }, 2000);
    },
    onError: (error: ApiClientError) => {
      const message = error.message || "Failed to change password";

      if (error.status === 401) {
        toast.error("Current password is incorrect");
      } else {
        toast.error(message);
      }
    },
  });
};

// Deactivate account
export const useDeactivateAccount = () => {
  const router = useRouter();
  const logout = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeactivateAccountPayload) =>
      usersApi.deactivateAccount(payload),
    onSuccess: (data) => {
      toast.success(data.message || "Account deactivated");

      // Clear cache and log out
      queryClient.clear();
      logout();
      router.push("/login");
    },
    onError: (error: ApiClientError) => {
      const message = error.message || "Failed to deactivate account";

      if (error.status === 401) {
        toast.error("Incorrect password");
      } else {
        toast.error(message);
      }
    },
  });
};

// Delete account permanently
export const useDeleteAccount = () => {
  const router = useRouter();
  const logout = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteAccountPayload) =>
      usersApi.deleteAccountPermanently(payload),
    onSuccess: (data) => {
      toast.success(data.message || "Account deleted permanently");

      // Clear cache and log out
      queryClient.clear();
      logout();
      router.push("/");
    },
    onError: (error: ApiClientError) => {
      const message = error.message || "Failed to delete account";

      if (error.status === 401) {
        toast.error("Incorrect password");
      } else {
        toast.error(message);
      }
    },
  });
};

// Get current user items
export const useCurrentUserItems = (page = 1, limit = 20) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: [...userKeys.current(), "items", page, limit],
    queryFn: () => usersApi.getCurrentUserItems(page, limit),
    enabled: isAuthenticated,
  });
};

// Get user items (public)
export const useUserItems = (id: number, page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...userKeys.items(id), page, limit],
    queryFn: () => usersApi.getUserItems(id, page, limit),
  });
};

// Get user reviews
export const useUserReviews = (id: number, page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...userKeys.reviews(id), page, limit],
    queryFn: () => usersApi.getUserReviews(id, page, limit),
  });
};
