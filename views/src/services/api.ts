import type {
  Package,
  Car,
  Inquiry,
  User,
  DashboardStats,
  PackageFormData,
  ApiResponse,
  PaginatedResponse,
  FilterOptions,
  PackageFilterOptions,
  ContactFormData,
  LoginCredentials,
  AuthResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  status: number;
  validationErrors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.validationErrors = validationErrors;
    this.name = "ApiError";
  }
}

const _fetch = window.fetch;
const fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
  return _fetch(url, { ...init, credentials: "include" });
};

const getAuthHeaders = (): HeadersInit => {
  return {
    "Content-Type": "application/json",
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    let message = data.error || `HTTP error! status: ${response.status}`;

    if (data.errors) {
      const details = Object.values(data.errors).join(", ");
      if (details) {
        // If the main error message is generic, replace it or append
        if (message === "invalid request body" || !message) {
          message = details;
        } else {
          message = `${message}: ${details}`;
        }
      }
    }
    throw new ApiError(message, response.status, data.errors);
  }
  return response.json();
};

export const packageApi = {
  getAll: async (
    filters?: FilterOptions,
  ): Promise<PaginatedResponse<Package>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          if (value.length > 0) params.append(key, value.join(","));
          return;
        }
        if (typeof value === "boolean") {
          if (value) params.append(key, "true");
          return;
        }
        const v = String(value);
        if (v !== "") params.append(key, v);
      });
    }
    const response = await fetch(`${API_BASE_URL}/packages?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<Package>>(response);
  },

  getById: async (id: string): Promise<ApiResponse<Package>> => {
    const response = await fetch(`${API_BASE_URL}/packages/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<Package>>(response);
  },

  getBySlug: async (slug: string): Promise<ApiResponse<Package>> => {
    const response = await fetch(`${API_BASE_URL}/packages/slug/${slug}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<Package>>(response);
  },

  getOptions: async (): Promise<ApiResponse<PackageFilterOptions>> => {
    const response = await fetch(`${API_BASE_URL}/packages/options`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<PackageFilterOptions>>(response);
  },

  create: async (data: PackageFormData): Promise<ApiResponse<Package>> => {
    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Package>>(response);
  },

  update: async (
    id: string,
    data: Partial<PackageFormData>,
  ): Promise<ApiResponse<Package>> => {
    const response = await fetch(`${API_BASE_URL}/packages/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Package>>(response);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/packages/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  incrementView: async (id: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/packages/${id}/view`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },
};

export const carApi = {
  getAll: async (filters?: {
    status?: string;
    featured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    transmission?: string;
    withDriver?: string;
  }): Promise<PaginatedResponse<Car>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v));
      });
    }
    const response = await fetch(`${API_BASE_URL}/cars?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<Car>>(response);
  },

  getById: async (id: string): Promise<ApiResponse<Car>> => {
    const response = await fetch(`${API_BASE_URL}/cars/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<Car>>(response);
  },

  getBySlug: async (slug: string): Promise<ApiResponse<Car>> => {
    const response = await fetch(`${API_BASE_URL}/cars/slug/${slug}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<Car>>(response);
  },

  create: async (data: Partial<Car>): Promise<ApiResponse<Car>> => {
    const response = await fetch(`${API_BASE_URL}/cars`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Car>>(response);
  },

  update: async (id: string, data: Partial<Car>): Promise<ApiResponse<Car>> => {
    const response = await fetch(`${API_BASE_URL}/cars/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Car>>(response);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/cars/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  incrementView: async (id: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/cars/${id}/view`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },
};

export const inquiryApi = {
  getAll: async (filters?: {
    status?: string;
    page?: number;
    limit?: number;
    source?: string;
    packageId?: string;
    email?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<Inquiry>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${API_BASE_URL}/inquiries?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<Inquiry>>(response);
  },

  create: async (data: Partial<Inquiry>): Promise<ApiResponse<Inquiry>> => {
    const response = await fetch(`${API_BASE_URL}/inquiries`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Inquiry>>(response);
  },

  updateStatus: async (
    id: string,
    status: Inquiry["status"],
  ): Promise<ApiResponse<Inquiry>> => {
    const response = await fetch(`${API_BASE_URL}/inquiries/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<ApiResponse<Inquiry>>(response);
  },
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(response);
  },

  logout: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    await handleResponse<void>(response);
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<User>>(response);
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<AuthResponse>(response);
  },
};

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<DashboardStats>>(response);
  },
};

export const contactApi = {
  send: async (data: ContactFormData): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<void>>(response);
  },
};

export const uploadApi = {
  uploadImage: async (
    file: File,
    folder: string = "packages",
  ): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return handleResponse<ApiResponse<{ url: string }>>(response);
  },

  deleteImage: async (url: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ url }),
    });
    return handleResponse<ApiResponse<void>>(response);
  },
};

export const userApi = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<User[]>>(response);
  },

  create: async (data: {
    email: string;
    name: string;
    password: string;
    role?: string;
  }): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<User>>(response);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  updateProfile: async (data: {
    name: string;
    email: string;
  }): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<User>>(response);
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<{ message: string }>>(response);
  },
};
