export interface School {
  id: string;
  name: string;
  domain: string;
  location: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  school: School;
  phone?: string;
  whatsapp?: string;
  snapchat?: string;
  joinedAt: string;
  isActive: boolean;
  emailVerified: boolean;
  averageRating: number;
  reviewCount: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: "new" | "like-new" | "good" | "fair" | "poor";
  category: Category;
  location: string;
  school: School;
  seller: User;
  photos: string[];
  status: "draft" | "published" | "sold" | "archived";
  isNegotiable: boolean;
  viewsCount: number;
  favoritesCount: number;
  createdAt: string;
  updatedAt: string;
  soldAt?: string;
}

export interface Review {
  id: string;
  itemId: string;
  sellerId: string;
  buyerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Dummy Schools
export const schools: School[] = [
  {
    id: "1",
    name: "Obafemi Awolowo University",
    domain: "student.oauife.edu.ng",
    location: "Ile-Ife, Nigeria",
  },
];

// Dummy Categories
export const categories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    description: "Laptops, phones, tablets, and accessories",
  },
  {
    id: "2",
    name: "Books",
    slug: "books",
    description: "Textbooks, novels, and study materials",
  },
  {
    id: "3",
    name: "Furniture",
    slug: "furniture",
    description: "Desks, chairs, beds, and storage",
  },
  {
    id: "4",
    name: "Clothing",
    slug: "clothing",
    description: "Clothes, shoes, and accessories",
  },
  {
    id: "5",
    name: "Sports",
    slug: "sports",
    description: "Sports equipment and gear",
  },
  {
    id: "6",
    name: "Kitchen",
    slug: "kitchen",
    description: "Appliances, cookware, and utensils",
  },
  {
    id: "7",
    name: "Dorm Essentials",
    slug: "dorm-essentials",
    description: "Bedding, storage, and decor",
  },
  { id: "8", name: "Other", slug: "other", description: "Everything else" },
];

// Dummy Users
export const users: User[] = [
  {
    id: "1",
    username: "sarah_j",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@harvard.edu",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    school: schools[0],
    phone: "+1 (555) 123-4567",
    whatsapp: "+1 (555) 123-4567",
    joinedAt: "2024-09-15T10:00:00Z",
    isActive: true,
    emailVerified: true,
    averageRating: 4.8,
    reviewCount: 12,
  },
  {
    id: "2",
    username: "mike_chen",
    firstName: "Mike",
    lastName: "Chen",
    email: "mchen@mit.edu",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    school: schools[1],
    whatsapp: "+1 (555) 234-5678",
    snapchat: "mike_chen_snap",
    joinedAt: "2024-08-20T14:30:00Z",
    isActive: true,
    emailVerified: true,
    averageRating: 4.9,
    reviewCount: 18,
  },
  {
    id: "3",
    username: "emma_wilson",
    firstName: "Emma",
    lastName: "Wilson",
    email: "emma.w@stanford.edu",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    school: schools[2],
    phone: "+1 (555) 345-6789",
    joinedAt: "2024-10-05T08:15:00Z",
    isActive: true,
    emailVerified: true,
    averageRating: 4.7,
    reviewCount: 8,
  },
  {
    id: "4",
    username: "alex_rivera",
    firstName: "Alex",
    lastName: "Rivera",
    email: "arivera@berkeley.edu",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    school: schools[3],
    whatsapp: "+1 (555) 456-7890",
    joinedAt: "2024-09-01T12:00:00Z",
    isActive: true,
    emailVerified: true,
    averageRating: 5.0,
    reviewCount: 5,
  },
];

