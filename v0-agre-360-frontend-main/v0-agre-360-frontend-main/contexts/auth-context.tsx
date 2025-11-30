"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth, user as userApi, User } from '@/lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      try {
        const userData = await auth.me()
        setState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        })
      } catch (error) {
        // Token is invalid, remove it
        localStorage.removeItem('token')
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        })
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await auth.login({ email, password })
      localStorage.setItem('token', response.token)
      
      // Fetch full user data
      const userData = await auth.me()
      
      setState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }))
      throw error
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await auth.register({ name, email, password, phone })
      localStorage.setItem('token', response.token)
      
      // Fetch full user data
      const userData = await auth.me()
      
      setState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }))
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    })
  }, [])

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('token')) return
    
    try {
      const userData = await auth.me()
      setState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
      }))
    } catch (error) {
      // Token might be invalid
      logout()
    }
  }, [logout])

  const updateUser = useCallback(async (data: Partial<User>) => {
    try {
      const updatedUser = await userApi.updateProfile(data)
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }))
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update profile',
      }))
      throw error
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        clearError,
      }}
    >
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

// HOC for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = '/signin'
      }
    }, [isLoading, isAuthenticated])
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )
    }
    
    if (!isAuthenticated) {
      return null
    }
    
    return <Component {...props} />
  }
}
