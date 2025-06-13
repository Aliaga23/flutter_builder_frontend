"use client"
import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { DragItem } from "@/lib/json-builder-types"

interface SmartContainerProps {
  children: React.ReactNode
  orientation?: "horizontal" | "vertical" | "auto"
  alignment?: "start" | "center" | "end" | "stretch" | "space-between" | "space-around"
  gap?: number
  className?: string
  onDrop?: (item: DragItem, index: number) => void
  responsive?: boolean
}

export function SmartContainer({
  children,
  orientation = "auto",
  alignment = "start",
  gap = 8,
  className,
  onDrop,
  responsive = true,
}: SmartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [actualOrientation, setActualOrientation] = useState<"horizontal" | "vertical">("horizontal")
  const minItemWidth = 120

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        setContainerWidth(width)

        // Auto-detect orientation based on available space and content
        if (orientation === "auto") {
          const childCount = React.Children.count(children)
          const minWidthPerChild = 120 // Minimum width for side-by-side layout
          const shouldBeHorizontal = width >= childCount * minItemWidth && childCount <= 4 // Use minItemWidth from props

          setActualOrientation(shouldBeHorizontal ? "horizontal" : "vertical")
        } else {
          setActualOrientation(orientation)
        }
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [children, orientation])

  const getFlexStyles = () => {
    const baseStyles = {
      display: "flex",
      gap: `${gap}px`,
    }

    if (actualOrientation === "horizontal") {
      return {
        ...baseStyles,
        flexDirection: "row" as const,
        flexWrap: responsive ? ("wrap" as const) : ("nowrap" as const),
        justifyContent: alignment === "start" ? "flex-start" : alignment === "end" ? "flex-end" : alignment,
        alignItems: "center",
      }
    } else {
      return {
        ...baseStyles,
        flexDirection: "column" as const,
        alignItems: alignment === "start" ? "flex-start" : alignment === "end" ? "flex-end" : alignment,
        justifyContent: "flex-start",
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("smart-container transition-all duration-200 ease-in-out", className)}
      style={getFlexStyles()}
      data-orientation={actualOrientation}
      data-width={containerWidth}
    >
      {children}
    </div>
  )
}
