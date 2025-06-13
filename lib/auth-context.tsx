"use client"
import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiService, type User, type Project, USER_DATA_KEY } from "./api-service"

interface AuthContextType {
  user: User | null
  projects: Project[]
  isLoading: boolean
  jwt: string | null // Added jwt
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  createProject: (name: string, data: any) => Promise<{ success: boolean; project?: Project; error?: string }>
  updateProject: (id: string, data: any) => Promise<{ success: boolean; error?: string }>
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>
  loadProject: (id: string) => Promise<{ success: boolean; project?: Project; error?: string }>
  refreshProjects: () => Promise<void>
  getToken: () => string | null // This might be redundant if jwt is directly available, or could be kept for other uses
}

// Updated default context value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Initialize jwt from localStorage
  const [jwt, setJwt] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("fb_jwt") : null,
  )

  useEffect(() => {
    const initializeAuth = async () => {
      const tokenFromStorage = typeof window !== "undefined" ? localStorage.getItem("fb_jwt") : null
      if (tokenFromStorage) {
        setJwt(tokenFromStorage) // Ensure jwt state is in sync
        apiService.setToken(tokenFromStorage) // Ensure apiService has the token
        const userData = apiService.getUserFromToken()
        if (userData) {
          setUser(userData)
          await loadUserProjects()
        } else {
          // Token might be invalid/expired
          logout() // Clear invalid token
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const loadUserProjects = async () => {
    try {
      const response = await apiService.getProjects()
      if (response.data) {
        setProjects(response.data)
      } else {
        console.error("Failed to load projects:", response.error)
      }
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.login(email, password)
      if (response.data && response.data.access_token) {
        const { access_token } = response.data
        localStorage.setItem("fb_jwt", access_token) // Store JWT
        setJwt(access_token) // Update JWT state
        apiService.setToken(access_token) // Set token for apiService

        const userData = apiService.getUserFromToken()
        if (userData) {
          const userWithEmail = { ...userData, email }
          setUser(userWithEmail)
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(userWithEmail))
          await loadUserProjects()
          return { success: true }
        } else {
          logout() // Clear if token is bad
          return { success: false, error: "Failed to decode user information from token" }
        }
      }
      return { success: false, error: response.error || "Login failed" }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Network error during login" }
    }
  }

  const register = async (
    username: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.register(username, email, password)
      if (response.data && response.data.access_token) {
        const { access_token } = response.data
        localStorage.setItem("fb_jwt", access_token) // Store JWT
        setJwt(access_token) // Update JWT state
        apiService.setToken(access_token) // Set token for apiService

        const userData = apiService.getUserFromToken()
        if (userData) {
          const userWithInfo = { ...userData, username, email }
          setUser(userWithInfo)
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(userWithInfo))
          setProjects([])
          return { success: true }
        } else {
          logout() // Clear if token is bad
          return { success: false, error: "Failed to decode user information from token" }
        }
      }
      return { success: false, error: response.error || "Registration failed" }
    } catch (error) {
      console.error("Register error:", error)
      return { success: false, error: "Network error during registration" }
    }
  }

  const logout = () => {
    setUser(null)
    setProjects([])
    setJwt(null) // Clear JWT state
    if (typeof window !== "undefined") {
      localStorage.removeItem("fb_jwt") // Remove JWT from localStorage
      localStorage.removeItem(USER_DATA_KEY) // Remove user data
    }
    apiService.removeToken()
  }

  const createProject = async (
    name: string,
    data: any,
  ): Promise<{ success: boolean; project?: Project; error?: string }> => {
    try {
      const response = await apiService.createProject({ name, data })

      if (response.data) {
        const newProject = response.data
        setProjects((prev) => [...prev, newProject])
        return { success: true, project: newProject }
      }

      return { success: false, error: response.error || "Failed to create project" }
    } catch (error) {
      console.error("Create project error:", error)
      return { success: false, error: "Network error during project creation" }
    }
  }

  const updateProject = async (id: string, data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentProject = projects.find((p) => p.id === id)
      if (!currentProject) {
        return { success: false, error: "Project not found" }
      }

      const response = await apiService.updateProject(id, {
        name: currentProject.name,
        data,
      })

      if (response.data) {
        setProjects((prev) => prev.map((p) => (p.id === id ? response.data! : p)))
        return { success: true }
      }

      return { success: false, error: response.error || "Failed to update project" }
    } catch (error) {
      console.error("Update project error:", error)
      return { success: false, error: "Network error during project update" }
    }
  }

  const deleteProject = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.deleteProject(id)

      if (!response.error) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
        return { success: true }
      }

      return { success: false, error: response.error || "Failed to delete project" }
    } catch (error) {
      console.error("Delete project error:", error)
      return { success: false, error: "Network error during project deletion" }
    }
  }

  const loadProject = async (id: string): Promise<{ success: boolean; project?: Project; error?: string }> => {
    try {
      const response = await apiService.getProject(id)

      if (response.data) {
        return { success: true, project: response.data }
      }

      return { success: false, error: response.error || "Failed to load project" }
    } catch (error) {
      console.error("Load project error:", error)
      return { success: false, error: "Network error during project loading" }
    }
  }

  const refreshProjects = async () => {
    await loadUserProjects()
  }

  // getToken can now simply return the jwt state or be removed if jwt is used directly
  const getToken = () => {
    return jwt
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        projects,
        isLoading,
        jwt, // Provide jwt
        login,
        register,
        logout,
        createProject,
        updateProject,
        deleteProject,
        loadProject,
        refreshProjects,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