// Dummy Items
export const items: Item[] = [
  {
    id: "1",
    title: 'MacBook Pro 14" M3 Pro (2023)',
    description:
      "Lightly used MacBook Pro in excellent condition. Selling because I'm graduating and switching to desktop setup. Comes with original charger and box. No scratches or dents. Battery health at 98%. Perfect for students!",
    price: 1800,
    condition: "like-new",
    category: categories[0],
    location: "Dorm 5, Room 301",
    school: schools[0],
    seller: users[0],
    photos: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
    ],
    status: "published",
    isNegotiable: true,
    viewsCount: 156,
    favoritesCount: 23,
    createdAt: "2025-01-15T09:00:00Z",
    updatedAt: "2025-01-15T09:00:00Z",
  },
  {
    id: "2",
    title: "Calculus Textbook (Stewart, 9th Ed)",
    description:
      "Used calculus textbook for MATH 101. Minimal highlighting, no torn pages. Saved me a semester, hope it helps you too! Much cheaper than bookstore.",
    price: 45,
    condition: "good",
    category: categories[1],
    location: "Student Center",
    school: schools[1],
    seller: users[1],
    photos: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800"],
    status: "published",
    isNegotiable: true,
    viewsCount: 89,
    favoritesCount: 12,
    createdAt: "2025-01-20T14:30:00Z",
    updatedAt: "2025-01-20T14:30:00Z",
  },
  {
    id: "3",
    title: "IKEA Desk - White with Drawers",
    description:
      "Sturdy IKEA desk perfect for studying. White finish with 3 drawers for storage. Easy to assemble/disassemble. Selling because I'm moving to a furnished apartment. Pickup only.",
    price: 60,
    condition: "good",
    category: categories[2],
    location: "Off-campus, near campus",
    school: schools[2],
    seller: users[2],
    photos: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
    ],
    status: "published",
    isNegotiable: true,
    viewsCount: 234,
    favoritesCount: 45,
    createdAt: "2025-01-18T11:00:00Z",
    updatedAt: "2025-01-18T11:00:00Z",
  },
  {
    id: "4",
    title: "iPhone 14 Pro 256GB - Space Black",
    description:
      "Mint condition iPhone 14 Pro. Always used with case and screen protector (both included). Battery health 100%. Upgrading to newer model. Comes with original box and accessories.",
    price: 850,
    condition: "like-new",
    category: categories[0],
    location: "Dorm 2, Room 105",
    school: schools[3],
    seller: users[3],
    photos: [
      "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800",
      "https://images.unsplash.com/photo-1592286927505-2fd0dc1f6e3c?w=800",
    ],
    status: "published",
    isNegotiable: false,
    viewsCount: 312,
    favoritesCount: 67,
    createdAt: "2025-01-22T16:45:00Z",
    updatedAt: "2025-01-22T16:45:00Z",
  },
  {
    id: "5",
    title: "North Face Jacket - Men's Large",
    description:
      "Warm winter jacket, perfect for cold campus walks. Black North Face, size Large. Worn a few times, looks brand new. Moving to warmer climate.",
    price: 120,
    condition: "like-new",
    category: categories[3],
    location: "Campus mailroom",
    school: schools[0],
    seller: users[0],
    photos: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"],
    status: "published",
    isNegotiable: true,
    viewsCount: 145,
    favoritesCount: 28,
    createdAt: "2025-01-19T10:15:00Z",
    updatedAt: "2025-01-19T10:15:00Z",
  },
  {
    id: "6",
    title: "Mini Fridge - 4.3 cu ft",
    description:
      "Perfect dorm-sized mini fridge. Keeps drinks cold and has small freezer compartment. Works perfectly, selling because I'm graduating. Black color.",
    price: 75,
    condition: "good",
    category: categories[5],
    location: "Dorm 7, Room 412",
    school: schools[1],
    seller: users[1],
    photos: [
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800",
    ],
    status: "published",
    isNegotiable: true,
    viewsCount: 198,
    favoritesCount: 34,
    createdAt: "2025-01-17T13:20:00Z",
    updatedAt: "2025-01-17T13:20:00Z",
  },
  {
    id: "7",
    title: "Gaming Setup: Monitor + Keyboard + Mouse",
    description:
      'Complete gaming setup! 27" 144Hz monitor, mechanical keyboard (Cherry MX), and gaming mouse. All in excellent condition. Great for gaming or productivity. Willing to sell separately if needed.',
    price: 350,
    condition: "good",
    category: categories[0],
    location: "Off-campus apartment",
    school: schools[2],
    seller: users[2],
    photos: [
      "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    ],
    status: "published",
    isNegotiable: true,
    viewsCount: 287,
    favoritesCount: 56,
    createdAt: "2025-01-21T15:00:00Z",
    updatedAt: "2025-01-21T15:00:00Z",
  },
  {
    id: "8",
    title: "Yoga Mat + Blocks + Strap Set",
    description:
      "Complete yoga set, barely used. Premium thick yoga mat (6mm), 2 cork blocks, and stretching strap. Perfect for home workouts or campus fitness classes.",
    price: 35,
    condition: "like-new",
    category: categories[4],
    location: "Student rec center area",
    school: schools[3],
    seller: users[3],
    photos: [
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800",
    ],
    status: "published",
    isNegotiable: false,
    viewsCount: 67,
    favoritesCount: 15,
    createdAt: "2025-01-23T09:30:00Z",
    updatedAt: "2025-01-23T09:30:00Z",
  },
];

// Dummy Reviews
export const reviews: Review[] = [
  {
    id: "1",
    itemId: "1",
    sellerId: "1",
    buyerId: "2",
    rating: 5,
    comment:
      "Great seller! MacBook was exactly as described. Quick meetup and very friendly.",
    createdAt: "2025-01-16T10:00:00Z",
  },
  {
    id: "2",
    itemId: "2",
    sellerId: "2",
    buyerId: "3",
    rating: 5,
    comment: "Book in perfect condition, saved so much money!",
    createdAt: "2025-01-21T11:30:00Z",
  },
];

// Helper functions
export const getItemById = (id: string): Item | undefined => {
  return items.find((item) => item.id === id);
};

export const getItemsBySeller = (sellerId: string): Item[] => {
  return items.filter((item) => item.seller.id === sellerId);
};

export const getItemsByCategory = (categoryId: string): Item[] => {
  return items.filter((item) => item.category.id === categoryId);
};

export const getItemsBySchool = (schoolId: string): Item[] => {
  return items.filter((item) => item.school.id === schoolId);
};

export const getUserById = (id: string): User | undefined => {
  return users.find((user) => user.id === id);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find((category) => category.slug === slug);
};

export const searchItems = (query: string): Item[] => {
  const lowercaseQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery)
  );
};
