"use client"
import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { v4 as uuidv4 } from "uuid"
import {
  type JsonWidgetNode,
  type DragItem,
  ComponentTypes,
  isContainerType,
  type JsonAppNode,
  type JsonWidgetProps,
  type JsonPageNode,
  type ComponentType,
} from "@/lib/json-builder-types"
import { cloneDeep } from "lodash"
import { WIDGET_PALETTE_ITEMS } from "@/lib/widget-definitions"
import { lucideToFlutterIcon, flutterToLucideIcon } from "@/lib/icon-mapping"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import {
  Upload,
  FileText,
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
  Download,
  Copy,
  Check,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AIImportModal } from "@/components/json-builder/ai-import-modal"
import { WidgetSidebar } from "@/components/json-builder/widget-sidebar"
import { CanvasArea } from "@/components/json-builder/canvas-area"
import { PropertiesPanel } from "@/components/json-builder/properties-panel"

// [Previous helper functions remain the same - keeping them for brevity]
const getWidgetByPath = (widgets: JsonWidgetNode[], path: string): JsonWidgetNode | null => {
  if (!path || path === ComponentTypes.PAGE) {
    return null
  }
  const parts = path.split(".").map(Number)
  let currentLevel: JsonWidgetNode[] | undefined = widgets
  let widget: JsonWidgetNode | undefined

  for (let i = 0; i < parts.length; i++) {
    const index = parts[i]
    if (!currentLevel || index < 0 || index >= currentLevel.length) {
      return null
    }
    widget = currentLevel[index]
    currentLevel = widget.children
  }
  return widget || null
}

const addWidgetToTree = (
  widgets: JsonWidgetNode[],
  targetPath: string,
  targetIndex: number,
  widgetToAdd: JsonWidgetNode,
  x?: number,
  y?: number,
): JsonWidgetNode[] => {
  const newWidgets = cloneDeep(widgets)

  if (x !== undefined && y !== undefined) {
    widgetToAdd.props.x = x
    widgetToAdd.props.y = y

    if (isContainerType(widgetToAdd.type)) {
      widgetToAdd.props.width = widgetToAdd.props.width || 200
      widgetToAdd.props.height = widgetToAdd.props.height || 150
    }
  }

  const isNavigationWidget = [
    ComponentTypes.APP_BAR,
    ComponentTypes.BOTTOM_NAVIGATION_BAR,
    ComponentTypes.TAB_BAR,
  ].includes(widgetToAdd.type)

  if (targetPath === ComponentTypes.PAGE) {
    if (isNavigationWidget && x === undefined && y === undefined) {
      newWidgets.push(widgetToAdd)
    } else {
      newWidgets.splice(targetIndex, 0, widgetToAdd)
    }
    return newWidgets
  }

  const parent = getWidgetByPath(newWidgets, targetPath)
  if (parent && isContainerType(parent.type)) {
    parent.children = parent.children || []
    parent.children.splice(targetIndex, 0, widgetToAdd)
  } else {
    console.warn(`[addWidgetToTree] Could not add to path ${targetPath}. Parent not found or not a container.`)
  }
  return newWidgets
}

const removeWidgetFromTree = (
  widgets: JsonWidgetNode[],
  sourcePath: string,
): { updatedWidgets: JsonWidgetNode[]; removedWidget: JsonWidgetNode | null } => {
  const newWidgets = cloneDeep(widgets)
  const parts = sourcePath.split(".").map(Number)
  let removedWidget: JsonWidgetNode | null = null

  if (parts.length === 1) {
    if (parts[0] >= 0 && parts[0] < newWidgets.length) {
      removedWidget = newWidgets.splice(parts[0], 1)[0]
    }
  } else {
    const parentPath = parts.slice(0, -1).join(".")
    const parent = getWidgetByPath(newWidgets, parentPath)
    const childIndex = parts[parts.length - 1]
    if (parent && parent.children && childIndex >= 0 && childIndex < parent.children.length) {
      removedWidget = parent.children.splice(childIndex, 1)[0]
    }
  }
  if (!removedWidget) {
    console.warn(`[removeWidgetFromTree] Could not remove widget from path ${sourcePath}. Widget not found.`)
  }
  return { updatedWidgets: newWidgets, removedWidget }
}

const updateWidgetPropsInTree = (
  widgets: JsonWidgetNode[],
  widgetPath: string,
  newProps: Partial<JsonWidgetProps>,
): JsonWidgetNode[] => {
  const newWidgets = cloneDeep(widgets)
  const widgetToUpdate = getWidgetByPath(newWidgets, widgetPath)
  if (widgetToUpdate) {
    widgetToUpdate.props = { ...widgetToUpdate.props, ...newProps }
  } else {
    console.warn(`[updateWidgetPropsInTree] Could not update props. Widget not found at path ${widgetPath}.`)
  }
  return newWidgets
}

const updateWidgetPositionInTree = (
  widgets: JsonWidgetNode[],
  widgetPath: string,
  x: number,
  y: number,
): JsonWidgetNode[] => {
  const newWidgets = cloneDeep(widgets)
  const widgetToUpdate = getWidgetByPath(newWidgets, widgetPath)
  if (widgetToUpdate) {
    widgetToUpdate.props.x = x
    widgetToUpdate.props.y = y
  }
  return newWidgets
}

const updateWidgetSizeInTree = (
  widgets: JsonWidgetNode[],
  widgetPath: string,
  width: number,
  height: number,
): JsonWidgetNode[] => {
  const newWidgets = cloneDeep(widgets)
  const widgetToUpdate = getWidgetByPath(newWidgets, widgetPath)
  if (widgetToUpdate) {
    widgetToUpdate.props.width = width
    widgetToUpdate.props.height = height
  }
  return newWidgets
}

