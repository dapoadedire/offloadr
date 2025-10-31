"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Handles session expiration events globally
 * This component should be mounted once in the app layout
 */
export function AuthSessionHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSessionExpired = () => {
      // Clear auth state
      clearAuth();

      // Clear all cached queries
      queryClient.clear();

      // Only redirect if not already on an auth page
      const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
      const isOnAuthPage = authPages.some(page => pathname?.startsWith(page));

      if (!isOnAuthPage) {
        // Use Next.js router for smooth navigation (no hard reload)
        router.push('/login');
      }
    };

    // Listen for session expiration events
    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [clearAuth, queryClient, router, pathname]);

  return null; // This component doesn't render anything
}
