// =============================================
// TrailSystem - API Client
// =============================================

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Em produção, usa a URL do worker
  if (typeof window !== "undefined" && window.location.hostname.includes("pages.dev")) {
    return "https://trailsystem-api.planacacabamentos.workers.dev/v1";
  }
  
  // Desenvolvimento local
  return "";
};

const API_URL = getApiUrl();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface RegisterData {
  userName: string;
  userEmail: string;
  userPassword: string;
  companyName: string;
  companyDocument?: string;
  companyPhone?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("trailsystem_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("trailsystem_token", token);
      } else {
        localStorage.removeItem("trailsystem_token");
      }
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log("[API] Request:", options.method || "GET", url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("trailsystem_user");
        window.location.href = "/login";
      }
      throw new Error("Sessao expirada");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro na requisicao");
    }

    return data;
  }

  async login(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      if (response.success && response.data) {
        const data = response.data as { token?: string };
        if (data.token) {
          this.setToken(data.token);
        }
      }
      
      return response;
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async adminLogin(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      if (response.success && response.data) {
        const data = response.data as { token?: string };
        if (data.token) {
          this.setToken(data.token);
        }
      }
      
      return response;
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async register(data: RegisterData): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async me(): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>("/auth/me");
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async logout(): Promise<void> {
    this.setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("trailsystem_user");
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_URL);
export default api;
