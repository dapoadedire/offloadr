import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import {
  RegisterPayload,
  LoginPayload,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ApiClientError,
} from '@/lib/types/auth';
import { toast } from 'sonner';

// Register hook
export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Registration successful! Please check your email.');
      router.push('/verify-email');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Registration failed';
      toast.error(message);

      // Handle validation errors
      if (error.fields) {
        Object.entries(error.fields).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      }
    },
  });
};

// Login hook
export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      // Store auth data in zustand store
      setAuth(data.user, data.token);

      toast.success('Login successful!');

      // Redirect to marketplace
      router.push('/marketplace');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Login failed';

      // Handle specific errors
      if (error.status === 401) {
        toast.error('Invalid credentials. Please check your email/username and password.');
      } else if (error.status === 403) {
        toast.error('Your account is inactive. Please verify your email.');
      } else {
        toast.error(message);
      }
    },
  });
};

// Verify email hook
export const useVerifyEmail = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: (data) => {
      toast.success(data.message || 'Email verified successfully!');
      router.push('/login');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Email verification failed';

      if (error.status === 404) {
        toast.error('Invalid or expired verification link.');
      } else if (error.status === 409) {
        toast.error('Email already verified. Please login.');
        router.push('/login');
      } else {
        toast.error(message);
      }
    },
  });
};

// Resend verification hook
export const useResendVerification = () => {
  return useMutation({
    mutationFn: (payload: ResendVerificationPayload) => authApi.resendVerification(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Verification email sent!');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to resend verification email';
      toast.error(message);
    },
  });
};

// Forgot password hook
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset link sent to your email!');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to send reset link';
      toast.error(message);
    },
  });
};

// Reset password hook
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successful!');
      router.push('/login');
    },
    onError: (error: ApiClientError) => {
      const message = error.message || 'Failed to reset password';

      if (error.status === 404) {
        toast.error('Invalid or expired reset link.');
      } else {
        toast.error(message);
      }
    },
  });
};

// Logout hook
export const useLogout = () => {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return () => {
    // Clear auth state
    authApi.logout();
    clearAuth();

    // Clear all queries
    queryClient.clear();

    toast.success('Logged out successfully');
    router.push('/login');
  };
};
