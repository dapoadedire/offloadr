// Item types
export interface ItemPhoto {
  id: number;
  url: string;
  is_primary: boolean;
  display_order: number;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  status: string;
  photos: ItemPhoto[];
  seller_id: number;
  school_id: number;
  views_count: number;
  favorites_count: number;
  is_favorited?: boolean;
  created_at: string;
  updated_at: string;
}
