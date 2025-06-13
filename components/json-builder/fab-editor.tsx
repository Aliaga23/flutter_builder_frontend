"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPicker } from "./icon-picker"
import { PlusIcon } from "lucide-react"
import * as Icons from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface FabEditorProps {
  label?: string
  icon?: string
  snack?: string
  variant?: string
  showLabel?: boolean
  onChange: (props: { label?: string; icon?: string; snack?: string; variant?: string; showLabel?: boolean }) => void
}

export function FabEditor({ label, icon, snack, variant, showLabel, onChange }: FabEditorProps) {
  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleChange = (key: string, value: string | boolean) => {
    onChange({ label, icon, snack, variant, showLabel, [key]: value })
  }

  const IconComponent =
    icon && Icons[icon as keyof typeof Icons] ? (Icons[icon as keyof typeof Icons] as any) : PlusIcon

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">FAB Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Button Label</label>
          <Input
            value={label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="FAB"
            className="h-7 text-xs"
          />
        </div>

        {/* Show Label Toggle */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showLabel"
              checked={showLabel || false}
              onCheckedChange={(checked) => handleChange("showLabel", checked)}
            />
            <label htmlFor="showLabel" className="text-xs font-medium text-gray-600">
              Show label on button
            </label>
          </div>
        </div>

        {/* Icon Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Icon</label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 flex items-center gap-2"
              onClick={() => setShowIconPicker(!showIconPicker)}
            >
              <IconComponent className="h-4 w-4" />
              <span className="text-xs">{icon || "Plus"}</span>
            </Button>
            <Input
              value={icon || ""}
              onChange={(e) => handleChange("icon", e.target.value)}
              placeholder="Plus"
              className="h-8 text-xs flex-1"
            />
          </div>
          {showIconPicker && (
            <IconPicker
              selectedIcon={icon}
              onIconSelect={(iconName) => {
                handleChange("icon", iconName)
                setShowIconPicker(false)
              }}
            />
          )}
        </div>

        {/* Variant */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Style</label>
          <Select value={variant || "default"} onValueChange={(value) => handleChange("variant", value)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Blue)</SelectItem>
              <SelectItem value="secondary">Secondary (Gray)</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
              <SelectItem value="destructive">Destructive (Red)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Snackbar Message */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Snackbar Message</label>
          <Input
            value={snack || ""}
            onChange={(e) => handleChange("snack", e.target.value)}
            placeholder="Action performed!"
            className="h-7 text-xs"
          />
          <p className="text-xs text-gray-500">Message shown when FAB is tapped</p>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Preview</label>
          <div className="p-3 bg-gray-50 rounded-md flex justify-center">
            <Button variant={(variant as any) || "default"} size="icon" className="rounded-full shadow-lg">
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                {showLabel && label && <span className="text-sm">{label}</span>}
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
