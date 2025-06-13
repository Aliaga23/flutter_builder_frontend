// Mapeo de iconos de Lucide React a Flutter Icons
export const LUCIDE_TO_FLUTTER_ICON_MAP: Record<string, string> = {
  // Navegación básica
  Home: "home",
  ArrowLeft: "arrow_back",
  ArrowRight: "arrow_forward",
  ArrowUp: "keyboard_arrow_up",
  ArrowDown: "keyboard_arrow_down",
  ChevronLeft: "chevron_left",
  ChevronRight: "chevron_right",
  ChevronUp: "expand_less",
  ChevronDown: "expand_more",
  Menu: "menu",
  MoreVertical: "more_vert",
  MoreHorizontal: "more_horiz",

  // Acciones comunes
  Plus: "add",
  Minus: "remove",
  X: "close",
  Check: "check",
  Edit: "edit",
  Delete: "delete",
  Trash2: "delete",
  Save: "save",
  Download: "download",
  Upload: "upload",
  Share: "share",
  Copy: "content_copy",
  Cut: "content_cut",
  Paste: "content_paste",
  Undo: "undo",
  Redo: "redo",
  Refresh: "refresh",

  // Usuario y perfil
  User: "person",
  UserCircle: "account_circle",
  UserCircle2: "account_circle",
  Users: "group",
  UserPlus: "person_add",
  UserMinus: "person_remove",

  // Comunicación
  Mail: "email",
  Phone: "phone",
  MessageCircle: "chat",
  MessageSquare: "comment",
  Send: "send",
  Bell: "notifications",
  BellOff: "notifications_off",

  // Multimedia
  Camera: "camera_alt",
  Image: "image",
  Video: "videocam",
  Music: "music_note",
  Volume2: "volume_up",
  VolumeX: "volume_off",
  Play: "play_arrow",
  Pause: "pause",
  Stop: "stop",
  SkipForward: "skip_next",
  SkipBack: "skip_previous",

  // Configuración y herramientas
  Settings: "settings",
  Cog: "settings",
  Tool: "build",
  Wrench: "build",
  Key: "vpn_key",
  Lock: "lock",
  Unlock: "lock_open",
  Shield: "security",

  // Navegación y ubicación
  MapPin: "location_on",
  Map: "map",
  Navigation: "navigation",
  Compass: "explore",
  Globe: "public",
  Wifi: "wifi",
  WifiOff: "wifi_off",
  Bluetooth: "bluetooth",
  Signal: "signal_cellular_4_bar",

  // Tiempo y calendario
  Calendar: "event",
  CalendarDays: "date_range",
  Clock: "access_time",
  Timer: "timer",
  Stopwatch: "timer",
  AlarmClock: "alarm",

  // Comercio y finanzas
  ShoppingCart: "shopping_cart",
  ShoppingBag: "shopping_bag",
  CreditCard: "credit_card",
  DollarSign: "attach_money",
  Euro: "euro_symbol",
  Coins: "monetization_on",

  // Datos y análisis
  BarChart: "bar_chart",
  BarChart3: "analytics",
  LineChart: "show_chart",
  PieChart: "pie_chart",
  TrendingUp: "trending_up",
  TrendingDown: "trending_down",
  Activity: "timeline",

  // Estados y feedback
  Heart: "favorite",
  HeartOff: "favorite_border",
  Star: "star",
  StarOff: "star_border",
  ThumbsUp: "thumb_up",
  ThumbsDown: "thumb_down",
  Smile: "sentiment_satisfied",
  Frown: "sentiment_dissatisfied",

  // Alertas y notificaciones
  AlertTriangle: "warning",
  AlertCircle: "error",
  Info: "info",
  CheckCircle: "check_circle",
  XCircle: "cancel",
  HelpCircle: "help",

  // Archivos y documentos
  File: "description",
  FileText: "article",
  Folder: "folder",
  FolderOpen: "folder_open",
  Archive: "archive",
  Bookmark: "bookmark",
  BookmarkOff: "bookmark_border",
  Tag: "label",
  Flag: "flag",

  // Conectividad y enlaces
  Link: "link",
  ExternalLink: "open_in_new",
  Unlink: "link_off",
  Anchor: "anchor",
  Paperclip: "attach_file",

  // Visibilidad y privacidad
  Eye: "visibility",
  EyeOff: "visibility_off",
  Search: "search",
  Filter: "filter_list",
  SortAsc: "sort",
  SortDesc: "sort",

  // Formato y edición
  Bold: "format_bold",
  Italic: "format_italic",
  Underline: "format_underlined",
  AlignLeft: "format_align_left",
  AlignCenter: "format_align_center",
  AlignRight: "format_align_right",
  AlignJustify: "format_align_justify",

  // Transporte
  Car: "directions_car",
  Truck: "local_shipping",
  Plane: "flight",
  Train: "train",
  Bus: "directions_bus",
  Bike: "directions_bike",

  // Clima
  Sun: "wb_sunny",
  Moon: "brightness_3",
  Cloud: "cloud",
  CloudRain: "cloud",
  Zap: "flash_on",

  // Formas básicas
  Circle: "radio_button_unchecked",
  Square: "crop_square",
  Triangle: "change_history",
  Diamond: "diamond",

  // Otros iconos comunes
  Award: "emoji_events",
  Gift: "card_giftcard",
  Coffee: "local_cafe",
  Pizza: "local_pizza",
  Gamepad2: "sports_esports",
  Headphones: "headset",
  Mic: "mic",
  MicOff: "mic_off",
  Battery: "battery_full",
  BatteryLow: "battery_alert",
  Power: "power_settings_new",
  Zap: "bolt",
  Flame: "local_fire_department",
  Droplet: "water_drop",
  Thermometer: "device_thermostat",
  Wind: "air",
  Umbrella: "beach_access",
  Palette: "palette",
  Brush: "brush",
  Scissors: "content_cut",
  Ruler: "straighten",
  Calculator: "calculate",
  Book: "menu_book",
  GraduationCap: "school",
  Building: "business",
  Factory: "precision_manufacturing",
  Hospital: "local_hospital",
  Hotel: "hotel",
  Store: "store",
  Warehouse: "warehouse",
}

