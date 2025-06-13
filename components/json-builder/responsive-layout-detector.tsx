"use client"
import React, { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveLayoutDetectorProps {
  children: React.ReactNode
  minItemWidth?: number
  maxItemsPerRow?: number
  gap?: number
  className?: string
}

export function ResponsiveLayoutDetector({
  children,
  minItemWidth = 120,
  maxItemsPerRow = 4,
  gap = 8,
  className,
}: ResponsiveLayoutDetectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal")
  const [itemsPerRow, setItemsPerRow] = useState(1)

  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      const childCount = React.Children.count(children)

      // Calculate how many items can fit horizontally
      const availableWidth = containerWidth - gap * (childCount - 1)
      const possibleItemsPerRow = Math.floor(availableWidth / minItemWidth)
      const actualItemsPerRow = Math.min(possibleItemsPerRow, maxItemsPerRow, childCount)

      setItemsPerRow(actualItemsPerRow)
      setLayout(actualItemsPerRow >= childCount ? "horizontal" : "vertical")
    }

    updateLayout()

    const resizeObserver = new ResizeObserver(updateLayout)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [children, minItemWidth, maxItemsPerRow, gap])

  const getLayoutStyles = () => {
    if (layout === "horizontal") {
      return {
        display: "grid",
        gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
        gap: `${gap}px`,
      }
    } else {
      return {
        display: "flex",
        flexDirection: "column" as const,
        gap: `${gap}px`,
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("responsive-layout-detector transition-all duration-300 ease-in-out", className)}
      style={getLayoutStyles()}
      data-layout={layout}
      data-items-per-row={itemsPerRow}
    >
      {children}
    </div>
  )
}
