"use client"
import React, { useCallback, useRef, useState, useEffect } from "react"
import { useDrop, useDrag } from "react-dnd"
import { ComponentTypes, type JsonWidgetNode, type DragItem, isContainerType } from "@/lib/json-builder-types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Chip } from "@/components/ui/chip"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

import * as Icons from "lucide-react"
import {
  Trash2Icon,
  SmileIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MoveIcon,
  LayersIcon,
  LockIcon,
  UnlockIcon,
  CalendarIcon as CalendarLucideIcon,
  AlertTriangleIcon,
  InfoIcon,
  XCircleIcon,
  CheckCircleIcon,
  HelpCircleIcon,
} from "lucide-react"
import { WIDGET_PALETTE_ITEMS } from "@/lib/widget-definitions"
import { DropIndicator } from "./drop-indicator"
import { WidgetContextMenu } from "./widget-context-menu"

interface RenderWidgetNodeProps {
  node: JsonWidgetNode
  path: string
  onDrop: (item: DragItem, targetPath: string, targetIndex: number, x?: number, y?: number) => void
  onMove: (sourcePath: string, targetPath: string, targetIndex: number, x?: number, y?: number) => void
  onDelete: (path: string) => void
  onSelect: (path: string | null) => void
  isSelected: boolean
  selectedWidgetPath?: string | null
  onMoveUp?: (path: string) => void
  onMoveDown?: (path: string) => void
  isAbsoluteMode?: boolean
  onUpdatePosition?: (path: string, x: number, y: number) => void
  onUpdateSize?: (path: string, width: number, height: number) => void
  parentPath?: string
  containerBounds?: { x: number; y: number; width: number; height: number }
}

const blockLevelWidgets = [
  ComponentTypes.TEXT_FIELD,
  ComponentTypes.MULTILINE_TEXT_FIELD,
  ComponentTypes.DIVIDER,
  ComponentTypes.PROGRESS_INDICATOR,
  ComponentTypes.SLIDER,
  ComponentTypes.DATE_PICKER,
  ComponentTypes.ALERT_DIALOG,
  ComponentTypes.LIST_TILE,
  ComponentTypes.DATA_TABLE,
]

// Grid snap utility
const snapToGrid = (value: number, gridSize = 8): number => {
  return Math.round(value / gridSize) * gridSize
}

// Helper function to safely convert items to array
const safeItemsToArray = (items: any): string[] => {
  if (Array.isArray(items)) {
    return items.map((item) => (typeof item === "string" ? item : String(item)))
  }
  if (typeof items === "string") {
    return items
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }
  return []
}