const moveWidgetInTree = (
  widgets: JsonWidgetNode[],
  sourcePath: string,
  direction: "up" | "down",
): JsonWidgetNode[] => {
  const newWidgets = cloneDeep(widgets)
  const parts = sourcePath.split(".").map(Number)

  if (parts.length === 1) {
    const currentIndex = parts[0]
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (newIndex >= 0 && newIndex < newWidgets.length) {
      const [movedWidget] = newWidgets.splice(currentIndex, 1)
      newWidgets.splice(newIndex, 0, movedWidget)
    }
  } else {
    const parentPath = parts.slice(0, -1).join(".")
    const parent = getWidgetByPath(newWidgets, parentPath)
    const currentIndex = parts[parts.length - 1]

    if (parent && parent.children) {
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

      if (newIndex >= 0 && newIndex < parent.children.length) {
        const [movedWidget] = parent.children.splice(currentIndex, 1)
        parent.children.splice(newIndex, 0, movedWidget)
      }
    }
  }

  return newWidgets
}

// Add this function after the other helper functions
const adjustWidgetsForModeChange = (widgets: JsonWidgetNode[], newMode: string): JsonWidgetNode[] => {
  const adjustedWidgets = cloneDeep(widgets)

  const adjustWidget = (widget: JsonWidgetNode) => {
    if (newMode === "flex") {
      // When switching to flex mode, set width to 100% and height to auto
      widget.props.width = "100%"
      widget.props.height = "auto"
      // Remove absolute positioning properties
      delete widget.props.x
      delete widget.props.y
    } else if (newMode === "absolute") {
      // When switching to absolute mode, set default dimensions if not set
      if (!widget.props.width || widget.props.width === "100%" || widget.props.width === "auto") {
        widget.props.width = isContainerType(widget.type) ? 200 : 150
      }
      if (!widget.props.height || widget.props.height === "auto") {
        widget.props.height = isContainerType(widget.type) ? 150 : 40
      }
      // Set default position if not set
      if (widget.props.x === undefined) widget.props.x = 50
      if (widget.props.y === undefined) widget.props.y = 50
    }

    // Recursively adjust children
    if (widget.children && widget.children.length > 0) {
      widget.children.forEach(adjustWidget)
    }
  }

  adjustedWidgets.forEach(adjustWidget)
  return adjustedWidgets
}

