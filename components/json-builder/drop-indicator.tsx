"use client"
import React from "react"
import { useDrop } from "react-dnd"
import { cn } from "@/lib/utils"
import type { DragItem } from "@/lib/json-builder-types"
import { WIDGET_PALETTE_ITEMS } from "@/lib/widget-definitions"

interface DropIndicatorProps {
  onDrop: (item: DragItem) => void
  orientation?: "horizontal" | "vertical"
  position?: "start" | "end" | "between" | "side-left" | "side-right"
  className?: string
}

const DropIndicatorComponent = ({
  onDrop,
  orientation = "horizontal",
  position = "between",
  className,
}: DropIndicatorProps) => {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: WIDGET_PALETTE_ITEMS.map((p) => p.type),
      drop: (item, monitor) => {
        if (monitor.didDrop()) {
          return
        }
        onDrop(item)
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [onDrop],
  )

  // Different styles based on position and orientation
  const getIndicatorClasses = () => {
    const baseClasses = "transition-all duration-200 ease-in-out pointer-events-auto"

    if (position === "side-left" || position === "side-right") {
      return cn(
        baseClasses,
        "absolute top-0 w-3 h-full z-10",
        position === "side-left" ? "-left-1.5" : "-right-1.5",
        isOver && canDrop
          ? "bg-blue-600 opacity-100 border-2 border-blue-700 rounded shadow-lg scale-110"
          : "bg-transparent opacity-0 hover:opacity-70 hover:bg-blue-300 border-2 border-transparent rounded",
        className,
      )
    }

    return cn(
      baseClasses,
      orientation === "horizontal" ? "h-4 w-full" : "w-4 h-full",
      isOver && canDrop
        ? "bg-blue-600 opacity-100 border-2 border-blue-700 rounded shadow-lg transform scale-105"
        : "bg-gray-300 opacity-25 border-2 border-transparent rounded hover:opacity-50 hover:bg-blue-200",
      className,
    )
  }

  return (
    <div ref={drop} className={getIndicatorClasses()} data-drop-indicator={position} data-orientation={orientation} />
  )
}

export const DropIndicator = React.memo(DropIndicatorComponent)
