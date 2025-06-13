"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import {
  Plus,
  FolderOpen,
  Trash2,
  Edit,
  Calendar,
  User,
  LogOut,
  Smartphone,
  Code,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ProjectsDashboardProps {
  onOpenProject: (projectData: any, projectId: string) => void
  onCreateNewProject: () => void
}

export function ProjectsDashboard({ onOpenProject, onCreateNewProject }: ProjectsDashboardProps) {
  const { user, projects, logout, createProject, deleteProject, refreshProjects, isLoading } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")

  // Load projects on mount
  useEffect(() => {
    if (user && !isLoading) {
      handleRefreshProjects()
    }
  }, [user, isLoading])

  const handleRefreshProjects = async () => {
    setIsRefreshing(true)
    try {
      await refreshProjects()
    } catch (error) {
      console.error("Failed to refresh projects:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError("Project name is required")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      const initialData = {
        appName: newProjectName,
        theme: { primary: "#3b82f6" },
        routes: ["/home"],
        pages: [
          {
            name: "home",
            title: "Home",
            layout: "scroll",
            positioningMode: "absolute",
            backgroundColor: "#f8fafc",
            body: [],
          },
        ],
      }

      const result = await createProject(newProjectName, initialData)
      if (result.success) {
        setNewProjectName("")
        setIsCreateModalOpen(false)
        if (result.project) {
          onOpenProject(result.project.data, result.project.id)
        }
      } else {
        setError(result.error || "Failed to create project")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"?`)) {
      try {
        const result = await deleteProject(projectId)
        if (!result.success) {
          alert(result.error || "Failed to delete project")
        }
      } catch (err) {
        alert("An unexpected error occurred while deleting the project")
      }
    }
  }

  const handleOpenProject = (project: any) => {
    onOpenProject(project.data, project.id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Flutter UI Builder</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshProjects} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Projects</h2>
            <p className="text-gray-600 mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""} total
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={onCreateNewProject} variant="outline">
              <Code className="h-4 w-4 mr-2" />
              New Blank Project
            </Button>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="Enter project name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                      disabled={isCreating}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first Flutter UI project to get started</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {project.updated_at
                          ? formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })
                          : formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id, project.name)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-gray-100 rounded-lg p-3 min-h-[80px] flex items-center justify-center">
                      <div className="text-center">
                        <Smartphone className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">
                          {project.data?.pages?.length || 0} page{project.data?.pages?.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <Button className="w-full" onClick={() => handleOpenProject(project)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Open Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
