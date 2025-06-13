"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, Trash2Icon, GripVerticalIcon } from "lucide-react"
import { IconPicker } from "./icon-picker"
import * as Icons from "lucide-react"

interface BottomNavItem {
  label: string
  icon: string
}

interface BottomNavRoute {
  route: string
  label: string
  icon: string
}

interface BottomNavEditorProps {
  items: string[] | BottomNavItem[]
  selectedIndex?: number
  backgroundColor?: string
  textColor?: string
  selectedItemColor?: string
  routes?: string[]
  onChange: (props: {
    items: BottomNavItem[]
    selectedIndex?: number
    backgroundColor?: string
    textColor?: string
    selectedItemColor?: string
    routes?: string[]
  }) => void
}

export function BottomNavEditor({
  items,
  selectedIndex,
  backgroundColor,
  textColor,
  selectedItemColor,
  routes,
  onChange,
}: BottomNavEditorProps) {
  // Convert string array to BottomNavItem array if needed
  const normalizedItems: BottomNavItem[] = items.map((item, index) => {
    if (typeof item === "string") {
      const defaultIcons = ["Home", "Search", "Heart", "User", "Settings"]
      return {
        label: item,
        icon: defaultIcons[index] || "Circle",
      }
    }
    return item
  })

  const [localItems, setLocalItems] = useState<BottomNavItem[]>(normalizedItems)
  const [localSelectedIndex, setLocalSelectedIndex] = useState(selectedIndex || 0)
  const [showIconPicker, setShowIconPicker] = useState<number | null>(null)
  const [localRoutes, setLocalRoutes] = useState<string[]>(routes || [])

  const handleChange = () => {
    onChange({
      items: localItems,
      selectedIndex: localSelectedIndex,
      backgroundColor,
      textColor,
      selectedItemColor,
      routes: localRoutes,
    })
  }

  const handleItemChange = (index: number, field: keyof BottomNavItem, value: string) => {
    const newItems = [...localItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setLocalItems(newItems)
    setTimeout(handleChange, 0)
  }

  const addItem = () => {
    const newItems = [...localItems, { label: `Tab ${localItems.length + 1}`, icon: "Circle" }]
    setLocalItems(newItems)
    setTimeout(handleChange, 0)
  }

  const removeItem = (index: number) => {
    if (localItems.length <= 1) return
    const newItems = localItems.filter((_, i) => i !== index)
    setLocalItems(newItems)
    if (localSelectedIndex >= newItems.length) {
      setLocalSelectedIndex(0)
    }
    setTimeout(handleChange, 0)
  }

  const setSelectedItem = (index: number) => {
    setLocalSelectedIndex(index)
    setTimeout(handleChange, 0)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Bottom Navigation Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">Navigation Items</label>
            <Button size="sm" variant="outline" onClick={addItem} className="h-6 px-2">
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {localItems.map((item, index) => {
              const IconComponent = (Icons[item.icon as keyof typeof Icons] as any) || Icons.Circle
              return (
                <div key={index} className="border rounded-md p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVerticalIcon className="h-3 w-3 text-gray-400" />
                    <Button
                      size="sm"
                      variant={localSelectedIndex === index ? "default" : "outline"}
                      onClick={() => setSelectedItem(index)}
                      className="h-6 px-2 text-xs"
                    >
                      {localSelectedIndex === index ? "Selected" : "Select"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      disabled={localItems.length <= 1}
                      className="h-6 w-6 p-0 ml-auto"
                    >
                      <Trash2Icon className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Label</label>
                      <Input
                        value={item.label}
                        onChange={(e) => handleItemChange(index, "label", e.target.value)}
                        className="h-6 text-xs"
                        placeholder="Tab name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Icon</label>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 flex items-center gap-1"
                          onClick={() => setShowIconPicker(showIconPicker === index ? null : index)}
                        >
                          <IconComponent className="h-3 w-3" />
                          <span className="text-xs">{item.icon}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {showIconPicker === index && (
                    <IconPicker
                      selectedIcon={item.icon}
                      onIconSelect={(iconName) => {
                        handleItemChange(index, "icon", iconName)
                        setShowIconPicker(null)
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Routes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">Routes (Optional)</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newRoutes = [...localRoutes, `/route${localRoutes.length + 1}`]
                setLocalRoutes(newRoutes)
                setTimeout(handleChange, 0)
              }}
              className="h-6 px-2"
            >
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {localRoutes.map((route, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-8">#{index + 1}</span>
                <Input
                  value={route}
                  onChange={(e) => {
                    const newRoutes = [...localRoutes]
                    newRoutes[index] = e.target.value
                    setLocalRoutes(newRoutes)
                    setTimeout(handleChange, 0)
                  }}
                  className="h-6 text-xs flex-1"
                  placeholder={`/route${index + 1}`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const newRoutes = localRoutes.filter((_, i) => i !== index)
                    setLocalRoutes(newRoutes)
                    setTimeout(handleChange, 0)
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Trash2Icon className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
            {localRoutes.length === 0 && <p className="text-xs text-gray-500 italic">No routes defined</p>}
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600">Background</label>
            <Input
              type="color"
              value={backgroundColor || "#ffffff"}
              onChange={(e) =>
                onChange({
                  items: localItems,
                  selectedIndex: localSelectedIndex,
                  backgroundColor: e.target.value,
                  textColor,
                  selectedItemColor,
                  routes: localRoutes,
                })
              }
              className="h-7 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Text Color</label>
            <Input
              type="color"
              value={textColor || "#000000"}
              onChange={(e) =>
                onChange({
                  items: localItems,
                  selectedIndex: localSelectedIndex,
                  backgroundColor,
                  textColor: e.target.value,
                  selectedItemColor,
                  routes: localRoutes,
                })
              }
              className="h-7 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Selected</label>
            <Input
              type="color"
              value={selectedItemColor || "#2563eb"}
              onChange={(e) =>
                onChange({
                  items: localItems,
                  selectedIndex: localSelectedIndex,
                  backgroundColor,
                  textColor,
                  selectedItemColor: e.target.value,
                  routes: localRoutes,
                })
              }
              className="h-7 w-full"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Preview</label>
          <div
            className="border rounded-md p-2 flex justify-around items-center"
            style={{ backgroundColor: backgroundColor || "#ffffff" }}
          >
            {localItems.map((item, index) => {
              const IconComponent = (Icons[item.icon as keyof typeof Icons] as any) || Icons.Circle
              const isSelected = index === localSelectedIndex
              return (
                <div key={index} className="flex flex-col items-center gap-1">
                  <IconComponent
                    className="h-4 w-4"
                    style={{
                      color: isSelected ? selectedItemColor || "#2563eb" : textColor || "#000000",
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      color: isSelected ? selectedItemColor || "#2563eb" : textColor || "#000000",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
