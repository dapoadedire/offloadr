// Item Status and Condition types
export type ItemStatus = 'draft' | 'published' | 'sold' | 'archived' | 'flagged';
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

// Item Photo
export interface ItemPhoto {
  id: number;
  item_id: number;
  url: string;
  is_primary: boolean;
  position: number;
  uploaded_at: string;
}

// Basic Item (from database)
export interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: ItemCondition;
  category_id: number;
  user_id: number;
  buyer_id: number | null;
  school_id: number;
  negotiable: boolean;
  status: ItemStatus;
  location: string;
  views_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  sold_at: string | null;
}

// Item with full details (includes relations)
export interface ItemWithDetails extends Item {
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  seller: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    avatar_url: string | null;
  } | null;
  school: {
    id: number;
    name: string;
    domain: string;
    location: string;
  } | null;
  photos: ItemPhoto[];
}

// Contact information for seller
export interface SellerContact {
  seller_id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  snapchat: string | null;
  avatar_url: string | null;
}

// Payloads for API requests
export interface CreateItemPayload {
  title: string;
  description: string;
  price: number;
  condition: ItemCondition;
  category_id: number;
  negotiable: boolean;
  location: string;
  status?: 'draft' | 'published';
  photos?: Array<{
    url: string;
    position: number;
    is_primary: boolean;
  }>;
}

export interface UpdateItemPayload {
  title?: string;
  description?: string;
  price?: number;
  condition?: ItemCondition;
  category_id?: number;
  negotiable?: boolean;
  location?: string;
}

export interface UpdateItemStatusPayload {
  status: 'draft' | 'published' | 'archived';
}

export interface MarkSoldPayload {
  buyer_id?: number;
}

// Query filters for browsing items
export interface ItemsFilterQuery {
  school_id?: number;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  condition?: ItemCondition;
  negotiable?: boolean;
  search?: string;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'most_viewed';
  page?: number;
  limit?: number;
}