// Enhanced initial app data
const getInitialAppData = (initialData?: any): JsonAppNode => {
  if (initialData) {
    return initialData
  }

  return {
    appName: "New Flutter App",
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
}

interface JsonBuilderPageProps {
  initialData?: any
  projectId?: string | null
  onBackToDashboard?: () => void
  onDataChange?: (data: JsonAppNode) => void
  isConnected?: boolean
  isNewProject?: boolean
  collabURL?: string
  onCopyLink?: () => void
  copied?: boolean
}

export default function JsonBuilderPage({
  initialData,
  projectId,
  onBackToDashboard,
  onDataChange,
  isConnected,
  isNewProject,
  collabURL,
  onCopyLink,
  copied,
}: JsonBuilderPageProps) {
  const { user, updateProject, createProject } = useAuth()
  const { toast } = useToast()
  const [appData, setAppData] = useState<JsonAppNode>(() => {
    // Asegurarse de que initialData tenga la estructura correcta
    if (initialData && initialData.pages && Array.isArray(initialData.pages)) {
      return initialData
    }
    return getInitialAppData()
  })
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0)
  const [selectedWidgetPath, setSelectedWidgetPath] = useState<string | null>(null)
  const [generatedJson, setGeneratedJson] = useState<string>("")
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importJsonText, setImportJsonText] = useState("")
  const [importError, setImportError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId)

  // Store local UI preferences that shouldn't be synced
  const [localPositioningModes, setLocalPositioningModes] = useState<Record<string, string>>({})

  /* ⬇️  ACTUALIZA cuando initialData cambie (parches remotos) */
  useEffect(() => {
    if (initialData && initialData.pages && Array.isArray(initialData.pages)) {
      setAppData((prevData) => {
        // Primera carga → usar todo el initialData
        if (!prevData || !prevData.pages || prevData.pages.length === 0) {
          return initialData
        }

        // En actualizaciones, solo sincronizar las páginas
        return {
          ...prevData,
          pages: initialData.pages.map((newPage, pageIndex) => {
            const existingPage = prevData.pages[pageIndex]

            // Página nueva → usarla completa
            if (!existingPage) {
              return newPage
            }

            // Página existente → conservar modo de posicionamiento local
            return {
              ...newPage,
              positioningMode: localPositioningModes[newPage.name] ?? newPage.positioningMode,
            }
          }),
        }
      })
    }
  }, [initialData, localPositioningModes])

  const currentPage = useMemo(() => {
    if (!appData || !appData.pages || !Array.isArray(appData.pages) || appData.pages.length === 0) {
      return {
        name: "home",
        title: "Home",
        layout: "scroll",
        positioningMode: "absolute",
        backgroundColor: "#f8fafc",
        body: [],
      }
    }
    return appData.pages[selectedPageIndex] || appData.pages[0]
  }, [appData, selectedPageIndex])

  const currentPageBody = useMemo(() => {
    return currentPage.body || []
  }, [currentPage])

  const selectedWidget = useMemo(() => {
    if (!selectedWidgetPath) {
      return null
    }
    return getWidgetByPath(currentPageBody, selectedWidgetPath)
  }, [selectedWidgetPath, currentPageBody])

  // Enhanced JSON stripping function (same as before)
  const stripInternalIdsAndDefaults = (nodes: JsonWidgetNode[], isAbsoluteMode = false): any[] => {
    const isContainerType = (type: string): boolean => {
      return [
        ComponentTypes.CONTAINER,
        ComponentTypes.ROW,
        ComponentTypes.COLUMN,
        ComponentTypes.STACK,
        ComponentTypes.CARD,
        ComponentTypes.LIST_VIEW,
        ComponentTypes.GRID_VIEW,
        ComponentTypes.DRAWER,
      ].includes(type as ComponentType)
    }

    return nodes.map((node) => {
      const simpleNode: any = {
        type: node.type,
      }

      if (isAbsoluteMode) {
        Object.keys(node.props).forEach((key) => {
          const value = node.props[key]

          if (value === undefined || value === null || key === "locked") {
            return
          }

          if (key === "icon" && typeof value === "object" && value.icon) {
            simpleNode.icon = {
              name: lucideToFlutterIcon(value.icon),
              color: value.color,
            }
          } else if (key === "iconName" && value) {
            simpleNode.icon = lucideToFlutterIcon(value)
          } else if (key === "items" && Array.isArray(value)) {
            if (node.type === ComponentTypes.BOTTOM_NAVIGATION_BAR) {
              simpleNode.items = value.map((item: any) => ({
                label: item.label,
                icon: lucideToFlutterIcon(item.icon),
              }))
            } else {
              simpleNode[key] = value
            }
          } else {
            simpleNode[key] = value
          }
        })
      } else {
        // Flex mode logic with ALL properties included

        // Basic text and content properties
        if (node.props.text) simpleNode.text = node.props.text
        if (node.props.label) simpleNode.label = node.props.label
        if (node.props.title) simpleNode.title = node.props.title
        if (node.props.subtitle) simpleNode.subtitle = node.props.subtitle
        if (node.props.placeholder) simpleNode.placeholder = node.props.placeholder
        if (node.props.hintText) simpleNode.hintText = node.props.hintText

        // Color properties
        if (node.props.backgroundColor && node.props.backgroundColor !== "#ffffff") {
          simpleNode.backgroundColor = node.props.backgroundColor
        }
        if (node.props.textColor && node.props.textColor !== "#000000") {
          simpleNode.textColor = node.props.textColor
        }
        if (node.props.iconColor) simpleNode.iconColor = node.props.iconColor
        if (node.props.selectedItemColor) simpleNode.selectedItemColor = node.props.selectedItemColor

        // Typography properties
        if (node.props.fontSize && node.props.fontSize !== 16) {
          simpleNode.fontSize = node.props.fontSize
        }
        if (node.props.bold) simpleNode.bold = true
        if (node.props.fontWeight && node.props.fontWeight !== "normal") {
          simpleNode.fontWeight = node.props.fontWeight
        }

        // Size properties
        if (node.props.width && node.props.width !== "auto" && node.props.width !== "100%") {
          simpleNode.width = typeof node.props.width === "string" ? node.props.width : `${node.props.width}px`
        }
        if (node.props.height && node.props.height !== "auto") {
          simpleNode.height = typeof node.props.height === "string" ? node.props.height : `${node.props.height}px`
        }
        if (node.props.minHeight) simpleNode.minHeight = node.props.minHeight
        if (node.props.size) simpleNode.size = node.props.size
        if (node.props.iconSize) simpleNode.iconSize = node.props.iconSize

        // Alignment properties
        if (node.props.textAlign && node.props.textAlign !== "left") {
          simpleNode.align = node.props.textAlign
        }

        // Layout properties for containers
        if (isContainerType(node.type)) {
          if (node.props.mainAxisAlignment && node.props.mainAxisAlignment !== "flex-start") {
            simpleNode.mainAxisAlignment = node.props.mainAxisAlignment
          }
          if (node.props.crossAxisAlignment && node.props.crossAxisAlignment !== "stretch") {
            simpleNode.crossAxisAlignment = node.props.crossAxisAlignment
          }
          if (node.props.gap && node.props.gap !== 8) {
            simpleNode.gap = node.props.gap
          }
          if (node.props.padding) simpleNode.padding = node.props.padding
          if (node.props.margin) simpleNode.margin = node.props.margin
          if (node.props.elevation) simpleNode.elevation = node.props.elevation
        }

        // Icon handling
        if (node.props.icon) {
          if (typeof node.props.icon === "object" && node.props.icon.icon) {
            simpleNode.icon = {
              name: lucideToFlutterIcon(node.props.icon.icon),
              color: node.props.icon.color,
            }
          } else if (typeof node.props.icon === "string") {
            simpleNode.icon = lucideToFlutterIcon(node.props.icon)
          }
        }

        if (node.props.iconName) {
          simpleNode.icon = lucideToFlutterIcon(node.props.iconName)
        }

        // Form control properties
        if (node.props.value !== undefined) simpleNode.value = node.props.value
        if (node.props.checked !== undefined) simpleNode.checked = node.props.checked
        if (node.props.check !== undefined) simpleNode.check = node.props.check

        // Special handling for specific widget types
        switch (node.type) {
          case ComponentTypes.BUTTON:
            if (node.props.buttonWidth) simpleNode.width = node.props.buttonWidth
            if (node.props.buttonHeight) simpleNode.height = node.props.buttonHeight
            if (node.props.buttonBackgroundColor) simpleNode.backgroundColor = node.props.buttonBackgroundColor
            if (node.props.buttonTextColor) simpleNode.textColor = node.props.buttonTextColor
            if (node.props.variant) simpleNode.variant = node.props.variant
            break

          case ComponentTypes.FLOATING_ACTION_BUTTON:
            if (node.props.variant) simpleNode.variant = node.props.variant
            if (node.props.showLabel) simpleNode.showLabel = node.props.showLabel
            if (node.props.snack) simpleNode.snack = node.props.snack
            break

          case ComponentTypes.IMAGE:
            if (node.props.src) simpleNode.src = node.props.src
            if (node.props.alt) simpleNode.alt = node.props.alt
            break

          case ComponentTypes.LIST_TILE:
            if (node.props.title) simpleNode.title = node.props.title
            if (node.props.subtitle) simpleNode.subtitle = node.props.subtitle
            if (node.props.titleColor) simpleNode.titleColor = node.props.titleColor
            if (node.props.subtitleColor) simpleNode.subtitleColor = node.props.subtitleColor
            if (node.props.tileBackgroundColor) simpleNode.tileBackgroundColor = node.props.tileBackgroundColor
            if (node.props.borderColor) simpleNode.borderColor = node.props.borderColor
            if (node.props.borderWidth) simpleNode.borderWidth = node.props.borderWidth
            if (node.props.borderRadius) simpleNode.borderRadius = node.props.borderRadius

            if (node.props.iconData && typeof node.props.iconData === "object") {
              simpleNode.icon = {
                name: lucideToFlutterIcon(node.props.iconData.icon || "Circle"),
                color: node.props.iconData.color || "#000000",
              }
            }

            if (node.props.check === true) {
              simpleNode.check = true
            }
            break

          case ComponentTypes.DATA_TABLE:
            if (node.props.columns) simpleNode.columns = node.props.columns
            if (node.props.rows) simpleNode.rows = node.props.rows
            break

          case ComponentTypes.DROPDOWN:
            if (node.props.items) {
              simpleNode.items =
                typeof node.props.items === "string"
                  ? node.props.items.split(",").map((item) => item.trim())
                  : node.props.items
            }
            if (node.props.value) simpleNode.value = node.props.value
            if (node.props.label) simpleNode.label = node.props.label
            if (node.props.selectedItem) simpleNode.selectedItem = node.props.selectedItem
            break

          case ComponentTypes.RADIO_GROUP:
            if (node.props.options) {
              simpleNode.options =
                typeof node.props.options === "string"
                  ? node.props.options.split(",").map((item) => item.trim())
                  : node.props.options
            }
            if (node.props.value) simpleNode.value = node.props.value
            if (node.props.label) simpleNode.label = node.props.label
            break

          case ComponentTypes.SLIDER:
            if (node.props.value !== undefined) simpleNode.value = node.props.value
            if (node.props.min !== undefined) simpleNode.min = node.props.min
            if (node.props.max !== undefined) simpleNode.max = node.props.max
            break

          case ComponentTypes.PROGRESS_INDICATOR:
            if (node.props.value !== undefined) simpleNode.value = node.props.value
            if (node.props.currentStep !== undefined) simpleNode.currentStep = node.props.currentStep
            if (node.props.totalSteps !== undefined) simpleNode.totalSteps = node.props.totalSteps
            break

          case ComponentTypes.ALERT_DIALOG:
            if (node.props.dialogTitle) simpleNode.dialogTitle = node.props.dialogTitle
            if (node.props.dialogContent) simpleNode.dialogContent = node.props.dialogContent
            if (node.props.confirmButtonText) simpleNode.confirmButtonText = node.props.confirmButtonText
            if (node.props.cancelButtonText) simpleNode.cancelButtonText = node.props.cancelButtonText
            if (node.props.dialogType) simpleNode.dialogType = node.props.dialogType
            if (node.props.showIcon !== undefined) simpleNode.showIcon = node.props.showIcon
            if (node.props.confirmButtonColor) simpleNode.confirmButtonColor = node.props.confirmButtonColor
            if (node.props.cancelButtonColor) simpleNode.cancelButtonColor = node.props.cancelButtonColor
            if (node.props.buttonLayout) simpleNode.buttonLayout = node.props.buttonLayout
            break

          case ComponentTypes.CIRCLE_AVATAR:
          case ComponentTypes.AVATAR:
            if (node.props.avatarSrc || node.props.avatar) simpleNode.src = node.props.avatarSrc || node.props.avatar
            if (node.props.avatarFallback) simpleNode.fallback = node.props.avatarFallback
            if (node.props.alt) simpleNode.alt = node.props.alt
            break

          case ComponentTypes.CHIP:
          case ComponentTypes.BADGE:
            if (node.props.variant) simpleNode.variant = node.props.variant
            break

          case ComponentTypes.DIVIDER:
            if (node.props.margin) simpleNode.margin = node.props.margin
            break

          case ComponentTypes.CHECKBOX:
          case ComponentTypes.SWITCH:
            if (node.props.value !== undefined) simpleNode.value = node.props.value
            break

          case ComponentTypes.TEXT_FIELD:
          case ComponentTypes.MULTILINE_TEXT_FIELD:
            if (node.props.maxLines) simpleNode.maxLines = node.props.maxLines
            break

          case ComponentTypes.DATE_PICKER:
            if (node.props.value) simpleNode.value = node.props.value
            break

          case ComponentTypes.APP_BAR:
            if (node.props.title) simpleNode.title = node.props.title
            break

          case ComponentTypes.BOTTOM_NAVIGATION_BAR:
            if (node.props.items) {
              const navItems = Array.isArray(node.props.items) ? node.props.items : []
              const routes = node.props.routes || []

              if (navItems.length > 0) {
                simpleNode.items = navItems.map((item: any, index: number) => {
                  const navItem: any = {
                    label: item.label,
                    icon: lucideToFlutterIcon(item.icon),
                  }

                  if (routes[index]) {
                    navItem.route = routes[index]
                  }

                  return navItem
                })
              }
            }

            if (node.props.selectedIndex !== undefined) simpleNode.selectedIndex = node.props.selectedIndex
            if (node.props.backgroundColor && node.props.backgroundColor !== "#ffffff") {
              simpleNode.backgroundColor = node.props.backgroundColor
            }
            if (node.props.textColor && node.props.textColor !== "#6b7280") {
              simpleNode.textColor = node.props.textColor
            }
            if (node.props.selectedItemColor && node.props.selectedItemColor !== "#2563eb") {
              simpleNode.selectedItemColor = node.props.selectedItemColor
            }
            break

          case ComponentTypes.TAB_BAR:
            if (node.props.items) {
              simpleNode.items =
                typeof node.props.items === "string"
                  ? node.props.items.split(",").map((item) => item.trim())
                  : node.props.items
            }
            break
        }
      }

      if (node.children && node.children.length > 0) {
        simpleNode.children = stripInternalIdsAndDefaults(node.children, isAbsoluteMode)
      }

      return simpleNode
    })
  }

  // AI Import handler with enhanced icon mapping
  const handleAIImport = useCallback(
    (aiGeneratedData: any) => {
      try {
        const convertJsonToNodes = (widgets: any[]): JsonWidgetNode[] => {
          if (!Array.isArray(widgets)) {
            return []
          }

          return widgets
            .map((widget: any) => {
              if (!widget || !widget.type) {
                return null
              }

              const node: JsonWidgetNode = {
                id: uuidv4(),
                type: widget.type as ComponentType,
                props: { ...widget },
                children: widget.children ? convertJsonToNodes(widget.children) : [],
              }

              delete node.props.type
              delete node.props.children

              // Enhanced icon handling - convert Flutter icon names to Lucide
              if (widget.icon) {
                if (typeof widget.icon === "string") {
                  // Convert Flutter icon name to Lucide
                  node.props.iconName = flutterToLucideIcon(widget.icon)
                } else if (typeof widget.icon === "object" && widget.icon.name) {
                  // Handle icon objects with name property
                  node.props.iconName = flutterToLucideIcon(widget.icon.name)
                  if (widget.icon.color) {
                    node.props.iconColor = widget.icon.color
                  }
                }
              }

              // Handle button-specific properties
              if (widget.type === "button") {
                if (widget.backgroundColor && !widget.buttonBackgroundColor) {
                  node.props.buttonBackgroundColor = widget.backgroundColor
                }
                if (widget.textColor && !widget.buttonTextColor) {
                  node.props.buttonTextColor = widget.textColor
                }
              }

              // Handle textField icons
              if (widget.type === "textField" && widget.icon) {
                if (typeof widget.icon === "string") {
                  node.props.iconName = flutterToLucideIcon(widget.icon)
                }
              }

              // Handle listTile icons
              if (widget.type === "listTile" && widget.icon) {
                if (typeof widget.icon === "string") {
                  node.props.iconName = flutterToLucideIcon(widget.icon)
                } else if (typeof widget.icon === "object") {
                  node.props.icon = {
                    icon: flutterToLucideIcon(widget.icon.name || widget.icon.icon || "Circle"),
                    color: widget.icon.color || "#000000",
                  }
                }
              }

              // Handle bottomNavigationBar items with icons
              if (widget.type === "bottomNavigationBar" && widget.items) {
                node.props.items = widget.items.map((item: any) => ({
                  label: item.label,
                  icon: flutterToLucideIcon(item.icon),
                }))
              }

              if (widget.width && typeof widget.width === "string" && widget.width.includes("px")) {
                node.props.width = Number.parseInt(widget.width)
              }
              if (widget.height && typeof widget.height === "string" && widget.height.includes("px")) {
                node.props.height = Number.parseInt(widget.height)
              }

              if (widget.align) {
                node.props.textAlign = widget.align
              }

              return node
            })
            .filter(Boolean) as JsonWidgetNode[]
        }

        const newAppData: JsonAppNode = {
          appName: aiGeneratedData.name || "AI Generated App",
          theme: aiGeneratedData.theme || { primary: "#3b82f6" },
          routes: aiGeneratedData.routes || ["/home"],
          pages: aiGeneratedData.pages.map((page: any) => ({
            name: page.name || "home",
            title: page.title || page.name || "Home",
            layout: page.layout || "scroll",
            positioningMode: page.mode || "absolute",
            backgroundColor: page.background || "#f8fafc",
            body: page.widgets ? convertJsonToNodes(page.widgets) : [],
            fab: page.fab
              ? {
                  label: page.fab.label || "FAB",
                  icon: page.fab.icon || "Plus",
                  snack: page.fab.action || "Action performed",
                  variant: page.fab.variant || "default",
                  showLabel: page.fab.showLabel || false,
                }
              : undefined,
          })),
        }

        setAppData(newAppData)
        setSelectedPageIndex(0)
        setSelectedWidgetPath(null)

        toast({
          title: "AI Import Successful",
          description: "Your UI has been generated and imported successfully!",
        })

        console.log("AI Import successful")
      } catch (error) {
        console.error("❌ AI Import error:", error)
        toast({
          title: "Import Failed",
          description: "Failed to import the AI-generated UI. Please try again.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  // Manual JSON import handler with enhanced icon mapping
  const handleImportJson = useCallback(() => {
    try {
      setImportError("")
      const parsedJson = JSON.parse(importJsonText)

      if (!parsedJson.pages || !Array.isArray(parsedJson.pages)) {
        throw new Error("Invalid JSON structure: 'pages' array is required")
      }

      const convertJsonToNodes = (widgets: any[]): JsonWidgetNode[] => {
        if (!Array.isArray(widgets)) {
          console.warn("Expected widgets array, got:", typeof widgets)
          return []
        }

        return widgets
          .map((widget: any) => {
            if (!widget || !widget.type) {
              console.warn("Invalid widget without type:", widget)
              return null
            }

            const node: JsonWidgetNode = {
              id: uuidv4(),
              type: widget.type as ComponentType,
              props: { ...widget },
              children: widget.children ? convertJsonToNodes(widget.children) : [],
            }

            delete node.props.type
            delete node.props.children

            // Enhanced icon handling - convert Flutter icon names to Lucide
            if (widget.icon) {
              if (typeof widget.icon === "string") {
                // Convert Flutter icon name to Lucide
                node.props.iconName = flutterToLucideIcon(widget.icon)
              } else if (typeof widget.icon === "object" && widget.icon.name) {
                // Handle icon objects with name property
                node.props.iconName = flutterToLucideIcon(widget.icon.name)
                if (widget.icon.color) {
                  node.props.iconColor = widget.icon.color
                }
              }
            }

            // Handle button-specific properties
            if (widget.type === "button") {
              if (widget.backgroundColor && !widget.buttonBackgroundColor) {
                node.props.buttonBackgroundColor = widget.backgroundColor
              }
              if (widget.textColor && !widget.buttonTextColor) {
                node.props.buttonTextColor = widget.textColor
              }
            }

            // Handle textField icons
            if (widget.type === "textField" && widget.icon) {
              if (typeof widget.icon === "string") {
                node.props.iconName = flutterToLucideIcon(widget.icon)
              }
            }

            // Handle listTile icons
            if (widget.type === "listTile" && widget.icon) {
              if (typeof widget.icon === "string") {
                node.props.iconName = flutterToLucideIcon(widget.icon)
              } else if (typeof widget.icon === "object") {
                node.props.icon = {
                  icon: flutterToLucideIcon(widget.icon.name || widget.icon.icon || "Circle"),
                  color: widget.icon.color || "#000000",
                }
              }
            }

            // Handle bottomNavigationBar items with icons
            if (widget.type === "bottomNavigationBar" && widget.items) {
              node.props.items = widget.items.map((item: any) => ({
                label: item.label,
                icon: flutterToLucideIcon(item.icon),
              }))
            }

            if (widget.width && typeof widget.width === "string" && widget.width.includes("px")) {
              node.props.width = Number.parseInt(widget.width)
            }
            if (widget.height && typeof widget.height === "string" && widget.height.includes("px")) {
              node.props.height = Number.parseInt(widget.height)
            }

            if (widget.align) {
              node.props.textAlign = widget.align
            }

            return node
          })
          .filter(Boolean) as JsonWidgetNode[]
      }

      const newAppData: JsonAppNode = {
        appName: parsedJson.name || "Imported App",
        theme: parsedJson.theme || { primary: "#3b82f6" },
        routes: parsedJson.routes || ["/home"],
        pages: parsedJson.pages.map((page: any) => ({
          name: page.name || "home",
          title: page.title || page.name || "Home",
          layout: page.layout || "scroll",
          positioningMode: page.mode || "absolute",
          backgroundColor: page.background || "#f8fafc",
          body: page.widgets ? convertJsonToNodes(page.widgets) : [],
          fab: page.fab
            ? {
                label: page.fab.label || "FAB",
                icon: page.fab.icon || "Plus",
                snack: page.fab.action || "Action performed",
                variant: page.fab.variant || "default",
                showLabel: page.fab.showLabel || false,
              }
            : undefined,
        })),
      }

      setAppData(newAppData)
      setSelectedPageIndex(0)
      setSelectedWidgetPath(null)
      setIsImportModalOpen(false)
      setImportJsonText("")

      toast({
        title: "Import Successful",
        description: "Your JSON has been imported successfully!",
      })

      console.log("JSON imported successfully")
    } catch (error) {
      console.error("❌ Import error:", error)
      setImportError(error instanceof Error ? error.message : "Invalid JSON format")
    }
  }, [importJsonText, toast])

  const handleClearImport = useCallback(() => {
    setImportJsonText("")
    setImportError("")
  }, [])

  // Download Flutter project handler
  const handleDownloadFlutter = useCallback(async () => {
    try {
      setIsSaving(true)

      // Parse the generated JSON to send to the API
      const jsonData = JSON.parse(generatedJson)

      const response = await fetch("https://flutterbuilderbackend-production.up.railway.app/openai/generate-flutter", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${appData.appName.replace(/\s+/g, "_").toLowerCase()}_flutter_project.zip`
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Flutter Project Downloaded",
        description: "Your Flutter project has been generated and downloaded successfully!",
      })
    } catch (error) {
      console.error("Download Flutter error:", error)
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to generate Flutter project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [generatedJson, appData.appName, toast])

  // Save project handler with API integration
  const handleSaveProject = useCallback(async () => {
    if (!user) return

    setIsSaving(true)
    try {
      if (currentProjectId) {
        // Update existing project
        const result = await updateProject(currentProjectId, appData)
        if (!result.success) {
          throw new Error(result.error || "Failed to save project")
        }
      } else {
        // Create new project
        const projectName = appData.appName || "Untitled Project"
        const result = await createProject(projectName, appData)
        if (result.success && result.project) {
          setCurrentProjectId(result.project.id)
          toast({
            title: "Project Created",
            description: `Project "${projectName}" has been created and saved!`,
          })
        } else {
          throw new Error(result.error || "Failed to create project")
        }
      }
    } catch (error) {
      console.error("Save project error:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save the project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [user, currentProjectId, appData, updateProject, createProject, toast, currentPage, currentPage.positioningMode])

  // Enhanced JSON generation (same as before)
  useEffect(() => {
    if (!currentPage || !appData || !appData.pages || appData.pages.length === 0) {
      setGeneratedJson("")
      return
    }

    const isAbsoluteMode = currentPage?.positioningMode === "absolute"
    const simpleApp = {
      name: appData.appName,
      theme: appData.theme?.primary ? { primary: appData.theme.primary } : undefined,
      routes: appData.routes || ["/home"],
      pages: appData.pages.map((page) => ({
        name: page.name,
        title: page.title !== page.name ? page.title : undefined,
        layout: page.layout !== "scroll" ? page.layout : undefined,
        mode: page.positioningMode !== "flex" ? page.positioningMode : undefined,
        background: page.backgroundColor !== "#ffffff" ? page.backgroundColor : undefined,
        fab: page.fab
          ? {
              label: page.fab.label,
              icon: lucideToFlutterIcon(page.fab.icon),
              action: page.fab.snack,
              showLabel: page.fab.showLabel,
            }
          : undefined,
        widgets: stripInternalIdsAndDefaults(page.body, page.positioningMode === "absolute"),
      })),
    }

    const cleanApp = JSON.parse(JSON.stringify(simpleApp, (key, value) => (value === undefined ? undefined : value)))
    setGeneratedJson(JSON.stringify(cleanApp, null, 2))
  }, [appData, currentPage.positioningMode])

  // Enhanced drop handler with better positioning (same as before)
  const handleDropNewOrMove = useCallback(
    (item: DragItem, targetPath: string, targetIndex: number, x?: number, y?: number) => {
      setAppData((currentAppData) => {
        const newAppData = cloneDeep(currentAppData)
        let widgetsAfterRemoval = newAppData.pages[selectedPageIndex].body
        let widgetToAdd: JsonWidgetNode | null = null

        if (item.isNew) {
          const paletteItemDef = WIDGET_PALETTE_ITEMS.find((p) => p.type === item.type)
          widgetToAdd = {
            id: uuidv4(),
            type: item.type,
            props: cloneDeep(paletteItemDef?.defaultProps || {}),
            children: isContainerType(item.type) ? [] : [],
          }
        } else if (item.sourcePath) {
          if (targetPath.startsWith(item.sourcePath) && targetPath !== item.sourcePath) {
            console.warn("[JsonBuilderPage/handleDropNewOrMove] Cannot move a container into its own child.")
            return currentAppData
          }
          const { updatedWidgets, removedWidget } = removeWidgetFromTree(widgetsAfterRemoval, item.sourcePath)
          widgetsAfterRemoval = updatedWidgets
          widgetToAdd = removedWidget
          if (selectedWidgetPath === item.sourcePath) {
            setSelectedWidgetPath(null)
          }
        }

        if (widgetToAdd) {
          if (targetPath !== ComponentTypes.PAGE && x !== undefined && y !== undefined) {
            const parentContainer = getWidgetByPath(widgetsAfterRemoval, targetPath)
            if (parentContainer) {
              const parentX = parentContainer.props.x || 0
              const parentY = parentContainer.props.y || 0
              widgetToAdd.props.x = Math.max(0, x - parentX)
              widgetToAdd.props.y = Math.max(0, y - parentY)
            }
          }

          newAppData.pages[selectedPageIndex].body = addWidgetToTree(
            widgetsAfterRemoval,
            targetPath,
            targetIndex,
            widgetToAdd,
            x,
            y,
          )
          return newAppData
        }
        return currentAppData
      })
    },
    [selectedPageIndex, selectedWidgetPath],
  )

  const handleDeleteWidget = useCallback(
    (path: string) => {
      setAppData((currentAppData) => {
        const newAppData = cloneDeep(currentAppData)
        newAppData.pages[selectedPageIndex].body = removeWidgetFromTree(
          newAppData.pages[selectedPageIndex].body,
          path,
        ).updatedWidgets
        if (selectedWidgetPath === path || (selectedWidgetPath && selectedWidgetPath.startsWith(`${path}.`))) {
          setSelectedWidgetPath(null)
        }
        return newAppData
      })
    },
    [selectedPageIndex, selectedWidgetPath],
  )

  const handleSelectWidget = useCallback((path: string | null) => {
    setSelectedWidgetPath(path)
  }, [])

  const handleMoveUp = useCallback(
    (path: string) => {
      setAppData((currentAppData) => {
        const newAppData = cloneDeep(currentAppData)
        newAppData.pages[selectedPageIndex].body = moveWidgetInTree(
          newAppData.pages[selectedPageIndex].body,
          path,
          "up",
        )
        const parts = path.split(".").map(Number)
        if (parts.length === 1) {
          const currentIndex = parts[0]
          if (currentIndex > 0) {
            setSelectedWidgetPath(`${currentIndex - 1}`)
          }
        } else {
          const currentIndex = parts[parts.length - 1]
          if (currentIndex > 0) {
            const newParts = [...parts]
            newParts[newParts.length - 1] = currentIndex - 1
            setSelectedWidgetPath(newParts.join("."))
          }
        }
        return newAppData
      })
    },
    [selectedPageIndex],
  )

  const handleMoveDown = useCallback(
    (path: string) => {
      setAppData((currentAppData) => {
        const newAppData = cloneDeep(currentAppData)
        newAppData.pages[selectedPageIndex].body = moveWidgetInTree(
          newAppData.pages[selectedPageIndex].body,
          path,
          "down",
        )
        const parts = path.split(".").map(Number)
        if (parts.length === 1) {
          const currentIndex = parts[0]
          setSelectedWidgetPath(`${currentIndex + 1}`)
        } else {
          const currentIndex = parts[parts.length - 1]
          const newParts = [...parts]
          newParts[newParts.length - 1] = currentIndex + 1
          setSelectedWidgetPath(newParts.join("."))
        }
        return newAppData
      })
    },
    [selectedPageIndex],
  )

  const handleUpdateWidgetProps = useCallback(
    (widgetPathToUpdate: string, props: Partial<JsonWidgetProps>) => {
      setAppData((currentAppData) => {
        const newAppData = cloneDeep(currentAppData)
        newAppData.pages[selectedPageIndex].body = updateWidgetPropsInTree(
          newAppData.pages[selectedPageIndex].body,
          widgetPathToUpdate,
          props,
        )
        return newAppData
      })
    },
    [selectedPageIndex],
  )

  const handleUpdateWidgetPosition = useCallback(
    (widgetPath: string, x: number, y: number) => {
      setAppData((currentAppData) => {
        const newAppData = cloneDeep(currentAppData)
        newAppData.pages[selectedPageIndex].body = updateWidgetPositionInTree(
          newAppData.pages[selectedPageIndex].body,
          widgetPath,
          x,
          y,
        )
        return newAppData
      })
    },
    [selectedPageIndex],
  )

  const handleUpdateWidgetSize = useCallback(
    (widgetPath: string, width: number, height: number) => {
      setAppData((currentAppData) => {
        const newAppData = cloneDeep(currentAppData)
        newAppData.pages[selectedPageIndex].body = updateWidgetSizeInTree(
          newAppData.pages[selectedPageIndex].body,
          widgetPath,
          width,
          height,
        )
        return newAppData
      })
    },
    [selectedPageIndex],
  )

  const handleSelectPage = useCallback(
    (pageName: string) => {
      const index = appData.pages.findIndex((p) => p.name === pageName)
      if (index !== -1) {
        setSelectedPageIndex(index)
        setSelectedWidgetPath(null)
      }
    },
    [appData.pages],
  )

  // Page management functions
  const handleCreatePage = useCallback(() => {
    const newPageName = prompt("Enter page name:", "")

    if (!newPageName || newPageName.trim() === "") {
      return
    }

    const pageName = newPageName.trim().toLowerCase()
    const routePath = `/${pageName}`

    const newPage: JsonPageNode = {
      name: pageName,
      title: newPageName.trim(),
      layout: "scroll",
      positioningMode: "absolute",
      backgroundColor: "#f8fafc",
      body: [],
    }

    setAppData((currentAppData) => {
      const newAppData = cloneDeep(currentAppData)
      newAppData.pages.push(newPage)

      if (!newAppData.routes) {
        newAppData.routes = []
      }
      if (!newAppData.routes.includes(routePath)) {
        newAppData.routes.push(routePath)
      }

      return newAppData
    })

    setSelectedPageIndex(appData.pages.length)
    setSelectedWidgetPath(null)
  }, [appData.pages.length])

  const handleDeletePage = useCallback(
    (pageIndex: number) => {
      if (appData.pages.length <= 1) {
        alert("Cannot delete the last page")
        return
      }

      setAppData((currentAppData) => {
        const newAppData = cloneDeep(currentAppData)
        const pageName = newAppData.pages[pageIndex].name
        const routePath = `/${pageName}`

        if (newAppData.routes) {
          newAppData.routes = newAppData.routes.filter((route) => route !== routePath)
        }

        newAppData.pages.splice(pageIndex, 1)
        return newAppData
      })

      if (selectedPageIndex >= pageIndex) {
        setSelectedPageIndex(Math.max(0, selectedPageIndex - 1))
      }
      setSelectedWidgetPath(null)
    },
    [appData.pages.length, selectedPageIndex],
  )

  const handleRenamePage = useCallback((pageIndex: number, newName: string) => {
    setAppData((currentAppData) => {
      const newAppData = cloneDeep(currentAppData)
      const oldName = newAppData.pages[pageIndex].name
      const oldRoutePath = `/${oldName}`
      const pageName = newName.trim().toLowerCase()

      newAppData.pages[pageIndex].name = pageName
      const newRoutePath = `/${pageName}`

      if (newAppData.routes) {
        const routeIndex = newAppData.routes.indexOf(oldRoutePath)
        if (routeIndex >= 0) {
          newAppData.routes[routeIndex] = newRoutePath
        } else if (!newAppData.routes.includes(newRoutePath)) {
          newAppData.routes.push(newRoutePath)
        }
      }

      return newAppData
    })
  }, [])

  // Update the handleUpdatePageProps function to handle mode changes
  const handleUpdatePageProps = useCallback((pageIndex: number, props: Partial<JsonPageNode>) => {
    setAppData((currentAppData) => {
      const newAppData = cloneDeep(currentAppData)
      const currentPage = newAppData.pages[pageIndex]
      const oldMode = currentPage.positioningMode
      const newMode = props.positioningMode

      // If we're changing positioning mode, store it locally
      if (newMode && newMode !== oldMode) {
        // Store the positioning mode preference locally
        setLocalPositioningModes((prev) => ({
          ...prev,
          [currentPage.name]: newMode,
        }))

        // Adjust widgets for the new mode
        newAppData.pages[pageIndex].body = adjustWidgetsForModeChange(newAppData.pages[pageIndex].body, newMode)

        // Update the mode in the app data
        newAppData.pages[pageIndex].positioningMode = newMode

        // Clear selected widget when mode changes
        setSelectedWidgetPath(null)
      }

      // For all page property changes, update the app data
      newAppData.pages[pageIndex] = { ...currentPage, ...props }
      return newAppData
    })
  }, [])

  /* ⬇️  Envía doc al padre en cada cambio LOCAL */
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      // saltar primer render
      first.current = false
      return
    }

    // Solo notificar cambios si hay un callback
    if (onDataChange) {
      // Send the complete app data without cleaning
      onDataChange(appData)
    }
  }, [appData, onDataChange])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
        <div className="flex items-center gap-2 p-3 bg-white border-b shadow-sm">
          {onBackToDashboard && (
            <Button variant="outline" size="sm" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          )}

          <AIImportModal onImport={handleAIImport} />

          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import App from JSON
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Paste your JSON here:</label>
                  <Textarea
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder={`{
  "name": "MyApp",
  "pages": [
    {
      "name": "home",
      "title": "Home Page",
      "mode": "absolute",
      "widgets": [
        {
          "type": "text",
          "text": "Hello World",
          "x": 50,
          "y": 50
        }
      ]
    }
  ]
}`}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>

                {importError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{importError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleClearImport}>
                    Clear
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleImportJson} disabled={!importJsonText.trim()}>
                      Import & Build
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleSaveProject} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Project
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownloadFlutter} disabled={isSaving || !generatedJson}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Flutter
              </>
            )}
          </Button>

          {!isNewProject && (
            <>
              <div className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-sm border">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-gray-600">{isConnected ? "Conectado" : "Desconectado"}</span>
              </div>

              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={onCopyLink}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Compartir
                  </>
                )}
              </Button>
            </>
          )}

          <div className="text-sm text-gray-600 flex items-center gap-4 ml-auto">
            <span>
              App: <strong className="text-blue-600">{appData.appName}</strong>
            </span>
            <span>
              Pages: <strong className="text-green-600">{appData.pages.length}</strong>
            </span>
            <span>
              Widgets: <strong className="text-purple-600">{currentPageBody.length}</strong>
            </span>
            <span>
              Mode: <strong className="text-orange-600">{currentPage.positioningMode}</strong>
            </span>
            {currentProjectId && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Saved</span>}
          </div>
        </div>

        <div className="flex flex-1 h-[calc(100vh-57px)] overflow-hidden">
          <WidgetSidebar />
          <main className="flex-grow flex flex-col p-2 overflow-hidden">
            <CanvasArea
              pageBody={currentPageBody}
              onDrop={handleDropNewOrMove}
              onMove={handleDropNewOrMove}
              onDelete={handleDeleteWidget}
              onSelectWidget={handleSelectWidget}
              selectedWidgetPath={selectedWidgetPath}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              pages={appData.pages}
              selectedPageIndex={selectedPageIndex}
              onSelectPage={handleSelectPage}
              onCreatePage={handleCreatePage}
              onDeletePage={handleDeletePage}
              onRenamePage={handleRenamePage}
              onUpdatePageProps={handleUpdatePageProps}
              onUpdateWidgetPosition={handleUpdateWidgetPosition}
              onUpdateWidgetSize={handleUpdateWidgetSize}
            />
          </main>
          <PropertiesPanel
            selectedWidget={selectedWidget}
            selectedWidgetPath={selectedWidgetPath}
            onUpdateWidgetProps={handleUpdateWidgetProps}
            generatedJson={generatedJson}
            currentPage={currentPage}
            onUpdatePageProps={(props) => handleUpdatePageProps(selectedPageIndex, props)}
          />
        </div>
      </div>
    </DndProvider>
  )
}
