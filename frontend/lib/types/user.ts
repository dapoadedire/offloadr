import { School } from "./auth";

// User Profile Types
export interface UserProfile {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  email_verified: boolean;
  school: School;
  avatar_url: string | null;
  phone: string | null;
  snapchat: string | null;
  whatsapp: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface PublicUserProfile {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email_verified: boolean;
  school: School;
  avatar_url: string | null;
  joined_at: string;
  phone: string | null;
  whatsapp: string | null;
  snapchat: string | null;
  email?: string; // Only visible for own profile
}

// Update Payloads
export interface UpdateProfilePayload {
  firstname?: string;
  lastname?: string;
  phone?: string;
  snapchat?: string;
  whatsapp?: string;
  avatar_url?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface DeactivateAccountPayload {
  password: string;
}

export interface DeleteAccountPayload {
  password: string;
  confirmation: string; // Must be "DELETE"
}

// User Rating
export interface UserRating {
  seller_id: number;
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
}

// Review
export interface Review {
  id: number;
  item_id: number;
  item_title: string;
  buyer_id: number;
  buyer_username: string;
  buyer_firstname: string;
  buyer_lastname: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
