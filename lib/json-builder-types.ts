import type { LucideIcon } from "lucide-react"

export const ComponentTypes = {
  PAGE: "page",
  CONTAINER: "container",
  ROW: "row",
  COLUMN: "column",
  STACK: "stack",
  CARD: "card",
  LIST_VIEW: "listView",
  GRID_VIEW: "gridView",
  DRAWER: "drawer",
  APP_BAR: "appBar",
  BOTTOM_NAVIGATION_BAR: "bottomNavigationBar",
  TAB_BAR: "tabBar",

  TEXT: "text",
  HEADING: "heading",
  IMAGE: "image",
  ICON: "icon",
  BUTTON: "button",
  FLOATING_ACTION_BUTTON: "floatingActionButton",
  TEXT_FIELD: "textField",
  MULTILINE_TEXT_FIELD: "multilineTextField",
  CHECKBOX: "checkbox",
  SWITCH: "switch",
  RADIO_GROUP: "radioGroup",
  DROPDOWN: "dropdown",
  SLIDER: "slider",
  DATE_PICKER: "datePicker",
  PROGRESS_INDICATOR: "progressIndicator",
  CIRCLE_AVATAR: "circleAvatar",
  CHIP: "chip",
  DIVIDER: "divider",
  BADGE: "badge",
  ALERT_DIALOG: "alertDialog",
  LIST_TILE: "listTile",
  DATA_TABLE: "dataTable",
  AVATAR: "avatar",
} as const

export type ComponentType = (typeof ComponentTypes)[keyof typeof ComponentTypes]

export interface PropertyDefinition {
  name: string
  label: string
  type:
    | "string"
    | "number"
    | "boolean"
    | "color"
    | "select"
    | "json"
    | "table"
    | "dropdown"
    | "icon"
    | "fab"
    | "bottomNav"
  options?: { label: string; value: string | number }[]
  defaultValue?: any
}

export interface JsonWidgetProps {
  [key: string]: any
  text?: string
  size?: number
  bold?: boolean
  paddingV?: number
  align?: string
  label?: string
  src?: string
  alt?: string
  placeholder?: string
  padding?: number | string
  margin?: number | string
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: string
  width?: string | number
  height?: string | number
  minHeight?: string | number
  mainAxisAlignment?: string
  crossAxisAlignment?: string
  gap?: number
  leadingIcon?: string
  trailingIcon?: string
  title?: string
  subtitle?: string
  axis?: "horizontal" | "vertical"
  icon?: { icon: string; color: string } | string
  check?: boolean
  snack?: string
  value?: string | number | boolean
  options?: string
  avatar?: string
  columns?: string[]
  rows?: string[][]
  iconName?: string
  iconSize?: number
  iconColor?: string
  elevation?: number
  items?: string[] | any[]
  selectedItem?: string
  selectedIndex?: number
  hintText?: string
  maxLines?: number
  min?: number
  max?: number
  currentStep?: number
  totalSteps?: number
  dialogTitle?: string
  dialogContent?: string
  confirmButtonText?: string
  cancelButtonText?: string
  variant?: string
  tableData?: any
  dropdownData?: any
  radioOptions?: any
  iconData?: any
  fabData?: any
  bottomNavData?: any
  selectedItemColor?: string
  // Nuevas propiedades para posicionamiento libre
  x?: number
  y?: number
  zIndex?: number
  routes?: string[]
  showLabel?: boolean
  // Propiedades de navegación (ya están pero confirmar)
  route?: string
  action?: string
}

export interface JsonWidgetNode {
  id: string
  type: ComponentType
  props: JsonWidgetProps
  children?: JsonWidgetNode[]
}

export interface JsonPageNode {
  name: string
  title: string
  backgroundColor?: string
  layout?: string
  body: JsonWidgetNode[]
  fab?: { label: string; icon: string; snack: string }
  // Nueva propiedad para el modo de posicionamiento
  positioningMode?: "flex" | "absolute"
}

export interface JsonAppNode {
  appName: string
  theme?: { primary: string }
  routes?: string[] // Agregar rutas disponibles
  pages: JsonPageNode[]
}

export interface WidgetPaletteItem {
  type: ComponentType
  label: string
  icon: LucideIcon
  defaultProps: JsonWidgetProps
  isContainer: boolean
  allowedChildren?: ComponentType[]
  iconColorClass?: string
  editableProps?: PropertyDefinition[]
}

export interface DragItem {
  type: ComponentType
  id?: string
  isNew: boolean
  defaultProps?: JsonWidgetProps
  isContainer?: boolean
  sourcePath?: string
  // Nuevas propiedades para drag libre
  x?: number
  y?: number
}

export const CONTAINER_TYPES: ComponentType[] = [
  ComponentTypes.PAGE,
  ComponentTypes.CONTAINER,
  ComponentTypes.ROW,
  ComponentTypes.COLUMN,
  ComponentTypes.STACK,
  ComponentTypes.CARD,
  ComponentTypes.LIST_VIEW,
  ComponentTypes.GRID_VIEW,
  ComponentTypes.DRAWER,
  // Removidos: APP_BAR, BOTTOM_NAVIGATION_BAR, TAB_BAR, ALERT_DIALOG
  // Estos no son containers en Flutter
]

export function isContainerType(type: ComponentType): boolean {
  return CONTAINER_TYPES.includes(type)
}
