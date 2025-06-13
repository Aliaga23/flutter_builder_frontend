"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context" // Ensure useAuth is imported
import { Loader2, AlertCircle } from "lucide-react"
import JsonBuilderPage from "@/components/json-builder/json-builder-page"
import { useProjectCollab, generateCollabURL } from "@/lib/useProjectCollab"
import { diff, apply } from "@/lib/collabPatch"
import { throttle } from "lodash"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { JsonAppNode } from "@/lib/json-builder-types"
import { CollaborativeCursors, useCollaborativeCursors } from "@/components/collaborative-cursors"
import { keepAllowedOps } from "@/lib/canvasOps"
import { Button } from "@/components/ui/button"

export default function ProjectPage() {
  // Destructure jwt from useAuth
  const { user, isLoading, loadProject, updateProject, jwt, getToken } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [copied, setCopied] = useState(false)

  const id = params?.id as string
  const isNewProject = id === "new"
  const collabURL = isNewProject ? "" : generateCollabURL(id)

  const [doc, setDoc] = useState<JsonAppNode | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { cursors, updateCursor } = useCollaborativeCursors()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
      return
    }

    const fetchProject = async () => {
      if (isNewProject) {
        setDoc(null)
        setIsLoadingProject(false)
        return
      }
      try {
        const result = await loadProject(id)
        if (result.success && result.project) {
          setDoc(result.project.data)
        } else {
          setError(result.error || "No se pudo cargar el proyecto")
          setTimeout(() => router.push("/dashboard"), 3000)
        }
      } catch (err) {
        setError("Error al cargar el proyecto")
        setTimeout(() => router.push("/dashboard"), 3000)
      } finally {
        setIsLoadingProject(false)
      }
    }

    if (user && !isLoading) {
      fetchProject()
    }
  }, [user, isLoading, id, isNewProject, loadProject, router])

  const docRef = useRef<JsonAppNode | null>(null)
  useEffect(() => {
    docRef.current = doc
  }, [doc])

  const userId = user?.id
  // Pass jwt to useProjectCollab
  const currentJwt = getToken() // Or use jwt directly if preferred and always up-to-date

  const { sendPatch, sendPresence, isConnected, connectionError } = useProjectCollab(
    id,
    (msg) => {
      if (msg.type === "patch" && docRef.current) {
        try {
          const allowedOps = keepAllowedOps(msg.ops)
          if (allowedOps.length > 0) {
            const updatedData = apply(docRef.current, allowedOps)
            docRef.current = updatedData
            setDoc({ ...updatedData })
          }
        } catch (error) {
          console.error("Error applying remote patch:", error)
        }
      } else if (msg.type === "presence" && msg.userId !== userId) {
        updateCursor({
          userId: msg.userId,
          x: msg.x,
          y: msg.y,
          username: msg.username || `User-${msg.userId.substring(0, 4)}`,
          color: msg.color || "#3b82f6",
        })
      }
    },
    userId,
    currentJwt || undefined, // Pass jwt to the hook
  )

  const handleDataChange = useCallback(
    (newDoc: JsonAppNode) => {
      const oldDoc = docRef.current
      if (!oldDoc) return

      try {
        const allOps = diff(oldDoc, newDoc)
        const allowedOps = keepAllowedOps(allOps)
        if (allowedOps.length > 0) {
          sendPatch(allowedOps)
          const updatedDoc = apply(oldDoc, allowedOps)
          docRef.current = updatedDoc
        }
      } catch (err) {
        console.error("Error calculating diff:", err)
      }
    },
    [sendPatch],
  )

  const sendCursorPosition = useCallback(
    throttle((x: number, y: number) => {
      if (user) {
        sendPresence(x, y, user.name || user.email)
      }
    }, 50),
    [sendPresence, user],
  )

  useEffect(() => {
    if (isNewProject || !isConnected) return // Also check for connection

    const handleMouseMove = (e: MouseEvent) => {
      sendCursorPosition(e.clientX, e.clientY)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      sendCursorPosition.cancel()
    }
  }, [sendCursorPosition, isNewProject, isConnected]) // Added isConnected

  const handleCopyLink = () => {
    const fullURL = window.location.origin + collabURL
    navigator.clipboard
      .writeText(fullURL)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => console.error("Failed to copy: ", err))
  }

  const handleBackToDashboard = () => router.push("/dashboard")

  if (isLoading || isLoadingProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-2 text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (connectionError && !isNewProject) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error de conexión colaborativa: {connectionError}. Intenta recargar la página. Si el problema persiste,
            verifica tu conexión a internet o el estado del token.
          </AlertDescription>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Recargar
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="relative">
      {!isNewProject && <CollaborativeCursors cursors={cursors} />}
      <JsonBuilderPage
        initialData={doc}
        projectId={isNewProject ? null : id}
        onBackToDashboard={handleBackToDashboard}
        onDataChange={handleDataChange}
        isConnected={isConnected}
        isNewProject={isNewProject}
        collabURL={collabURL}
        onCopyLink={handleCopyLink}
        copied={copied}
      />
    </div>
  )
}