const RenderWidgetNodeComponent: React.FC<RenderWidgetNodeProps> = ({
  node,
  path,
  onDrop,
  onMove,
  onDelete,
  onSelect,
  isSelected,
  selectedWidgetPath,
  onMoveUp,
  onMoveDown,
  isAbsoluteMode = false,
  onUpdatePosition,
  onUpdateSize,
  parentPath,
  containerBounds,
}) => {
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string>("")
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isLocked, setIsLocked] = useState(node.props.locked || false)
  const elementRef = useRef<HTMLDivElement>(null)
  const initialResizeRef = useRef({ width: 0, height: 0, x: 0, y: 0 })
  const initialMouseRef = useRef({ x: 0, y: 0 })

  // Enhanced mouse event handlers for dragging (solo en modo absoluto)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAbsoluteMode || node.type === ComponentTypes.PAGE || isLocked) return

    const target = e.target as HTMLElement
    const isInteractiveElement = target.closest('button, input, select, textarea, [role="button"], [role="combobox"]')
    const isResizeHandle = target.closest(".resize-handle")
    const isControlButton = target.closest("[data-widget-control]")

    if (isInteractiveElement && !isControlButton) return
    if (isResizeHandle) return

    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    onSelect(path)

    const rect = elementRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isAbsoluteMode || isLocked) return

    const canvas = parentPath
      ? document.querySelector(`[data-widget-path="${parentPath}"] .container-children-area`)
      : document.querySelector(".canvas-area-content")

    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    let newX = e.clientX - canvasRect.left - dragOffset.x
    let newY = e.clientY - canvasRect.top - dragOffset.y

    // Snap to grid
    newX = snapToGrid(Math.max(0, newX))
    newY = snapToGrid(Math.max(0, newY))

    // Constrain to container bounds if inside a container
    if (containerBounds) {
      const width = typeof node.props.width === "number" ? node.props.width : 200
      const height = typeof node.props.height === "number" ? node.props.height : 100
      newX = Math.max(0, Math.min(newX, containerBounds.width - width))
      newY = Math.max(0, Math.min(newY, containerBounds.height - height))
    }

    if (onUpdatePosition) {
      onUpdatePosition(path, newX, newY)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  // Redimensionamiento solo en modo absoluto
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (!isAbsoluteMode || isLocked || !elementRef.current) return

    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    setResizeHandle(handle)

    // Guardar posición inicial del mouse
    initialMouseRef.current = { x: e.clientX, y: e.clientY }

    // Guardar dimensiones y posición iniciales del elemento
    const width = typeof node.props.width === "number" ? node.props.width : 200
    const height = typeof node.props.height === "number" ? node.props.height : 100
    const x = typeof node.props.x === "number" ? node.props.x : 0
    const y = typeof node.props.y === "number" ? node.props.y : 0

    initialResizeRef.current = { width, height, x, y }

    document.addEventListener("mousemove", handleResizeMove)
    document.addEventListener("mouseup", handleResizeEnd)
  }

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !elementRef.current || !onUpdateSize || !isAbsoluteMode) return

    // Calcular el desplazamiento del mouse desde el inicio
    const deltaX = e.clientX - initialMouseRef.current.x
    const deltaY = e.clientY - initialMouseRef.current.y

    // Valores iniciales
    let { width, height, x, y } = initialResizeRef.current

    // Calcular nuevas dimensiones y posición según el handle
    switch (resizeHandle) {
      case "se": // Southeast
        width = snapToGrid(Math.max(50, width + deltaX))
        height = snapToGrid(Math.max(30, height + deltaY))
        break
      case "sw": // Southwest
        width = snapToGrid(Math.max(50, width - deltaX))
        height = snapToGrid(Math.max(30, height + deltaY))
        x = snapToGrid(x + initialResizeRef.current.width - width)
        break
      case "ne": // Northeast
        width = snapToGrid(Math.max(50, width + deltaX))
        height = snapToGrid(Math.max(30, height - deltaY))
        y = snapToGrid(y + initialResizeRef.current.height - height)
        break
      case "nw": // Northwest
        width = snapToGrid(Math.max(50, width - deltaX))
        height = snapToGrid(Math.max(30, height - deltaY))
        x = snapToGrid(x + initialResizeRef.current.width - width)
        y = snapToGrid(y + initialResizeRef.current.height - height)
        break
      case "e": // East
        width = snapToGrid(Math.max(50, width + deltaX))
        break
      case "w": // West
        width = snapToGrid(Math.max(50, width - deltaX))
        x = snapToGrid(x + initialResizeRef.current.width - width)
        break
      case "n": // North
        height = snapToGrid(Math.max(30, height - deltaY))
        y = snapToGrid(y + initialResizeRef.current.height - height)
        break
      case "s": // South
        height = snapToGrid(Math.max(30, height + deltaY))
        break
    }

    // Actualizar posición si cambió (solo en modo absoluto)
    if ((x !== initialResizeRef.current.x || y !== initialResizeRef.current.y) && onUpdatePosition) {
      onUpdatePosition(path, x, y)
    }

    // Actualizar tamaño
    onUpdateSize(path, width, height)
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeHandle("")
    document.removeEventListener("mousemove", handleResizeMove)
    document.removeEventListener("mouseup", handleResizeEnd)
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mousemove", handleResizeMove)
      document.removeEventListener("mouseup", handleResizeEnd)
    }
  }, [])

  // Actualizar el estado de bloqueo cuando cambie en las props
  useEffect(() => {
    setIsLocked(node.props.locked || false)
  }, [node.props.locked])

  const [{ isOver: isOverNodeItself, canDrop: canDropOnNodeItself }, dropNodeRef] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: WIDGET_PALETTE_ITEMS.map((p) => p.type),
      canDrop: (item) => {
        if (!isContainerType(node.type)) return false
        if (node.type === ComponentTypes.LIST_VIEW && item.type !== ComponentTypes.LIST_TILE) return false
        if (item.sourcePath && (item.sourcePath === path || path.startsWith(`${item.sourcePath}.`))) return false
        return true
      },
      drop: (item, monitor) => {
        if (monitor.didDrop()) return

        const targetIdx = node.children?.length || 0
        const dropOffset = monitor.getClientOffset()

        if (isAbsoluteMode && dropOffset && elementRef.current) {
          const rect = elementRef.current.getBoundingClientRect()
          const relativeX = snapToGrid(dropOffset.x - rect.left - 20)
          const relativeY = snapToGrid(dropOffset.y - rect.top - 40)

          if (item.isNew) {
            onDrop(item, path, targetIdx, Math.max(0, relativeX), Math.max(0, relativeY))
          } else if (item.sourcePath) {
            onMove(item.sourcePath, path, targetIdx, Math.max(0, relativeX), Math.max(0, relativeY))
          }
        } else {
          if (item.isNew) {
            onDrop(item, path, targetIdx)
          } else if (item.sourcePath) {
            onMove(item.sourcePath, path, targetIdx)
          }
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [node, path, onDrop, onMove, isAbsoluteMode],
  )

  const handleDropAtStart = useCallback(
    (item: DragItem) => {
      item.isNew ? onDrop(item, path, 0) : item.sourcePath && onMove(item.sourcePath, path, 0)
    },
    [onDrop, onMove, path],
  )

  const handleDropAtIndex = useCallback(
    (item: DragItem, index: number) => {
      item.isNew ? onDrop(item, path, index) : item.sourcePath && onMove(item.sourcePath, path, index)
    },
    [onDrop, onMove, path],
  )

  const handleDropSide = useCallback(
    (item: DragItem, side: "left" | "right") => {
      const pathParts = path.split(".")
      const currentIndex = Number.parseInt(pathParts[pathParts.length - 1])
      const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join(".") : ComponentTypes.PAGE
      const targetIndex = side === "left" ? currentIndex : currentIndex + 1

      if (item.isNew) {
        onDrop(item, parentPath, targetIndex)
      } else if (item.sourcePath) {
        if (parentPath.startsWith(item.sourcePath) && parentPath !== item.sourcePath) {
          console.warn("Cannot move a container into its own child.")
          return
        }
        onMove(item.sourcePath, parentPath, targetIndex)
      }
    },
    [onDrop, onMove, path],
  )

  const nodeProps = node.props || {}

  // Obtener dimensiones y posición según el modo
  const width = typeof nodeProps.width === "number" ? nodeProps.width : 200
  const height = typeof nodeProps.height === "number" ? nodeProps.height : 100
  const x = isAbsoluteMode ? (typeof nodeProps.x === "number" ? nodeProps.x : 0) : 0
  const y = isAbsoluteMode ? (typeof nodeProps.y === "number" ? nodeProps.y : 0) : 0

  const combinedStyles: React.CSSProperties = {
    padding: nodeProps.padding || undefined,
    margin: nodeProps.margin || undefined,
    backgroundColor: nodeProps.backgroundColor || undefined,
    color: nodeProps.textColor || undefined,
    fontSize: nodeProps.fontSize ? `${nodeProps.fontSize}px` : undefined,
    fontWeight: nodeProps.bold ? "bold" : (nodeProps.fontWeight as React.CSSProperties["fontWeight"]) || undefined,
    lineHeight: nodeProps.lineHeight || undefined,
    alignSelf: (nodeProps.alignSelf as React.CSSProperties["alignSelf"]) || undefined,
    textAlign: (nodeProps.textAlign as React.CSSProperties["textAlign"]) || undefined,
    width: isAbsoluteMode ? `${width}px` : nodeProps.width || "100%",
    height: isAbsoluteMode ? `${height}px` : nodeProps.height,
    minHeight: nodeProps.minHeight || undefined,
    paddingTop: nodeProps.paddingV ? `${nodeProps.paddingV}px` : undefined,
    paddingBottom: nodeProps.paddingV ? `${nodeProps.paddingV}px` : undefined,
    zIndex: nodeProps.zIndex || 1,
    border: isSelected && isAbsoluteMode ? "2px solid #3b82f6" : undefined,
    borderRadius: isAbsoluteMode ? "4px" : undefined,
    boxShadow: isSelected && isAbsoluteMode ? "0 4px 12px rgba(59, 130, 246, 0.15)" : undefined,
  }

  // Enhanced absolute mode styling
  if (isAbsoluteMode) {
    combinedStyles.position = "absolute"
    combinedStyles.left = `${x}px`
    combinedStyles.top = `${y}px`
    combinedStyles.cursor = isLocked ? "not-allowed" : "move"
    combinedStyles.userSelect = "none"

    if (isDragging) {
      combinedStyles.opacity = 0.8
      combinedStyles.transform = "scale(1.02)"
      combinedStyles.zIndex = 1000
      combinedStyles.transition = "none"
      combinedStyles.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.15)"
    } else if (isResizing) {
      combinedStyles.transition = "none"
      combinedStyles.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.25)"
    } else {
      combinedStyles.transition = "all 0.1s ease"
    }

    // Add locked styling
    if (isLocked) {
      combinedStyles.opacity = 0.7
      combinedStyles.border = "2px dashed #ef4444"
    }
  }

  // Navigation widget styling
  const isNavigationWidget = [
    ComponentTypes.APP_BAR,
    ComponentTypes.BOTTOM_NAVIGATION_BAR,
    ComponentTypes.TAB_BAR,
  ].includes(node.type)

  if (isNavigationWidget && !isAbsoluteMode) {
    combinedStyles.width = "100%"
    combinedStyles.display = "flex"
    combinedStyles.boxSizing = "border-box"
  }

  // Special handling for image aspect ratio if only one dimension is set
  if (node.type === ComponentTypes.IMAGE) {
    if (nodeProps.width && !nodeProps.height) {
      combinedStyles.height = "auto"
    } else if (nodeProps.height && !nodeProps.width) {
      combinedStyles.width = "auto"
    }
  }

  // Container styling
  if (isContainerType(node.type)) {
    combinedStyles.display = "flex"
    combinedStyles.gap = nodeProps.gap ? `${nodeProps.gap}px` : "8px"

    // Enhanced container styling for absolute mode
    if (isAbsoluteMode) {
      combinedStyles.border = isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb"
      combinedStyles.borderRadius = "6px"
      combinedStyles.backgroundColor = combinedStyles.backgroundColor || "#fafafa"
      combinedStyles.minHeight = "60px"
      combinedStyles.minWidth = "100px"
    }

    switch (node.type) {
      case ComponentTypes.ROW:
        combinedStyles.flexDirection = "row"
        combinedStyles.flexWrap = "wrap"
        combinedStyles.justifyContent =
          (nodeProps.mainAxisAlignment as React.CSSProperties["justifyContent"]) || "flex-start"
        combinedStyles.alignItems = (nodeProps.crossAxisAlignment as React.CSSProperties["alignItems"]) || "flex-start"
        break
      case ComponentTypes.COLUMN:
      case ComponentTypes.LIST_VIEW:
      case ComponentTypes.DRAWER:
        combinedStyles.flexDirection = "column"
        combinedStyles.justifyContent =
          (nodeProps.mainAxisAlignment as React.CSSProperties["justifyContent"]) || "flex-start"
        combinedStyles.alignItems = (nodeProps.crossAxisAlignment as React.CSSProperties["alignItems"]) || "stretch"
        break
      case ComponentTypes.STACK:
        combinedStyles.position = "relative"
        combinedStyles.justifyContent =
          (nodeProps.mainAxisAlignment as React.CSSProperties["justifyContent"]) || "flex-start"
        combinedStyles.alignItems = (nodeProps.crossAxisAlignment as React.CSSProperties["alignItems"]) || "stretch"
        break
      case ComponentTypes.CARD:
        combinedStyles.flexDirection = (nodeProps.flexDirection as React.CSSProperties["flexDirection"]) || "column"
        combinedStyles.justifyContent =
          (nodeProps.mainAxisAlignment as React.CSSProperties["justifyContent"]) || "flex-start"
        combinedStyles.alignItems = (nodeProps.crossAxisAlignment as React.CSSProperties["alignItems"]) || "stretch"
        combinedStyles.boxShadow = nodeProps.elevation
          ? `0 ${nodeProps.elevation * 2}px ${nodeProps.elevation * 4}px rgba(0,0,0,0.1)`
          : "0 2px 8px rgba(0,0,0,0.1)"
        combinedStyles.backgroundColor = combinedStyles.backgroundColor || "#ffffff"
        break
      case ComponentTypes.APP_BAR:
        combinedStyles.flexDirection = "row"
        combinedStyles.justifyContent =
          (nodeProps.mainAxisAlignment as React.CSSProperties["justifyContent"]) || "space-between"
        combinedStyles.alignItems = (nodeProps.crossAxisAlignment as React.CSSProperties["alignItems"]) || "center"
        combinedStyles.padding = nodeProps.padding || "0 16px"
        break
      case ComponentTypes.BOTTOM_NAVIGATION_BAR:
        combinedStyles.flexDirection = "row"
        combinedStyles.justifyContent =
          (nodeProps.mainAxisAlignment as React.CSSProperties["justifyContent"]) || "space-around"
        combinedStyles.alignItems = (nodeProps.crossAxisAlignment as React.CSSProperties["alignItems"]) || "center"
        break
      case ComponentTypes.TAB_BAR:
        combinedStyles.flexDirection = "row"
        combinedStyles.justifyContent =
          (nodeProps.mainAxisAlignment as React.CSSProperties["justifyContent"]) || "flex-start"
        combinedStyles.alignItems = (nodeProps.crossAxisAlignment as React.CSSProperties["alignItems"]) || "center"
        combinedStyles.borderBottom = "1px solid #e5e7eb"
        break
      case ComponentTypes.GRID_VIEW:
        combinedStyles.display = "grid"
        combinedStyles.gridTemplateColumns = nodeProps.columns || "repeat(auto-fit, minmax(100px, 1fr))"
        combinedStyles.placeItems = `${nodeProps.crossAxisAlignment || "stretch"} ${nodeProps.mainAxisAlignment || "start"}`
        break
      default:
        combinedStyles.flexDirection = "column"
        combinedStyles.justifyContent =
          (nodeProps.mainAxisAlignment as React.CSSProperties["justifyContent"]) || "flex-start"
        combinedStyles.alignItems = (nodeProps.crossAxisAlignment as React.CSSProperties["alignItems"]) || "stretch"
        break
    }

    if (!node.children || node.children.length === 0) {
      combinedStyles.minHeight = combinedStyles.minHeight || "60px"
    }
  } else {
    combinedStyles.display = blockLevelWidgets.includes(node.type) ? "block" : "inline-block"
  }

  // Enhanced children rendering with better positioning
  const renderChildrenWithDropIndicators = () => {
    if (!isContainerType(node.type)) return null
    const children = node.children || []
    const isHorizontalLayout = combinedStyles.flexDirection === "row"
    const dropOrientation = isHorizontalLayout ? "vertical" : "horizontal"
    const childElements = []

    if (!isAbsoluteMode) {
      childElements.push(
        <DropIndicator
          key={`${path}-child-start-indicator`}
          onDrop={handleDropAtStart}
          orientation={dropOrientation}
          position="start"
        />,
      )
    }

    children.forEach((child, index) => {
      const childPath = `${path}.${index}`

      if (isAbsoluteMode) {
        childElements.push(
          <RenderWidgetNode
            key={child.id}
            node={child}
            path={childPath}
            onDrop={onDrop}
            onMove={onMove}
            onDelete={onDelete}
            onSelect={onSelect}
            isSelected={selectedWidgetPath === childPath}
            selectedWidgetPath={selectedWidgetPath}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isAbsoluteMode={isAbsoluteMode}
            onUpdatePosition={onUpdatePosition}
            onUpdateSize={onUpdateSize}
            parentPath={path}
            containerBounds={{
              x,
              y,
              width,
              height,
            }}
          />,
        )
      } else {
        childElements.push(
          <div key={child.id} className={cn("relative widget-child-wrapper")}>
            {isHorizontalLayout && (
              <>
                <DropIndicator onDrop={(item) => handleDropSide(item, "left")} position="side-left" />
                <DropIndicator onDrop={(item) => handleDropSide(item, "right")} position="side-right" />
              </>
            )}
            <RenderWidgetNode
              node={child}
              path={childPath}
              onDrop={onDrop}
              onMove={onMove}
              onDelete={onDelete}
              onSelect={onSelect}
              isSelected={selectedWidgetPath === childPath}
              selectedWidgetPath={selectedWidgetPath}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              isAbsoluteMode={isAbsoluteMode}
              onUpdatePosition={onUpdatePosition}
              onUpdateSize={onUpdateSize}
              parentPath={parentPath}
              containerBounds={containerBounds}
            />
          </div>,
        )
      }

      if (!isAbsoluteMode) {
        childElements.push(
          <DropIndicator
            key={`${childPath}-indicator`}
            onDrop={(item) => handleDropAtIndex(item, index + 1)}
            orientation={dropOrientation}
            position={index === children.length - 1 ? "end" : "between"}
          />,
        )
      }
    })

    // Enhanced empty state for containers
    if (children.length === 0 && !(isOverNodeItself && canDropOnNodeItself)) {
      childElements.push(
        <div
          key={`${path}-empty-placeholder`}
          className={cn(
            "absolute inset-4 text-xs text-gray-400 italic flex items-center justify-center",
            "border-2 border-dashed border-gray-300 rounded-md pointer-events-none",
            "bg-gray-50/50 backdrop-blur-sm",
            isAbsoluteMode ? "min-h-[40px]" : "min-h-[40px] w-full",
          )}
        >
          <div className="text-center">
            <div className="text-gray-400 mb-1">{node.type === ComponentTypes.LIST_VIEW ? "📋" : "📦"}</div>
            <div>
              {node.type === ComponentTypes.LIST_VIEW ? "Drop List Tiles here" : `Drop widgets in ${node.type}`}
            </div>
            {isAbsoluteMode && (
              <div className="text-xs mt-1 text-gray-300">
                {width}×{height}px
              </div>
            )}
          </div>
        </div>,
      )
    }

    return childElements
  }

  // Enhanced control handlers
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(path)
    onSelect(null)
  }

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newLockedState = !isLocked
    setIsLocked(newLockedState)

    // Update the node props
    if (onUpdatePosition) {
      // Actualizar las props del widget con el nuevo estado de bloqueo
      const updatedProps = { ...nodeProps, locked: newLockedState }
      onUpdatePosition(path, x, y) // Esto es un hack para forzar la actualización
    }
  }

  // FIXED: Mejorar la lógica de selección para que funcione en ambos modos
  const handleSelectWidget = (e: React.MouseEvent) => {
    e.stopPropagation()
    const target = e.target as HTMLElement

    // Verificar si es un elemento interactivo (pero permitir controles de widget)
    const isInteractiveElement = target.closest('button, input, select, textarea, [role="button"], [role="combobox"]')
    const isControlButton = target.closest("[data-widget-control]")
    const isResizeHandle = target.closest(".resize-handle")

    // Si es un elemento interactivo pero NO es un control de widget, no seleccionar
    if (isInteractiveElement && !isControlButton && target.tagName !== "IMG") {
      return
    }

    // Si es un handle de redimensionamiento, no seleccionar
    if (isResizeHandle) {
      return
    }

    // Seleccionar el widget
    onSelect(path)
  }

  // Safe icon component getter
  const getIconComponent = (iconName: string | undefined) => {
    if (!iconName) return SmileIcon
    const IconComponent = Icons[iconName as keyof typeof Icons]
    return IconComponent || SmileIcon
  }

  // Helper function to get dialog icon based on type
  const getDialogIcon = (dialogType: string, iconName?: string) => {
    if (iconName && Icons[iconName as keyof typeof Icons]) {
      return Icons[iconName as keyof typeof Icons] as any
    }

    switch (dialogType) {
      case "info":
        return InfoIcon
      case "warning":
        return AlertTriangleIcon
      case "error":
        return XCircleIcon
      case "success":
        return CheckCircleIcon
      case "question":
        return HelpCircleIcon
      default:
        return AlertTriangleIcon
    }
  }

  // Helper function to get dialog colors based on type
  const getDialogColors = (dialogType: string) => {
    switch (dialogType) {
      case "info":
        return { iconColor: "#3b82f6", bgColor: "#eff6ff" }
      case "warning":
        return { iconColor: "#f59e0b", bgColor: "#fffbeb" }
      case "error":
        return { iconColor: "#ef4444", bgColor: "#fef2f2" }
      case "success":
        return { iconColor: "#10b981", bgColor: "#f0fdf4" }
      case "question":
        return { iconColor: "#8b5cf6", bgColor: "#f5f3ff" }
      default:
        return { iconColor: "#f59e0b", bgColor: "#fffbeb" }
    }
  }

  let content

  const baseClasses = "relative transition-all duration-100 ease-in-out"
  const containerHoverFeedback =
    isOverNodeItself && canDropOnNodeItself && isContainerType(node.type) ? "bg-blue-100 bg-opacity-50" : ""

  const commonWrapperClasses = cn(
    baseClasses,
    containerHoverFeedback,
    "rounded-md",
    isSelected ? "is-selected" : "",
    !isAbsoluteMode && "my-0.5",
    isDragging && "opacity-75 shadow-lg z-50",
    isAbsoluteMode && isSelected && "ring-2 ring-blue-500 ring-opacity-50",
    isLocked && "opacity-70",
  )

  const defaultButtonSizeClass = nodeProps.size === "icon" ? "h-9 w-9" : "h-9 px-4 py-2"

  const wrapWidgetContent = (innerContent: React.ReactNode) => {
    return (
      <div
        ref={(element) => {
          if (isContainerType(node.type)) dropNodeRef(element)
          elementRef.current = element
        }}
        className={cn(
          "widget-content-wrapper",
          isContainerType(node.type) ? "is-container" : "",
          isAbsoluteMode && "absolute-widget",
          isSelected && isAbsoluteMode && "selected-absolute-widget",
        )}
        style={combinedStyles}
        onClick={handleSelectWidget}
        onMouseDown={handleMouseDown}
        data-widget-path={path}
        data-widget-type={node.type}
      >
        {/* Enhanced container label */}
        {isContainerType(node.type) && (
          <div
            className={cn(
              "absolute -top-6 left-0 px-2 py-1 text-xs font-medium rounded-t-md z-10",
              "flex items-center gap-1 shadow-sm border border-b-0",
              node.type === ComponentTypes.ROW
                ? "text-purple-700 bg-purple-100 border-purple-200"
                : node.type === ComponentTypes.COLUMN
                  ? "text-green-700 bg-green-100 border-green-200"
                  : node.type === ComponentTypes.CARD
                    ? "text-blue-700 bg-blue-100 border-blue-200"
                    : "text-gray-700 bg-gray-100 border-gray-200",
            )}
          >
            <LayersIcon className="h-3 w-3" />
            {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            {isAbsoluteMode && (
              <span className="text-xs opacity-75">
                {width}×{height}
              </span>
            )}
          </div>
        )}

        {/* Grid overlay for containers in absolute mode */}
        {isContainerType(node.type) && isAbsoluteMode && isSelected && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #3b82f6 1px, transparent 1px),
                linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
              `,
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 0",
            }}
          />
        )}

        {/* Resize handles solo en modo absoluto */}
        {isAbsoluteMode && isSelected && isContainerType(node.type) && !isLocked && (
          <>
            {/* Corner handles */}
            <div
              className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize shadow-sm"
              onMouseDown={(e) => handleResizeStart(e, "nw")}
            />
            <div
              className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize shadow-sm"
              onMouseDown={(e) => handleResizeStart(e, "ne")}
            />
            <div
              className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize shadow-sm"
              onMouseDown={(e) => handleResizeStart(e, "sw")}
            />
            <div
              className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize shadow-sm"
              onMouseDown={(e) => handleResizeStart(e, "se")}
            />

            {/* Edge handles */}
            <div
              className="resize-handle absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-blue-500 border border-white rounded cursor-n-resize shadow-sm"
              onMouseDown={(e) => handleResizeStart(e, "n")}
            />
            <div
              className="resize-handle absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-blue-500 border border-white rounded cursor-s-resize shadow-sm"
              onMouseDown={(e) => handleResizeStart(e, "s")}
            />
            <div
              className="resize-handle absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-3 bg-blue-500 border border-white rounded cursor-w-resize shadow-sm"
              onMouseDown={(e) => handleResizeStart(e, "w")}
            />
            <div
              className="resize-handle absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-3 bg-blue-500 border border-white rounded cursor-e-resize shadow-sm"
              onMouseDown={(e) => handleResizeStart(e, "e")}
            />
          </>
        )}

        {isContainerType(node.type) ? (
          <div
            className={cn(
              "container-children-area w-full h-full flex-grow relative",
              isAbsoluteMode ? "overflow-hidden" : "",
            )}
            style={{
              display: "flex",
              flexDirection: combinedStyles.flexDirection,
              flexWrap: combinedStyles.flexWrap,
              justifyContent: combinedStyles.justifyContent,
              alignItems: combinedStyles.alignItems,
              gap: combinedStyles.gap,
              padding: isAbsoluteMode ? "8px" : "1.25rem 0.5rem 0.5rem",
              minHeight: isAbsoluteMode ? "40px" : "auto",
            }}
          >
            {renderChildrenWithDropIndicators()}
          </div>
        ) : (
          innerContent
        )}
      </div>
    )
  }

  // Widget content rendering with ALL widgets implemented
  switch (node.type) {
    case ComponentTypes.TEXT:
    case ComponentTypes.HEADING:
      content = wrapWidgetContent(
        <div className={cn("p-2", nodeProps.width && nodeProps.width !== "auto" ? "" : "inline-block")}>
          {nodeProps.text || "Sample Text"}
        </div>,
      )
      break

    case ComponentTypes.BUTTON:
      const buttonCustomStyles: React.CSSProperties = {}
      if (nodeProps.buttonWidth) {
        buttonCustomStyles.width = nodeProps.buttonWidth.includes("px")
          ? nodeProps.buttonWidth
          : `${nodeProps.buttonWidth}px`
      }
      if (nodeProps.buttonHeight) {
        buttonCustomStyles.height = nodeProps.buttonHeight.includes("px")
          ? nodeProps.buttonHeight
          : `${nodeProps.buttonHeight}px`
      }

      // Support both buttonBackgroundColor and backgroundColor
      if (nodeProps.buttonBackgroundColor || nodeProps.backgroundColor) {
        buttonCustomStyles.backgroundColor = nodeProps.buttonBackgroundColor || nodeProps.backgroundColor
      }

      // Support both buttonTextColor and textColor
      if (nodeProps.buttonTextColor || nodeProps.textColor) {
        buttonCustomStyles.color = nodeProps.buttonTextColor || nodeProps.textColor
      }

      content = wrapWidgetContent(
        <Button
          variant={nodeProps.variant || "default"}
          className={cn(
            !nodeProps.buttonWidth && !nodeProps.buttonHeight ? defaultButtonSizeClass : "",
            "transition-all duration-200 shadow-sm hover:shadow-md",
          )}
          style={buttonCustomStyles}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
          type="button"
        >
          {nodeProps.label || "Button"}
        </Button>,
      )
      break

    case ComponentTypes.FLOATING_ACTION_BUTTON:
      const FabIcon = getIconComponent(nodeProps.icon)
      content = wrapWidgetContent(
        <Button
          variant={nodeProps.variant || "default"}
          size={nodeProps.size || "icon"}
          className={cn("rounded-full shadow-lg", nodeProps.showLabel && nodeProps.label ? "px-4" : "")}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
            if (nodeProps.snack) {
              toast({
                title: "Snackbar",
                description: nodeProps.snack,
              })
            }
          }}
          type="button"
        >
          <div className="flex items-center gap-2">
            <FabIcon className="h-5 w-5" />
            {nodeProps.showLabel && nodeProps.label && nodeProps.label !== "FAB" && (
              <span className="text-sm">{nodeProps.label}</span>
            )}
          </div>
        </Button>,
      )
      break

    case ComponentTypes.IMAGE:
      content = wrapWidgetContent(
        <img
          src={nodeProps.src || "/placeholder.svg?height=40&width=60&query=image"}
          alt={nodeProps.alt || "Image"}
          className="object-cover max-w-full h-auto block"
          style={{
            width:
              nodeProps.width || (nodeProps.width === "auto" && nodeProps.height === "auto" ? "60px" : nodeProps.width),
            height:
              nodeProps.height ||
              (nodeProps.height === "auto" && nodeProps.width === "auto" ? "40px" : nodeProps.height),
            maxWidth: "120px",
            maxHeight: "80px",
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        />,
      )
      break

    case ComponentTypes.ICON:
      const DynamicIcon = getIconComponent(nodeProps.icon || nodeProps.iconName)
      content = wrapWidgetContent(
        <div
          className="p-1 inline-flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          <DynamicIcon
            style={{
              color: nodeProps.color || nodeProps.iconColor,
              width: nodeProps.size || nodeProps.iconSize || 24,
              height: nodeProps.size || nodeProps.iconSize || 24,
            }}
          />
        </div>,
      )
      break

    case ComponentTypes.TEXT_FIELD:
      content = wrapWidgetContent(
        <div className="p-1 w-full">
          {nodeProps.label && (
            <Label htmlFor={node.id} className="text-sm mb-1 block">
              {nodeProps.label}
            </Label>
          )}
          <Input
            id={node.id}
            type="text"
            placeholder={nodeProps.placeholder || "Text field"}
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(path)
            }}
            readOnly
          />
        </div>,
      )
      break

    case ComponentTypes.MULTILINE_TEXT_FIELD:
      content = wrapWidgetContent(
        <div className="p-1 w-full">
          {nodeProps.label && (
            <Label htmlFor={node.id} className="text-sm mb-1 block">
              {nodeProps.label}
            </Label>
          )}
          <Textarea
            id={node.id}
            placeholder={nodeProps.placeholder || "Text area"}
            className="w-full min-h-[60px]"
            style={{ height: nodeProps.height || undefined }}
            readOnly
            onClick={(e) => {
              e.stopPropagation()
              onSelect(path)
            }}
          />
        </div>,
      )
      break

    case ComponentTypes.CHECKBOX:
      content = wrapWidgetContent(
        <div className="flex items-center gap-2 p-1">
          <Checkbox
            id={node.id}
            checked={nodeProps.value || false}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(path)
            }}
          />
          <Label
            htmlFor={node.id}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(path)
            }}
          >
            {nodeProps.label || "Checkbox"}
          </Label>
        </div>,
      )
      break

    case ComponentTypes.SWITCH:
      content = wrapWidgetContent(
        <div className="flex items-center gap-2 p-1">
          <Switch
            id={node.id}
            checked={nodeProps.value || false}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(path)
            }}
          />
          <Label
            htmlFor={node.id}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(path)
            }}
          >
            {nodeProps.label || "Switch"}
          </Label>
        </div>,
      )
      break

    case ComponentTypes.RADIO_GROUP:
      const radioOptions = safeItemsToArray(nodeProps.options || "Option A,Option B")
      content = wrapWidgetContent(
        <RadioGroup
          defaultValue={nodeProps.value || radioOptions[0]}
          className="flex flex-col space-y-1 p-1"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          {radioOptions.map((option: string, idx: number) => (
            <div key={idx} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${node.id}-${idx}`} onClick={(e) => e.stopPropagation()} />
              <Label htmlFor={`${node.id}-${idx}`} onClick={(e) => e.stopPropagation()}>
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>,
      )
      break

    case ComponentTypes.DROPDOWN:
      const dropdownItems = safeItemsToArray(nodeProps.items)
      content = wrapWidgetContent(
        <div className="p-1 w-full">
          {nodeProps.label && (
            <Label htmlFor={node.id} className="text-sm mb-1 block">
              {nodeProps.label}
            </Label>
          )}
          <Select value={nodeProps.value || ""} onValueChange={() => {}}>
            <SelectTrigger
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(path)
              }}
            >
              <SelectValue placeholder={nodeProps.label || "Select"} />
            </SelectTrigger>
            <SelectContent>
              {dropdownItems.map((item: string, idx: number) => (
                <SelectItem key={idx} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>,
      )
      break

    case ComponentTypes.SLIDER:
      content = wrapWidgetContent(
        <div className="p-1 w-full">
          <input
            type="range"
            min={nodeProps.min || 0}
            max={nodeProps.max || 100}
            defaultValue={nodeProps.value || 0}
            className="h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer w-full"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(path)
            }}
            readOnly
          />
        </div>,
      )
      break

    case ComponentTypes.DATE_PICKER:
      content = wrapWidgetContent(
        <div className="p-1 w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal w-full",
                  !nodeProps.value && "text-muted-foreground",
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(path)
                }}
                type="button"
              >
                <CalendarLucideIcon className="mr-2 h-4 w-4" />
                {nodeProps.value ? (
                  format(new Date(nodeProps.value), "PPP")
                ) : (
                  <span>{nodeProps.placeholder || "Pick a date"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={nodeProps.value ? new Date(nodeProps.value) : undefined} initialFocus />
            </PopoverContent>
          </Popover>
        </div>,
      )
      break

    case ComponentTypes.PROGRESS_INDICATOR:
      content = wrapWidgetContent(
        <Progress
          value={nodeProps.value || 0}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        />,
      )
      break

    case ComponentTypes.CIRCLE_AVATAR:
      content = wrapWidgetContent(
        <Avatar
          style={{ width: nodeProps.size || 40, height: nodeProps.size || 40 }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          <AvatarImage src={nodeProps.avatarSrc || undefined} alt={nodeProps.alt || "Avatar"} />
          <AvatarFallback>{nodeProps.avatarFallback || "U"}</AvatarFallback>
        </Avatar>,
      )
      break

    case ComponentTypes.AVATAR:
      content = wrapWidgetContent(
        <Avatar
          style={{ width: nodeProps.size || 120, height: nodeProps.size || 120 }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          <AvatarImage src={nodeProps.avatar || undefined} alt={nodeProps.alt || "Avatar"} />
          <AvatarFallback>AV</AvatarFallback>
        </Avatar>,
      )
      break

    case ComponentTypes.CHIP:
      content = wrapWidgetContent(
        <Chip
          variant={nodeProps.variant || "default"}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          {nodeProps.text || "Chip"}
        </Chip>,
      )
      break

    case ComponentTypes.BADGE:
      content = wrapWidgetContent(
        <Badge
          variant={nodeProps.variant || "default"}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          {nodeProps.text || "Badge"}
        </Badge>,
      )
      break

    case ComponentTypes.DIVIDER:
      content = wrapWidgetContent(
        <hr
          className="border-0 w-full cursor-pointer"
          style={{
            height: nodeProps.height || "1px",
            backgroundColor: nodeProps.backgroundColor || "#e5e7eb",
            margin: nodeProps.margin || "8px 0",
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        />,
      )
      break

    case ComponentTypes.LIST_TILE:
      // Get icon from iconName or iconData properties
      const listTileIconName = nodeProps.iconName || nodeProps.iconData || nodeProps.icon?.icon || "Circle"
      const listTileIconColor = nodeProps.iconColor || nodeProps.icon?.color || "#666666"
      const ListTileIcon = getIconComponent(listTileIconName)

      // Custom styles for ListTile with all properties
      const listTileStyles: React.CSSProperties = {
        backgroundColor: nodeProps.tileBackgroundColor || "#ffffff",
        borderColor: nodeProps.borderColor || "#e0e0e0",
        borderWidth: `${nodeProps.borderWidth || 1}px`,
        borderRadius: `${nodeProps.borderRadius || 4}px`,
        borderStyle: "solid",
        padding: nodeProps.padding || "8px",
        margin: nodeProps.margin || "0",
      }

      content = wrapWidgetContent(
        <div
          className="flex items-center gap-3 w-full p-2 cursor-pointer"
          style={listTileStyles}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          <div className="flex-shrink-0">
            <ListTileIcon className="h-5 w-5" style={{ color: listTileIconColor }} />
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-medium text-sm truncate" style={{ color: nodeProps.titleColor || "#000000" }}>
              {nodeProps.title || "List Item Title"}
            </p>
            {nodeProps.subtitle && (
              <p className="text-xs truncate" style={{ color: nodeProps.subtitleColor || "#666666" }}>
                {nodeProps.subtitle}
              </p>
            )}
          </div>
          {nodeProps.check !== undefined && (
            <div className="flex-shrink-0">
              <Checkbox checked={nodeProps.check} onClick={(e) => e.stopPropagation()} />
            </div>
          )}
        </div>,
      )
      break

    case ComponentTypes.DATA_TABLE:
      content = wrapWidgetContent(
        <div
          className="p-1 w-full overflow-x-auto cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border border-gray-200 rounded-md">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                {(nodeProps.columns || []).map((col: string, idx: number) => (
                  <th key={idx} scope="col" className="px-4 py-2">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(nodeProps.rows || []).map((row: string[], rowIdx: number) => (
                <tr key={rowIdx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  {row.map((cell: string, cellIdx: number) => (
                    <td key={cellIdx} className="px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {(!nodeProps.rows || nodeProps.rows.length === 0) && (
                <tr>
                  <td colSpan={nodeProps.columns?.length || 1} className="px-4 py-2 text-center italic text-gray-400">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>,
      )
      break

    case ComponentTypes.ALERT_DIALOG:
      const DialogIcon = getDialogIcon(nodeProps.dialogType || "warning", nodeProps.dialogIcon)
      const dialogColors = getDialogColors(nodeProps.dialogType || "warning")

      content = wrapWidgetContent(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(path)
              }}
              type="button"
            >
              Show {nodeProps.dialogType || "Warning"} Dialog
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                {nodeProps.showIcon !== false && (
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: dialogColors.bgColor }}
                  >
                    <DialogIcon className="h-6 w-6" style={{ color: dialogColors.iconColor }} />
                  </div>
                )}
                <div className="flex-1">
                  <AlertDialogTitle className="text-lg font-semibold">
                    {nodeProps.dialogTitle || "Confirm Action"}
                  </AlertDialogTitle>
                </div>
              </div>
              <AlertDialogDescription className="text-sm text-gray-600 mt-2">
                {nodeProps.dialogContent || "Are you sure you want to proceed with this action?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className={cn("gap-2", nodeProps.buttonLayout === "vertical" ? "flex-col" : "flex-row")}>
              <AlertDialogCancel
                className="text-sm"
                style={{
                  backgroundColor: "transparent",
                  borderColor: nodeProps.cancelButtonColor || "#6b7280",
                  color: nodeProps.cancelButtonColor || "#6b7280",
                }}
              >
                {nodeProps.cancelButtonText || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                className="text-sm"
                style={{
                  backgroundColor: nodeProps.confirmButtonColor || "#dc2626",
                  borderColor: nodeProps.confirmButtonColor || "#dc2626",
                }}
              >
                {nodeProps.confirmButtonText || "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      )
      break

    case ComponentTypes.APP_BAR:
      content = wrapWidgetContent(
        <div
          className="flex items-center justify-between w-full h-full px-4 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          <span className="font-semibold">{nodeProps.title || "App Title"}</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded"></div>
            <div className="w-6 h-6 bg-white/20 rounded"></div>
          </div>
        </div>,
      )
      break

    case ComponentTypes.BOTTOM_NAVIGATION_BAR:
      const navItems = Array.isArray(nodeProps.items)
        ? nodeProps.items
        : typeof nodeProps.items === "string"
          ? nodeProps.items.split(",").map((item, index) => ({
              label: item.trim(),
              icon: ["Home", "Search", "User"][index] || "Circle",
            }))
          : [
              { label: "Home", icon: "Home" },
              { label: "Search", icon: "Search" },
              { label: "Profile", icon: "User" },
            ]

      content = wrapWidgetContent(
        <div
          className="flex justify-around items-center w-full h-full px-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          {navItems.map((item, index) => {
            // Manejar tanto objetos como strings
            const itemLabel = typeof item === "string" ? item : item.label || "Tab"
            const itemIcon = typeof item === "string" ? "Circle" : item.icon || "Circle"

            const IconComponent = getIconComponent(itemIcon)
            const isSelected = index === (nodeProps.selectedIndex || 0)
            return (
              <div key={index} className="flex flex-col items-center gap-1 py-2">
                <IconComponent
                  className="h-5 w-5"
                  style={{
                    color: isSelected ? nodeProps.selectedItemColor || "#2563eb" : nodeProps.textColor || "#000000",
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: isSelected ? nodeProps.selectedItemColor || "#2563eb" : nodeProps.textColor || "#000000",
                  }}
                >
                  {itemLabel}
                </span>
              </div>
            )
          })}
        </div>,
      )
      break

    case ComponentTypes.TAB_BAR:
      const tabItems = safeItemsToArray(nodeProps.items)
      if (tabItems.length === 0) {
        tabItems.push("Tab 1", "Tab 2", "Tab 3")
      }

      content = wrapWidgetContent(
        <div
          className="flex w-full h-full border-b cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(path)
          }}
        >
          {tabItems.map((item, index) => (
            <div
              key={index}
              className={`flex-1 px-4 py-2 text-center border-b-2 ${
                index === 0 ? "border-blue-500 text-blue-500" : "border-transparent text-gray-600"
              }`}
            >
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>,
      )
      break

    case ComponentTypes.CONTAINER:
    case ComponentTypes.ROW:
    case ComponentTypes.COLUMN:
    case ComponentTypes.STACK:
    case ComponentTypes.CARD:
    case ComponentTypes.LIST_VIEW:
    case ComponentTypes.GRID_VIEW:
    case ComponentTypes.DRAWER:
      content = wrapWidgetContent(null) // Container content is handled by renderChildrenWithDropIndicators
      break

    default:
      content = wrapWidgetContent(<div className="p-2 bg-red-100 border-red-300 rounded">Unknown: {node.type}</div>)
  }

  // Enhanced controls with more options
  const controls = isSelected && node.type !== ComponentTypes.PAGE && (
    <div
      className="absolute -top-8 right-0 z-30 flex items-center bg-white/95 backdrop-blur-sm rounded-md p-1 shadow-lg border border-gray-200 widget-controls"
      data-widget-control="true"
    >
      <div className="absolute -top-6 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded text-nowrap opacity-90 pointer-events-none">
        {path} {isAbsoluteMode && `(${Math.round(x)}, ${Math.round(y)})`}
        {isAbsoluteMode && <MoveIcon className="inline h-3 w-3 ml-1" />}
      </div>

      {isAbsoluteMode && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-1"
          onClick={handleLockToggle}
          title={isLocked ? "Unlock" : "Lock"}
          data-widget-control="true"
        >
          {isLocked ? <LockIcon className="h-3 w-3 text-red-500" /> : <UnlockIcon className="h-3 w-3" />}
        </Button>
      )}

      {!isAbsoluteMode && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-1"
            onClick={(e) => {
              e.stopPropagation()
              onMoveUp && onMoveUp(path)
            }}
            title="Move Up"
            data-widget-control="true"
          >
            <ChevronUpIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-1"
            onClick={(e) => {
              e.stopPropagation()
              onMoveDown && onMoveDown(path)
            }}
            title="Move Down"
            data-widget-control="true"
          >
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-1"
        onClick={handleDeleteClick}
        title="Delete"
        data-widget-control="true"
      >
        <Trash2Icon className="h-3 w-3 text-red-500" />
      </Button>
    </div>
  )

  const [{ isDragging: isActualSourceDragging }, preview] = useDrag({
    type: node.type,
    item: () => ({ type: node.type, sourcePath: path }),
    canDrag: !isAbsoluteMode && !isLocked,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  return (
    <div
      ref={preview}
      className={cn(
        "widget-outer-wrapper",
        node.type === ComponentTypes.PAGE && "w-full h-full",
        (isContainerType(node.type) || (isNavigationWidget && !isAbsoluteMode)) && "w-full",
        isActualSourceDragging && "opacity-30",
        "outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        isSelected ? "is-selected" : "",
        isAbsoluteMode && "absolute-positioned",
        isLocked && "locked-widget",
      )}
    >
      <WidgetContextMenu
        onDelete={handleDeleteClick}
        onDuplicate={() => {}} // Implement duplicate functionality
        onMoveUp={() => onMoveUp && onMoveUp(path)}
        onMoveDown={() => onMoveDown && onMoveDown(path)}
        onAlignLeft={() => {}}
        onAlignCenter={() => {}}
        onAlignRight={() => {}}
        onAlignJustify={() => {}}
        canMoveUp={true}
        canMoveDown={true}
        widgetType={node.type}
      >
        <div className={commonWrapperClasses}>
          {node.type !== ComponentTypes.PAGE && combinedStyles.display !== "flex" && !isAbsoluteMode && (
            <>
              <DropIndicator onDrop={(item) => handleDropSide(item, "left")} position="side-left" />
              <DropIndicator onDrop={(item) => handleDropSide(item, "right")} position="side-right" />
            </>
          )}
          {content}
          {controls}
        </div>
      </WidgetContextMenu>
    </div>
  )
}

export const RenderWidgetNode = React.memo(RenderWidgetNodeComponent)
