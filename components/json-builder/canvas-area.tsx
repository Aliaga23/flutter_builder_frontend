"use client"
import { useState, useRef } from "react"
import { useDrop } from "react-dnd"
import { ComponentTypes, type JsonWidgetNode, type DragItem, type JsonPageNode } from "@/lib/json-builder-types"
import { WIDGET_PALETTE_ITEMS } from "@/lib/widget-definitions"
import { RenderWidgetNode } from "./render-widget-node"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PlusIcon, SettingsIcon, Trash2Icon, MoveIcon } from "lucide-react"

interface CanvasAreaProps {
  pageBody: JsonWidgetNode[]
  onDrop: (item: DragItem, targetPath: string, targetIndex: number, x?: number, y?: number) => void
  onMove: (sourcePath: string, targetPath: string, targetIndex: number, x?: number, y?: number) => void
  onDelete: (path: string) => void
  onSelectWidget: (path: string | null) => void
  selectedWidgetPath: string | null
  onMoveUp: (path: string) => void
  onMoveDown: (path: string) => void
  pages: JsonPageNode[]
  selectedPageIndex: number
  onSelectPage: (pageName: string) => void
  onCreatePage: () => void
  onDeletePage: (pageIndex: number) => void
  onRenamePage: (pageIndex: number, newName: string) => void
  onUpdatePageProps: (pageIndex: number, props: Partial<JsonPageNode>) => void
  onUpdateWidgetPosition: (path: string, x: number, y: number, containerPath?: string) => void
  onUpdateWidgetSize?: (path: string, width: number, height: number) => void
}

export function CanvasArea({
  pageBody,
  onDrop,
  onMove,
  onDelete,
  onSelectWidget,
  selectedWidgetPath,
  onMoveUp,
  onMoveDown,
  pages,
  selectedPageIndex,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  onUpdatePageProps,
  onUpdateWidgetPosition,
  onUpdateWidgetSize,
}: CanvasAreaProps) {
  const [isPageSettingsOpen, setIsPageSettingsOpen] = useState(false)
  const [editingPageName, setEditingPageName] = useState("")
  const [editingPageTitle, setEditingPageTitle] = useState("")
  const canvasRef = useRef<HTMLDivElement>(null)

  const currentPage = pages[selectedPageIndex]
  const isAbsoluteMode = currentPage.positioningMode === "absolute"

  const [{ isOver: isOverCanvas, canDrop: canDropOnCanvas }, dropCanvasRef] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: WIDGET_PALETTE_ITEMS.map((p) => p.type),
      drop: (item, monitor) => {
        if (monitor.didDrop()) return

        if (isAbsoluteMode) {
          // En modo absoluto, usar las coordenadas del mouse
          const canvasRect = canvasRef.current?.getBoundingClientRect()
          const clientOffset = monitor.getClientOffset()

          if (canvasRect && clientOffset) {
            const x = clientOffset.x - canvasRect.left
            const y = clientOffset.y - canvasRect.top

            if (item.isNew) {
              onDrop(item, ComponentTypes.PAGE, pageBody.length, x, y)
            } else if (item.sourcePath) {
              onMove(item.sourcePath, ComponentTypes.PAGE, pageBody.length, x, y)
            }
          }
        } else {
          // Modo flex tradicional
          const targetIdx = pageBody.length
          if (item.isNew) {
            onDrop(item, ComponentTypes.PAGE, targetIdx)
          } else if (item.sourcePath) {
            onMove(item.sourcePath, ComponentTypes.PAGE, targetIdx)
          }
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [pageBody, onDrop, onMove, isAbsoluteMode],
  )

  const handleOpenPageSettings = () => {
    setEditingPageName(currentPage.name)
    setEditingPageTitle(currentPage.title)
    setIsPageSettingsOpen(true)
  }

  const handleSavePageSettings = () => {
    onRenamePage(selectedPageIndex, editingPageName)
    onUpdatePageProps(selectedPageIndex, { title: editingPageTitle })
    setIsPageSettingsOpen(false)
  }

  const handleDeleteCurrentPage = () => {
    if (pages.length > 1) {
      onDeletePage(selectedPageIndex)
      setIsPageSettingsOpen(false)
    }
  }

  const togglePositioningMode = () => {
    const newMode = isAbsoluteMode ? "flex" : "absolute"
    onUpdatePageProps(selectedPageIndex, { positioningMode: newMode })
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
        <CardTitle className="text-base font-semibold">Design Canvas</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <MoveIcon className="h-4 w-4" />
            <Switch checked={isAbsoluteMode} onCheckedChange={togglePositioningMode} id="positioning-mode" />
            <Label htmlFor="positioning-mode" className="text-sm">
              {isAbsoluteMode ? "Free Position" : "Flex Layout"}
            </Label>
          </div>

          <Select value={currentPage.name} onValueChange={onSelectPage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.name} value={page.name}>
                  {page.title || page.name.charAt(0).toUpperCase() + page.name.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onCreatePage} title="Create New Page">
            <PlusIcon className="h-4 w-4" />
          </Button>

          <Dialog open={isPageSettingsOpen} onOpenChange={setIsPageSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleOpenPageSettings} title="Page Settings">
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Page Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pageName">Page Name (ID)</Label>
                  <Input
                    id="pageName"
                    value={editingPageName}
                    onChange={(e) => setEditingPageName(e.target.value)}
                    placeholder="page_name"
                  />
                </div>
                <div>
                  <Label htmlFor="pageTitle">Page Title</Label>
                  <Input
                    id="pageTitle"
                    value={editingPageTitle}
                    onChange={(e) => setEditingPageTitle(e.target.value)}
                    placeholder="Page Title"
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="destructive" onClick={handleDeleteCurrentPage} disabled={pages.length <= 1}>
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Delete Page
                  </Button>
                  <Button onClick={handleSavePageSettings}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent
        ref={(node) => {
          dropCanvasRef(node)
          canvasRef.current = node
        }}
        className={cn(
          "flex-grow p-4 border-2 rounded-md relative overflow-auto canvas-area-content",
          isOverCanvas && canDropOnCanvas ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-300",
          "transition-colors duration-100",
          isAbsoluteMode ? "relative" : "flex flex-col items-start", // Cambiar layout según el modo
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectWidget(null)
          }
        }}
        style={{
          minHeight: "300px", // Reduced minimum height to be more responsive
          backgroundColor: currentPage.backgroundColor || "#ffffff", // Aplicar el color de fondo de la página
        }}
      >
        {pageBody.length === 0 && !isOverCanvas && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500 pointer-events-none">
            <div>
              <p className="text-lg font-medium">Drag and drop widgets here</p>
              <p className="text-sm">
                Start building your user interface for "{currentPage.title || currentPage.name}"
              </p>
              <p className="text-xs mt-2">Mode: {isAbsoluteMode ? "Free Positioning" : "Flex Layout"}</p>
            </div>
          </div>
        )}

        {pageBody.map((node, index) => (
          <RenderWidgetNode
            key={node.id}
            node={node}
            path={`${index}`}
            onDrop={onDrop}
            onMove={onMove}
            onDelete={onDelete}
            onSelect={onSelectWidget}
            isSelected={selectedWidgetPath === `${index}`}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isAbsoluteMode={isAbsoluteMode}
            onUpdatePosition={onUpdateWidgetPosition}
            onUpdateSize={onUpdateWidgetSize}
          />
        ))}
      </CardContent>
    </Card>
  )
}
