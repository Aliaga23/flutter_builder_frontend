"use client"
import { useDrag } from "react-dnd"
import type { WidgetPaletteItem, DragItem } from "@/lib/json-builder-types"
import { cn } from "@/lib/utils"

interface DraggablePaletteItemProps {
  item: WidgetPaletteItem
}

export function DraggablePaletteItem({ item }: DraggablePaletteItemProps) {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: item.type, // Usamos el tipo de componente como el tipo de arrastre
    item: {
      type: item.type,
      isNew: true,
      defaultProps: item.defaultProps,
      isContainer: item.isContainer,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const Icon = item.icon

  return (
    <div
      ref={drag}
      className={cn(
        "flex items-center p-3 mb-2 border border-gray-200 rounded-md bg-white shadow-sm hover:bg-gray-50 cursor-grab transition-colors",
        isDragging ? "opacity-50" : "opacity-100",
      )}
    >
      <Icon className={cn("h-5 w-5 mr-2", item.iconColorClass)} /> {/* Aplica la clase de color */}
      <span className="text-sm font-medium">{item.label}</span>
    </div>
  )
}
