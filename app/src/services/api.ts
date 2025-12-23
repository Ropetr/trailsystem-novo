/**
 * TrailSystem - API Client
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://trailsystem-api.planacacabamentos.workers.dev/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

interface RegisterData {
  userName: string
  userEmail: string
  userPassword: string
  companyName: string
  companyDocument?: string
  companyPhone?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('trailsystem_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('trailsystem_token', token)
      } else {
        localStorage.removeItem('trailsystem_token')
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers })

    if (response.status === 401) {
      this.setToken(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Sessão expirada')
    }

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição')
    }

    return data
  }

  async login(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      
      if (response.success && response.data) {
        const data = response.data as { token?: string }
        if (data.token) {
          this.setToken(data.token)
        }
      }
      
      return response
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  }

  async register(data: RegisterData): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  }

  async me(): Promise<ApiResponse> {
    try {
      return await this.request<ApiResponse>('/auth/me')
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  }

  async logout(): Promise<void> {
    this.setToken(null)
  }
}

export const api = new ApiClient(API_URL)
export default api