// Mapeo inverso: de Flutter a Lucide React
export const FLUTTER_TO_LUCIDE_ICON_MAP: Record<string, string> = {}

// Generar el mapeo inverso automáticamente
Object.entries(LUCIDE_TO_FLUTTER_ICON_MAP).forEach(([lucide, flutter]) => {
  FLUTTER_TO_LUCIDE_ICON_MAP[flutter] = lucide
})

// Función para convertir nombre de Lucide a Flutter con validación
export function lucideToFlutterIcon(lucideIconName: string | undefined | null): string {
  // Validar que el parámetro no sea undefined, null o vacío
  if (!lucideIconName || typeof lucideIconName !== "string") {
    console.warn("[lucideToFlutterIcon] Invalid icon name provided:", lucideIconName)
    return "help" // Icono por defecto
  }

  // Limpiar el nombre del icono
  const cleanIconName = lucideIconName.trim()

  if (!cleanIconName) {
    console.warn("[lucideToFlutterIcon] Empty icon name provided")
    return "help" // Icono por defecto
  }

  // Si el nombre ya parece ser un nombre de icono de Flutter (todo minúsculas con guiones bajos),
  // devolverlo directamente
  if (/^[a-z0-9_]+$/.test(cleanIconName)) {
    return cleanIconName
  }

  // Buscar en el mapeo
  const flutterIcon = LUCIDE_TO_FLUTTER_ICON_MAP[cleanIconName]

  if (flutterIcon) {
    return flutterIcon
  }

  // Si no se encuentra, convertir a lowercase como fallback
  const fallbackIcon = cleanIconName.toLowerCase().replace(/\s+/g, "_")
  console.warn(`[lucideToFlutterIcon] Icon "${cleanIconName}" not found in mapping, using fallback: "${fallbackIcon}"`)

  return fallbackIcon
}

// Nueva función para convertir de Flutter a Lucide React
export function flutterToLucideIcon(flutterIconName: string | undefined | null): string {
  // Validar que el parámetro no sea undefined, null o vacío
  if (!flutterIconName || typeof flutterIconName !== "string") {
    console.warn("[flutterToLucideIcon] Invalid icon name provided:", flutterIconName)
    return "HelpCircle" // Icono por defecto en Lucide
  }

  // Limpiar el nombre del icono
  const cleanIconName = flutterIconName.trim()

  if (!cleanIconName) {
    console.warn("[flutterToLucideIcon] Empty icon name provided")
    return "HelpCircle" // Icono por defecto en Lucide
  }

  // Si el nombre ya parece ser un nombre de Lucide (PascalCase),
  // devolverlo directamente
  if (/^[A-Z][a-zA-Z0-9]*$/.test(cleanIconName)) {
    return cleanIconName
  }

  // Buscar en el mapeo inverso
  const lucideIcon = FLUTTER_TO_LUCIDE_ICON_MAP[cleanIconName]

  if (lucideIcon) {
    return lucideIcon
  }

  // Si no se encuentra, intentar convertir de snake_case a PascalCase como fallback
  const fallbackIcon = cleanIconName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")

  console.warn(`[flutterToLucideIcon] Icon "${cleanIconName}" not found in mapping, using fallback: "${fallbackIcon}"`)

  return fallbackIcon || "HelpCircle"
}

// Función para obtener todos los iconos disponibles con sus equivalentes en Flutter
export function getAllIconMappings(): Array<{ lucide: string; flutter: string }> {
  return Object.entries(LUCIDE_TO_FLUTTER_ICON_MAP).map(([lucide, flutter]) => ({
    lucide,
    flutter,
  }))
}
