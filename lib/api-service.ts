const API_BASE_URL = "https://flutterbuilderbackend-production.up.railway.app"

interface ApiResponse<T> {
  data?: T
  error?: string
}

interface LoginResponse {
  access_token: string
  token_type: string
}

interface User {
  id: string
  username: string
  email: string
}

interface Project {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string | null
  data: any
}

interface CreateProjectRequest {
  name: string
  data: any
}

interface UpdateProjectRequest {
  name: string
  data: any
}

// Constante para la clave del token en localStorage
const TOKEN_KEY = "fb_jwt"
const USER_DATA_KEY = "fb_user_data"

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken()
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const responseText = await response.text()
      console.log("Raw response:", responseText)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorJson = JSON.parse(responseText)
          errorMessage = errorJson.detail || errorJson.message || errorMessage
        } catch {
          errorMessage = responseText || errorMessage
        }

        console.error("API Error:", errorMessage)
        return { error: errorMessage }
      }

      try {
        const data = JSON.parse(responseText)
        console.log("Parsed response data:", data)
        return { data }
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        return { error: "Invalid JSON response from server" }
      }
    } catch (error) {
      console.error("Network/Response Error:", error)
      return { error: "Network error or invalid response" }
    }
  }

  // Auth endpoints
  async register(username: string, email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password,
        }),
      })

      console.log("Register request sent:", { username: username.trim(), email: email.trim(), password: "***" })
      console.log("Response status:", response.status)

      return this.handleResponse<LoginResponse>(response)
    } catch (error) {
      console.error("Network error during registration:", error)
      return { error: "Network error during registration" }
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      })

      console.log("Login request sent:", { email: email.trim(), password: "***" })
      console.log("Response status:", response.status)

      return this.handleResponse<LoginResponse>(response)
    } catch (error) {
      console.error("Network error during login:", error)
      return { error: "Network error during login" }
    }
  }

  // Project endpoints
  async getProjects(): Promise<ApiResponse<Project[]>> {
    const response = await fetch(`${API_BASE_URL}/projects/projects/`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse<Project[]>(response)
  }

  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    const response = await fetch(`${API_BASE_URL}/projects/projects/${projectId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse<Project>(response)
  }

  async createProject(projectData: CreateProjectRequest): Promise<ApiResponse<Project>> {
    const response = await fetch(`${API_BASE_URL}/projects/projects/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(projectData),
    })

    return this.handleResponse<Project>(response)
  }

  async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    const response = await fetch(`${API_BASE_URL}/projects/projects/${projectId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(projectData),
    })

    return this.handleResponse<Project>(response)
  }

  async deleteProject(projectId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/projects/projects/${projectId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse<void>(response)
  }

  // User info (we'll need to decode the JWT or add an endpoint for this)
  getUserFromToken(): User | null {
    const token = this.getToken()
    if (!token) return null

    try {
      // Decode JWT payload (basic decode, in production you should validate the signature)
      const payload = JSON.parse(atob(token.split(".")[1]))
      const userData = localStorage.getItem(USER_DATA_KEY)

      if (userData) {
        return JSON.parse(userData)
      }

      // If no user data in localStorage, we only have the user ID from token
      return {
        id: payload.sub,
        username: "User", // We'd need an endpoint to get full user info
        email: "user@example.com",
      }
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }

  // Token management
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }
}

export const apiService = new ApiService()
export type { User, Project, LoginResponse, CreateProjectRequest, UpdateProjectRequest }
export { TOKEN_KEY, USER_DATA_KEY }
