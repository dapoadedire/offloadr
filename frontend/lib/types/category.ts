// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: number | null;
  created_at: string;
  subcategories?: Category[];
}
