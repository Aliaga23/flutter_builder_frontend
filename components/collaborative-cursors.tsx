"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface Cursor {
  userId: string
  x: number
  y: number
  username?: string
  color: string
  timestamp?: number
}

interface CollaborativeCursorsProps {
  cursors: Cursor[]
}

export function CollaborativeCursors({ cursors }: CollaborativeCursorsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.userId}
            className="absolute pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: cursor.x, y: cursor.y }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: cursor.color }}>
                <path
                  d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                  fill="currentColor"
                  stroke="white"
                />
              </svg>

              {cursor.username && (
                <div
                  className="absolute left-5 top-0 px-2 py-1 rounded whitespace-nowrap text-xs font-medium text-white shadow-sm"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.username}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useCollaborativeCursors() {
  const [cursors, setCursors] = useState<Cursor[]>([])

  // Update or add a cursor
  const updateCursor = (cursor: Cursor) => {
    setCursors((prevCursors) => {
      const existingIndex = prevCursors.findIndex((c) => c.userId === cursor.userId)

      if (existingIndex >= 0) {
        const newCursors = [...prevCursors]
        newCursors[existingIndex] = {
          ...cursor,
          timestamp: Date.now(),
        }
        return newCursors
      } else {
        return [
          ...prevCursors,
          {
            ...cursor,
            timestamp: Date.now(),
          },
        ]
      }
    })
  }

  // Clean up inactive cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setCursors((prevCursors) =>
        prevCursors.filter(
          (cursor) => cursor.timestamp && now - cursor.timestamp < 10000, // Remove cursors inactive for more than 10 seconds
        ),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return { cursors, updateCursor }
}
