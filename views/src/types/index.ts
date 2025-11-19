export interface Package {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: 'days' | 'nights' | 'hours';
  categories: string[];
  destination: string;
  images: PackageImage[];
  itinerary: ItineraryDay[];
  included: string[];
  excluded: string[];
  highlights: string[];
  availability: string;
  maxParticipants: number;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackageImage {
  id: string;
  url: string;
  alt: string;
  order: number;
  isCover: boolean;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation?: string;
}

export interface Inquiry {
  id: string;
  packageId: string;
  packageTitle: string;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  participants: number;
  preferredDate?: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  source: 'whatsapp' | 'form' | 'phone' | 'contact';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface DashboardStats {
  totalPackages: number;
  publishedPackages: number;
  draftPackages: number;
  totalInquiries: number;
  newInquiries: number;
  convertedInquiries: number;
  totalViews: number;
  conversionRate: number;
}

export interface PackageFormData {
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: 'days' | 'nights' | 'hours';
  categories: string[];
  destination: string;
  availability: string;
  maxParticipants: number;
  highlights: string[];
  included: string[];
  excluded: string[];
  itinerary: ItineraryDay[];
  status: 'draft' | 'published';
  featured: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PackageFilterOptions {
  categories: string[];
  destinations: string[];
  currencies: string[];
  availability: string[];
}

export interface FilterOptions {
  // search and basic filters
  search?: string;
  destination?: string;
  destinations?: string[]; // multi-destination
  status?: 'draft' | 'published' | 'archived';

  // categories: support multiple with mode any/all
  category?: string; // backward compat (single)
  categories?: string[]; // preferred multi
  categoryMode?: 'any' | 'all';

  // featured shortcuts
  featured?: boolean;
  featuredOnly?: boolean;
  notFeatured?: boolean;

  // additional filters
  currency?: string;
  currencies?: string[]; // multi-currency
  availability?: string;
  priceMin?: number;
  priceMax?: number;
  durationMin?: number;
  durationMax?: number;
  participantsMin?: number;
  participantsMax?: number;

  // sorting
  sortBy?:
    | 'newest'
    | 'popular'
    | 'price_asc'
    | 'price_desc'
    | 'duration_asc'
    | 'duration_desc'
    | 'inquiries_asc'
    | 'inquiries_desc';

  // pagination
  page?: number;
  limit?: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
