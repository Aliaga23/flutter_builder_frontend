"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProjectsDashboard } from "@/components/projects/projects-dashboard"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      setIsRedirecting(true)
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || isRedirecting || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{isRedirecting ? "Redirigiendo..." : "Cargando..."}</p>
        </div>
      </div>
    )
  }

  const handleOpenProject = (projectData: any, projectId: string) => {
    router.push(`/project/${projectId}`)
  }

  const handleCreateNewProject = () => {
    router.push("/project/new")
  }

  return <ProjectsDashboard onOpenProject={handleOpenProject} onCreateNewProject={handleCreateNewProject} />
}
