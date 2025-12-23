/**
 * TrailSystem - Auth Context
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'

interface User {
  uuid: string
  name: string
  email: string
  role: string
  type: 'admin' | 'tenant'
  tenantId?: string
  tenantName?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; userType?: string; tenantId?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('trailsystem_token')
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const response = await api.me()
      if (response.success && response.data) {
        const data = response.data as any
        setUser({
          uuid: data.sub || data.uuid,
          name: data.name,
          email: data.email,
          role: data.role,
          type: data.type || 'tenant',
          tenantId: data.tenantId,
          tenantName: data.tenantName,
        })
      } else {
        setUser(null)
        localStorage.removeItem('trailsystem_token')
      }
    } catch (error) {
      setUser(null)
      localStorage.removeItem('trailsystem_token')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password)
      
      if (response.success && response.data) {
        const data = response.data as any
        const userType = data.type || 'tenant'
        
        setUser({
          uuid: data.uuid,
          name: data.name,
          email: data.email,
          role: data.role,
          type: userType,
          tenantId: data.tenantId,
          tenantName: data.tenantName,
        })
        
        return { success: true, userType, tenantId: data.tenantId }
      }
      
      return { success: false, message: response.message }
    } catch (error) {
      return { success: false, message: 'Erro ao fazer login' }
    }
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
