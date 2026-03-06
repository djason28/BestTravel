export interface PricePair {
  amount: number;
  currency: string;
}

export interface Package {
  id: string;
  title: string;
  titleZh?: string;
  slug: string;
  description: string;
  descriptionZh?: string;
  shortDescription: string;
  shortDescriptionZh?: string;
  price: number;
  currency: string;
  prices: PricePair[];
  duration: number;
  durationUnit: "days" | "nights" | "hours";
  categories: string[];
  categoriesZh?: string[];
  destination: string;
  destinationZh?: string;
  images: PackageImage[];
  itinerary: ItineraryDay[];
  included: string[];
  includedZh?: string[];
  excluded: string[];
  excludedZh?: string[];
  highlights: string[];
  highlightsZh?: string[];
  availability: string;
  availabilityZh?: string;
  minParticipants: number;
  maxParticipants: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
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
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  activities: string[];
  activitiesZh?: string[];
  meals: string[];
  mealsZh?: string[];
  accommodation?: string;
  accommodationZh?: string;
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
  status: "new" | "contacted" | "converted" | "closed";
  source: "whatsapp" | "form" | "phone" | "contact";
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
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
  titleZh?: string;
  shortDescription: string;
  shortDescriptionZh?: string;
  description: string;
  descriptionZh?: string;
  price: number;
  currency: string;
  prices: PricePair[];
  duration: number;
  durationUnit: "days" | "nights" | "hours";
  categories: string[];
  categoriesZh?: string[];
  destination: string;
  destinationZh?: string;
  availability: string;
  availabilityZh?: string;
  minParticipants: number;
  maxParticipants: number;
  highlights: string[];
  highlightsZh?: string[];
  included: string[];
  includedZh?: string[];
  excluded: string[];
  excludedZh?: string[];
  itinerary: ItineraryDay[];
  status: "draft" | "published";
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
  status?: "draft" | "published" | "archived";

  // categories: support multiple with mode any/all
  category?: string; // backward compat (single)
  categories?: string[]; // preferred multi
  categoryMode?: "any" | "all";

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
    | "newest"
    | "popular"
    | "price_asc"
    | "price_desc"
    | "duration_asc"
    | "duration_desc"
    | "inquiries_asc"
    | "inquiries_desc";

  // pagination
  page?: number;
  limit?: number;
  // language override (frontend convenience, passed separately in API layer)
  lang?: "en" | "zh";
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
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}
