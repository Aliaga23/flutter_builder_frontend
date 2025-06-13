"use client"
import type React from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import {
  Trash2Icon,
  CopyIcon,
  MoveIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react"

interface WidgetContextMenuProps {
  children: React.ReactNode
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAlignLeft: () => void
  onAlignCenter: () => void
  onAlignRight: () => void
  onAlignJustify: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  widgetType: string
}

export function WidgetContextMenu({
  children,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignJustify,
  canMoveUp,
  canMoveDown,
  widgetType,
}: WidgetContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onDuplicate} className="flex items-center gap-2">
          <CopyIcon className="h-4 w-4" />
          Duplicate Widget
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center gap-2">
            <AlignLeftIcon className="h-4 w-4" />
            Alignment
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={onAlignLeft} className="flex items-center gap-2">
              <AlignLeftIcon className="h-4 w-4" />
              Align Left
            </ContextMenuItem>
            <ContextMenuItem onClick={onAlignCenter} className="flex items-center gap-2">
              <AlignCenterIcon className="h-4 w-4" />
              Align Center
            </ContextMenuItem>
            <ContextMenuItem onClick={onAlignRight} className="flex items-center gap-2">
              <AlignRightIcon className="h-4 w-4" />
              Align Right
            </ContextMenuItem>
            <ContextMenuItem onClick={onAlignJustify} className="flex items-center gap-2">
              <AlignJustifyIcon className="h-4 w-4" />
              Align Justify
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center gap-2">
            <MoveIcon className="h-4 w-4" />
            Move
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={onMoveUp} disabled={!canMoveUp} className="flex items-center gap-2">
              <ChevronUpIcon className="h-4 w-4" />
              Move Up
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveDown} disabled={!canMoveDown} className="flex items-center gap-2">
              <ChevronDownIcon className="h-4 w-4" />
              Move Down
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onDelete} className="flex items-center gap-2 text-red-600 focus:text-red-600">
          <Trash2Icon className="h-4 w-4" />
          Delete Widget
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
