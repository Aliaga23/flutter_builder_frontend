"use client"
import { useEffect, useRef, useState, useCallback } from "react"

interface PatchMsg {
  type: "patch"
  ops: any[]
}

interface PresenceMsg {
  type: "presence"
  userId: string
  x: number
  y: number
  username?: string
  color?: string
}

export type CollabMessage = PatchMsg | PresenceMsg

// Function to generate collaboration URL without including the token
export function generateCollabURL(projectId: string): string {
  // Use the application base URL to generate the collaboration URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  return `/project/${projectId}`
}

// Function to generate a random color for the cursor
export function generateRandomColor(): string {
  const colors = [
    "#f44336", // red
    "#e91e63", // pink
    "#9c27b0", // purple
    "#673ab7", // deep purple
    "#3f51b5", // indigo
    "#2196f3", // blue
    "#03a9f4", // light blue
    "#00bcd4", // cyan
    "#009688", // teal
    "#4caf50", // green
    "#8bc34a", // light green
    "#cddc39", // lime
    "#ffc107", // amber
    "#ff9800", // orange
    "#ff5722", // deep orange
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function useProjectCollab(
  projectId: string,
  onRemote: (msg: CollabMessage) => void,
  userId?: string,
  jwt?: string, // Added jwt token parameter
) {
  const onRemoteRef = useRef(onRemote)
  useEffect(() => {
    onRemoteRef.current = onRemote
  }, [onRemote])

  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const userColor = useRef<string>(generateRandomColor())

  useEffect(() => {
    if (!projectId || projectId === "new" || !jwt) {
      if (!jwt) {
        console.log("JWT token is missing, WebSocket connection not attempted.")
        setConnectionError("Authentication token is missing.")
      }
      return
    }

    const connectWebSocket = () => {
      const projectIdString = String(projectId)

      // Build WebSocket URL using the hardcoded base URL
      const wsBaseUrl = "wss://flutterbuilderbackend-production.up.railway.app"
      const wsUrl = `${wsBaseUrl}/projects/${projectIdString}/ws`

      console.log("Connecting to WebSocket:", wsUrl)

      try {
        // Pass token as sub-protocol
        const socket = new WebSocket(wsUrl, [`jwt.${jwt}`])
        ws.current = socket

        socket.onopen = () => {
          console.log("WebSocket connection established")
          setIsConnected(true)
          setConnectionError(null)
          reconnectAttempts.current = 0
        }

        socket.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data)
            console.log("WebSocket message received:", data)
            onRemoteRef.current(data)
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }

        socket.onerror = (error) => {
          console.error("WebSocket error:", error)
          setConnectionError("Error in WebSocket connection")
          setIsConnected(false)
        }

        socket.onclose = (event) => {
          console.log("WebSocket connection closed:", event)
          setIsConnected(false)

          if (event.code !== 1000) {
            setConnectionError(`Connection closed: ${event.reason || "Unknown error"} (Code: ${event.code})`)

            if (reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current += 1
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
              console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`)

              if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current)
              }
              reconnectTimeout.current = setTimeout(connectWebSocket, delay)
            } else {
              setConnectionError("Could not reconnect after several attempts.")
              console.error("Max reconnection attempts reached.")
            }
          } else {
            setConnectionError(null) // Clear error on normal closure
          }
        }
      } catch (error) {
        console.error("Error creating WebSocket:", error)
        setConnectionError("Error creating WebSocket connection.")
      }
    }

    connectWebSocket()

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (ws.current) {
        console.log("Closing WebSocket connection (component unmount or deps change)")
        ws.current.close(1000, "Client initiated disconnect")
        ws.current = null
      }
    }
  }, [projectId, jwt]) // Added jwt to dependency array

  const sendPatch = useCallback((ops: any[]) => {
    if (ws.current?.readyState === WebSocket.OPEN && ops.length) {
      try {
        ws.current.send(JSON.stringify({ type: "patch", ops }))
        return true
      } catch (error) {
        console.error("Error sending patch:", error)
        return false
      }
    }
    return false
  }, [])

  const sendPresence = useCallback(
    (x: number, y: number, username?: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        try {
          const presenceData: PresenceMsg = {
            type: "presence",
            userId: userId || `user-${Math.random().toString(36).substr(2, 9)}`,
            x,
            y,
            username,
            color: userColor.current,
          }
          ws.current.send(JSON.stringify(presenceData))
          return true
        } catch (error) {
          console.error("Error sending presence:", error)
          return false
        }
      }
      return false
    },
    [userId],
  )

  return { sendPatch, sendPresence, isConnected, connectionError }
}
