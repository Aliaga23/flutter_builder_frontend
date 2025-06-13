"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { lucideToFlutterIcon } from "@/lib/icon-mapping"
import * as Icons from "lucide-react"

interface IconPickerProps {
  selectedIcon?: string
  onIconSelect: (iconName: string) => void
}

// Popular icons for quick access
const POPULAR_ICONS = [
  "Plus",
  "Minus",
  "X",
  "Check",
  "ChevronLeft",
  "ChevronRight",
  "ChevronUp",
  "ChevronDown",
  "Home",
  "User",
  "Settings",
  "Search",
  "Heart",
  "Star",
  "Bell",
  "Mail",
  "Phone",
  "Camera",
  "Image",
  "Video",
  "Music",
  "Download",
  "Upload",
  "Share",
  "Edit",
  "Trash2",
  "Save",
  "Copy",
  "Cut",
  "Paste",
  "Undo",
  "Redo",
  "Play",
  "Pause",
  "Stop",
  "SkipForward",
  "SkipBack",
  "Volume2",
  "VolumeX",
  "Wifi",
  "Battery",
  "Bluetooth",
  "Signal",
  "MapPin",
  "Calendar",
  "Clock",
  "ShoppingCart",
  "CreditCard",
  "DollarSign",
  "TrendingUp",
  "BarChart3",
  "MessageCircle",
  "Send",
  "Eye",
  "EyeOff",
  "Lock",
  "Unlock",
  "Key",
  "Globe",
  "Link",
  "ExternalLink",
  "Bookmark",
  "Tag",
  "Flag",
  "Award",
]

export function IconPicker({ selectedIcon, onIconSelect }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter icons based on search term
  const filteredIcons = POPULAR_ICONS.filter((iconName) => iconName.toLowerCase().includes(searchTerm.toLowerCase()))

  // Get all available icons if showing all
  const allIconNames: string[] = []

  const iconsToShow = filteredIcons

  const renderIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any
    if (!IconComponent) return null

    const flutterIconName = lucideToFlutterIcon(iconName)

    return (
      <Button
        key={iconName}
        variant={selectedIcon === iconName ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-16 w-16 p-2 flex flex-col items-center justify-center gap-1",
          selectedIcon === iconName && "bg-blue-600 text-white",
        )}
        onClick={() => onIconSelect(iconName)}
        title={`${iconName} → ${flutterIconName}`}
      >
        <IconComponent className="h-5 w-5" />
        <span className="text-xs truncate w-full text-center">{flutterIconName}</span>
      </Button>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Icon Picker (Flutter Names)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Input
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-xs"
          />
          <Button size="sm" variant="default" className="h-6 px-2 text-xs w-fit" disabled>
            Popular Icons (Flutter Names)
          </Button>
        </div>

        {/* Selected Icon Preview */}
        {selectedIcon && (
          <div className="p-2 bg-gray-50 rounded-md flex items-center gap-2">
            <span className="text-xs font-medium">Selected:</span>
            {(() => {
              const IconComponent = Icons[selectedIcon as keyof typeof Icons] as any
              const flutterName = lucideToFlutterIcon(selectedIcon)
              return IconComponent ? (
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs font-mono bg-blue-100 px-1 rounded">{flutterName}</span>
                </div>
              ) : (
                <span className="text-xs text-red-500">Invalid icon</span>
              )
            })()}
          </div>
        )}

        {/* Icons Grid */}
        <ScrollArea className="h-48">
          <div className="grid grid-cols-3 gap-2">{iconsToShow.map(renderIcon)}</div>
          {iconsToShow.length === 0 && (
            <div className="text-center text-xs text-gray-500 py-4">No icons found for "{searchTerm}"</div>
          )}
        </ScrollArea>

        {/* Manual Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Or type Lucide icon name:</label>
          <Input
            placeholder="e.g., Heart, Star, Settings"
            value={selectedIcon || ""}
            onChange={(e) => onIconSelect(e.target.value)}
            className="h-7 text-xs"
          />
          {selectedIcon && (
            <div className="text-xs text-gray-500">
              Flutter equivalent:{" "}
              <span className="font-mono bg-gray-100 px-1 rounded">{lucideToFlutterIcon(selectedIcon)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
