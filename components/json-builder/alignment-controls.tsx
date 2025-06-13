"use client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  StretchHorizontalIcon,
  StretchVerticalIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AlignmentControlsProps {
  textAlign?: string
  alignSelf?: string
  mainAxisAlignment?: string
  crossAxisAlignment?: string
  onTextAlignChange: (value: string) => void
  onAlignSelfChange: (value: string) => void
  onMainAxisAlignmentChange?: (value: string) => void
  onCrossAxisAlignmentChange?: (value: string) => void
  isContainer?: boolean
}

export function AlignmentControls({
  textAlign = "left",
  alignSelf = "auto",
  mainAxisAlignment = "flex-start",
  crossAxisAlignment = "stretch",
  onTextAlignChange,
  onAlignSelfChange,
  onMainAxisAlignmentChange,
  onCrossAxisAlignmentChange,
  isContainer = false,
}: AlignmentControlsProps) {
  const textAlignOptions = [
    { value: "left", icon: AlignLeftIcon, label: "Left" },
    { value: "center", icon: AlignCenterIcon, label: "Center" },
    { value: "right", icon: AlignRightIcon, label: "Right" },
    { value: "justify", icon: AlignJustifyIcon, label: "Justify" },
  ]

  const alignSelfOptions = [
    { value: "auto", icon: StretchHorizontalIcon, label: "Auto" },
    { value: "flex-start", icon: AlignLeftIcon, label: "Start" },
    { value: "center", icon: AlignCenterIcon, label: "Center" },
    { value: "flex-end", icon: AlignRightIcon, label: "End" },
    { value: "stretch", icon: StretchVerticalIcon, label: "Stretch" },
  ]

  const mainAxisOptions = [
    { value: "flex-start", icon: AlignLeftIcon, label: "Start" },
    { value: "center", icon: AlignCenterIcon, label: "Center" },
    { value: "flex-end", icon: AlignRightIcon, label: "End" },
    { value: "space-between", icon: StretchHorizontalIcon, label: "Space Between" },
    { value: "space-around", icon: StretchHorizontalIcon, label: "Space Around" },
    { value: "space-evenly", icon: StretchHorizontalIcon, label: "Space Evenly" },
  ]

  const crossAxisOptions = [
    { value: "flex-start", icon: AlignLeftIcon, label: "Start" },
    { value: "center", icon: AlignCenterIcon, label: "Center" },
    { value: "flex-end", icon: AlignRightIcon, label: "End" },
    { value: "stretch", icon: StretchVerticalIcon, label: "Stretch" },
    { value: "baseline", icon: StretchHorizontalIcon, label: "Baseline" },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Alignment Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Alignment */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600">Text Alignment</Label>
          <div className="grid grid-cols-4 gap-1">
            {textAlignOptions.map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={textAlign === value ? "default" : "outline"}
                size="sm"
                className={cn("h-8 w-full", textAlign === value && "bg-blue-600 text-white")}
                onClick={() => onTextAlignChange(value)}
                title={label}
              >
                <Icon className="h-3 w-3" />
              </Button>
            ))}
          </div>
        </div>

        {/* Self Alignment */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600">Self Alignment</Label>
          <div className="grid grid-cols-5 gap-1">
            {alignSelfOptions.map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={alignSelf === value ? "default" : "outline"}
                size="sm"
                className={cn("h-8 w-full", alignSelf === value && "bg-blue-600 text-white")}
                onClick={() => onAlignSelfChange(value)}
                title={label}
              >
                <Icon className="h-3 w-3" />
              </Button>
            ))}
          </div>
        </div>

        {/* Container Alignment Controls */}
        {isContainer && onMainAxisAlignmentChange && onCrossAxisAlignmentChange && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">Main Axis Alignment</Label>
              <div className="grid grid-cols-3 gap-1">
                {mainAxisOptions.slice(0, 3).map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    variant={mainAxisAlignment === value ? "default" : "outline"}
                    size="sm"
                    className={cn("h-8 w-full", mainAxisAlignment === value && "bg-blue-600 text-white")}
                    onClick={() => onMainAxisAlignmentChange(value)}
                    title={label}
                  >
                    <Icon className="h-3 w-3" />
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {mainAxisOptions.slice(3).map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    variant={mainAxisAlignment === value ? "default" : "outline"}
                    size="sm"
                    className={cn("h-8 w-full text-xs", mainAxisAlignment === value && "bg-blue-600 text-white")}
                    onClick={() => onMainAxisAlignmentChange(value)}
                    title={label}
                  >
                    <Icon className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">Cross Axis Alignment</Label>
              <div className="grid grid-cols-5 gap-1">
                {crossAxisOptions.map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    variant={crossAxisAlignment === value ? "default" : "outline"}
                    size="sm"
                    className={cn("h-8 w-full", crossAxisAlignment === value && "bg-blue-600 text-white")}
                    onClick={() => onCrossAxisAlignmentChange(value)}
                    title={label}
                  >
                    <Icon className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
