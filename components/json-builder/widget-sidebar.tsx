"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WIDGET_PALETTE_ITEMS, WIDGET_CATEGORIES } from "@/lib/widget-definitions"
import { DraggablePaletteItem } from "./draggable-palette-item"

export function WidgetSidebar() {
  console.log("🎨 WidgetSidebar rendering with:", WIDGET_PALETTE_ITEMS.length, "total widgets")
  console.log(
    "📋 Categories:",
    WIDGET_CATEGORIES.map((c) => c.name),
  )

  return (
    <Card className="w-64 h-full flex flex-col overflow-hidden border-r">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-base font-semibold">Widget Library ({WIDGET_PALETTE_ITEMS.length})</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow overflow-y-auto">
        <CardContent className="p-3 space-y-4">
          {WIDGET_CATEGORIES.map((category) => {
            const itemsInCategory = WIDGET_PALETTE_ITEMS.filter((item) => category.types.includes(item.type))

            console.log(`📂 Rendering category "${category.name}" with ${itemsInCategory.length} items`)

            return (
              <div key={category.name} className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-700 border-b pb-1 uppercase tracking-wide">
                  {category.name} ({itemsInCategory.length})
                </h3>
                <div className="space-y-1.5">
                  {itemsInCategory.map((item, index) => (
                    <DraggablePaletteItem key={`${item.type}-${item.label}-${index}`} item={item} />
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
