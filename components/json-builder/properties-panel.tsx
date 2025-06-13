"use client"
import type { JsonWidgetNode, JsonWidgetProps, PropertyDefinition, JsonPageNode } from "@/lib/json-builder-types"
import { WIDGET_PALETTE_ITEMS } from "@/lib/widget-definitions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { AlignmentControls } from "./alignment-controls"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { TableEditor } from "./table-editor"
import { DropdownEditor } from "./dropdown-editor"
import { IconPicker } from "./icon-picker"
import { FabEditor } from "./fab-editor"
import { BottomNavEditor } from "./bottom-nav-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PropertiesPanelProps {
  selectedWidget: JsonWidgetNode | null
  selectedWidgetPath: string | null
  onUpdateWidgetProps: (path: string, props: Partial<JsonWidgetProps>) => void
  generatedJson: string
  currentPage: JsonPageNode
  onUpdatePageProps: (props: Partial<JsonPageNode>) => void
}

export function PropertiesPanel({
  selectedWidget,
  selectedWidgetPath,
  onUpdateWidgetProps,
  generatedJson,
  currentPage,
  onUpdatePageProps,
}: PropertiesPanelProps) {
  if (!selectedWidget || !selectedWidgetPath) {
    return (
      <Card className="w-64 h-full flex flex-col overflow-hidden border-l">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-base font-semibold">Page Properties</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <Tabs defaultValue="properties" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="json">JSON Output</TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="space-y-4 p-3 flex-1 overflow-auto">
              <div>
                <Label htmlFor="pageTitle">Page Title</Label>
                <Input
                  id="pageTitle"
                  value={currentPage.title}
                  onChange={(e) => onUpdatePageProps({ title: e.target.value })}
                  placeholder="Page Title"
                />
              </div>

              <div>
                <Label htmlFor="pageLayout">Layout</Label>
                <Select
                  value={currentPage.layout || "scroll"}
                  onValueChange={(value) => onUpdatePageProps({ layout: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scroll">Scroll</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pageBackground">Background Color</Label>
                <Input
                  id="pageBackground"
                  type="color"
                  value={currentPage.backgroundColor || "#ffffff"}
                  onChange={(e) => onUpdatePageProps({ backgroundColor: e.target.value })}
                  className="h-8 w-full"
                />
              </div>

              <div>
                <Label htmlFor="positioningMode">Positioning Mode</Label>
                <Select
                  value={currentPage.positioningMode || "flex"}
                  onValueChange={(value) => onUpdatePageProps({ positioningMode: value as "flex" | "absolute" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select positioning mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flex">Flex Layout</SelectItem>
                    <SelectItem value="absolute">Free Positioning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">FAB (Floating Action Button)</Label>
                <div className="mt-2">
                  <FabEditor
                    label={currentPage.fab?.label}
                    icon={currentPage.fab?.icon}
                    snack={currentPage.fab?.snack}
                    variant={currentPage.fab?.variant}
                    showLabel={currentPage.fab?.showLabel}
                    onChange={({ label, icon, snack, variant, showLabel }) => {
                      if (label || icon || snack) {
                        onUpdatePageProps({
                          fab: {
                            label: label || "FAB",
                            icon: icon || "Plus",
                            snack: snack || "Action performed",
                            variant: variant || "default",
                            showLabel: showLabel || false,
                          },
                        })
                      } else {
                        onUpdatePageProps({ fab: undefined })
                      }
                    }}
                  />
                </div>
                {currentPage.fab && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="removeFab"
                      checked={false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onUpdatePageProps({ fab: undefined })
                        }
                      }}
                    />
                    <Label htmlFor="removeFab" className="text-sm">
                      Remove FAB
                    </Label>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="json" className="p-3 flex-1 overflow-auto">
              <div>
                <Label className="text-lg font-semibold">JSON Output (Real-time)</Label>
                <Textarea
                  readOnly
                  value={generatedJson}
                  className="mt-2 w-full h-[400px] text-xs font-mono resize-none border-gray-200"
                  placeholder="Your app JSON will appear here..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  const widgetDefinition = WIDGET_PALETTE_ITEMS.find((item) => item.type === selectedWidget.type)

  if (!widgetDefinition) {
    console.error("[PropertiesPanel] Widget definition not found for type:", selectedWidget.type)
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Properties Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">
            Could not load property definition for this widget ({selectedWidget.type}).
          </p>
        </CardContent>
      </Card>
    )
  }

  const editableProps = widgetDefinition.editableProps || []

  // Auto-detect special editors based on widget type
  const needsDropdownEditor = ["dropdown", "radioGroup", "tabBar"].includes(selectedWidget.type)
  const needsAlertDialogEditor = selectedWidget.type === "alertDialog"

  // Add special property definitions for auto-detected editors
  const enhancedEditableProps = [...editableProps]

  if (needsDropdownEditor && !editableProps.find((p) => p.type === "dropdown")) {
    enhancedEditableProps.push({
      name: "items",
      label:
        selectedWidget.type === "radioGroup"
          ? "Radio Options"
          : selectedWidget.type === "tabBar"
            ? "Tab Items"
            : "Dropdown Items",
      type: "dropdown",
    })
  }

  if (needsAlertDialogEditor && !editableProps.find((p) => p.type === "dropdown")) {
    enhancedEditableProps.push({
      name: "dialogSettings",
      label: "Dialog Settings",
      type: "dropdown",
    })
  }

  const handleChange = (propName: string, value: any) => {
    onUpdateWidgetProps(selectedWidgetPath, { [propName]: value })
  }

  const renderPropertyInput = (propDef: PropertyDefinition) => {
    const currentValue = selectedWidget.props[propDef.name] ?? propDef.defaultValue

    switch (propDef.type) {
      case "string":
        // Special handling for listTile icon name and color
        if (propDef.name === "icon" && selectedWidget.type === "listTile") {
          const iconName = selectedWidget.props.icon?.icon || ""
          const iconColor = selectedWidget.props.icon?.color || "#000000"
          return (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${selectedWidget.id}-iconName`} className="text-xs font-medium">
                Icon Name
              </Label>
              <Input
                id={`${selectedWidget.id}-iconName`}
                type="text"
                value={iconName}
                onChange={(e) => handleChange("icon", { ...selectedWidget.props.icon, icon: e.target.value })}
                className="mt-1"
                placeholder="e.g., palette, check_circle"
              />
              <Label htmlFor={`${selectedWidget.id}-iconColor`} className="text-xs font-medium">
                Icon Color
              </Label>
              <Input
                id={`${selectedWidget.id}-iconColor`}
                type="color"
                value={iconColor}
                onChange={(e) => handleChange("icon", { ...selectedWidget.props.icon, color: e.target.value })}
                className="mt-1 h-8 w-full"
              />
            </div>
          )
        }
        return (
          <Input
            type="text"
            value={(currentValue as string) || ""}
            onChange={(e) => handleChange(propDef.name, e.target.value)}
            className="mt-1"
            placeholder={propDef.defaultValue || ""}
          />
        )
      case "table":
        return (
          <div className="mt-1">
            <TableEditor
              columns={selectedWidget.props.columns || ["Column 1", "Column 2"]}
              rows={selectedWidget.props.rows || [["Data 1", "Data 2"]]}
              onChange={(columns, rows) => {
                handleChange("columns", columns)
                handleChange("rows", rows)
              }}
            />
          </div>
        )
      case "dropdown":
        // Handle dropdown, radio group, tab bar, and alert dialog
        const isDropdown = selectedWidget.type === "dropdown"
        const isRadioGroup = selectedWidget.type === "radioGroup"
        const isTabBar = selectedWidget.type === "tabBar"
        const isAlertDialog = selectedWidget.type === "alertDialog"

        // For alert dialog, show a specialized editor
        if (isAlertDialog) {
          return (
            <div className="mt-1">
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Alert Dialog Editor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">Dialog Title</Label>
                    <Input
                      value={selectedWidget.props.dialogTitle || ""}
                      onChange={(e) => handleChange("dialogTitle", e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Dialog Title"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Dialog Content</Label>
                    <Textarea
                      value={selectedWidget.props.dialogContent || ""}
                      onChange={(e) => handleChange("dialogContent", e.target.value)}
                      className="text-xs min-h-[60px]"
                      placeholder="Dialog message content"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Dialog Type</Label>
                    <Select
                      value={selectedWidget.props.dialogType || "warning"}
                      onValueChange={(value) => handleChange("dialogType", value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Confirm Button Text</Label>
                    <Input
                      value={selectedWidget.props.confirmButtonText || ""}
                      onChange={(e) => handleChange("confirmButtonText", e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Confirm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Cancel Button Text</Label>
                    <Input
                      value={selectedWidget.props.cancelButtonText || ""}
                      onChange={(e) => handleChange("cancelButtonText", e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Cancel"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        }

        // For dropdown, radio group, and tab bar
        const items = selectedWidget.props.items
          ? typeof selectedWidget.props.items === "string"
            ? selectedWidget.props.items.split(",").map((item) => item.trim())
            : selectedWidget.props.items
          : selectedWidget.props.options
            ? typeof selectedWidget.props.options === "string"
              ? selectedWidget.props.options.split(",").map((item) => item.trim())
              : selectedWidget.props.options
            : ["Option 1", "Option 2", "Option 3"]

        const selectedValue = selectedWidget.props.value || ""
        const label = selectedWidget.props.label || (isRadioGroup ? "Radio Group" : isTabBar ? "Tab Bar" : "Select")

        return (
          <div className="mt-1">
            <DropdownEditor
              items={items}
              selectedValue={selectedValue}
              label={label}
              onChange={(newItems, newSelectedValue, newLabel) => {
                if (isRadioGroup) {
                  handleChange("options", newItems.join(","))
                  handleChange("value", newSelectedValue)
                  handleChange("label", newLabel)
                } else if (isTabBar) {
                  handleChange("items", newItems.join(","))
                } else {
                  handleChange("items", newItems.join(","))
                  handleChange("value", newSelectedValue)
                  handleChange("label", newLabel)
                }
              }}
            />
          </div>
        )
      case "icon":
        return (
          <div className="mt-1">
            <IconPicker
              selectedIcon={selectedWidget.props.iconName || selectedWidget.props.icon}
              onIconSelect={(iconName) => {
                handleChange("iconName", iconName)
                if (selectedWidget.props.icon) {
                  handleChange("icon", iconName)
                }
              }}
            />
          </div>
        )
      case "fab":
        return (
          <div className="mt-1">
            <FabEditor
              label={selectedWidget.props.label}
              icon={selectedWidget.props.icon}
              snack={selectedWidget.props.snack}
              variant={selectedWidget.props.variant}
              showLabel={selectedWidget.props.showLabel}
              onChange={({ label, icon, snack, variant, showLabel }) => {
                handleChange("label", label)
                handleChange("icon", icon)
                handleChange("snack", snack)
                handleChange("variant", variant)
                handleChange("showLabel", showLabel)
              }}
            />
          </div>
        )
      case "bottomNav":
        return (
          <div className="mt-1">
            <BottomNavEditor
              items={selectedWidget.props.items || []}
              selectedIndex={selectedWidget.props.selectedIndex}
              backgroundColor={selectedWidget.props.backgroundColor}
              textColor={selectedWidget.props.textColor}
              selectedItemColor={selectedWidget.props.selectedItemColor}
              routes={selectedWidget.props.routes}
              onChange={({ items, selectedIndex, backgroundColor, textColor, selectedItemColor, routes }) => {
                handleChange("items", items)
                handleChange("selectedIndex", selectedIndex)
                handleChange("backgroundColor", backgroundColor)
                handleChange("textColor", textColor)
                handleChange("selectedItemColor", selectedItemColor)
                handleChange("routes", routes)
              }}
            />
          </div>
        )
      case "color":
        return (
          <Input
            type="color"
            value={(currentValue as string) || "#000000"}
            onChange={(e) => handleChange(propDef.name, e.target.value)}
            className="mt-1 h-8 w-full"
          />
        )
      case "number":
        return (
          <Input
            type="number"
            value={(currentValue as number) ?? ""}
            onChange={(e) =>
              handleChange(propDef.name, e.target.value === "" ? undefined : Number.parseFloat(e.target.value))
            }
            className="mt-1"
            placeholder={propDef.defaultValue !== undefined ? String(propDef.defaultValue) : ""}
          />
        )
      case "boolean":
        // Special handling for 'bold' property for Text/Heading
        if (propDef.name === "bold") {
          return (
            <div className="flex items-center mt-1">
              <Checkbox
                checked={(currentValue as boolean) || false}
                onCheckedChange={(checked) => handleChange(propDef.name, checked)}
                id={`${selectedWidget.id}-${propDef.name}`}
              />
              <Label htmlFor={`${selectedWidget.id}-${propDef.name}`} className="ml-2 text-sm">
                Bold
              </Label>
            </div>
          )
        }
        // Special handling for 'check' property for ListTile
        if (propDef.name === "check") {
          return (
            <div className="flex items-center mt-1">
              <Checkbox
                checked={(currentValue as boolean) || false}
                onCheckedChange={(checked) => handleChange(propDef.name, checked)}
                id={`${selectedWidget.id}-${propDef.name}`}
              />
              <Label htmlFor={`${selectedWidget.id}-${propDef.name}`} className="ml-2 text-sm">
                Checked
              </Label>
            </div>
          )
        }
        return (
          <div className="flex items-center mt-1">
            <Switch
              checked={(currentValue as boolean) || false}
              onCheckedChange={(checked) => handleChange(propDef.name, checked)}
              id={`${selectedWidget.id}-${propDef.name}`}
            />
          </div>
        )
      case "select":
        return (
          <Select value={(currentValue as string) || ""} onValueChange={(value) => handleChange(propDef.name, value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={propDef.defaultValue || `Select ${propDef.label}`} />
            </SelectTrigger>
            <SelectContent>
              {propDef.options?.map((option) => (
                <SelectItem key={option.value.toString()} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return <p className="text-xs text-red-500 mt-1">Unsupported property type: {propDef.type}</p>
    }
  }

  const isAbsoluteMode = currentPage.positioningMode === "absolute"

  return (
    <Card className="w-64 h-full flex flex-col overflow-hidden border-l">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-base font-semibold">
          {widgetDefinition.label || selectedWidget.type} Properties
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="space-y-4 p-3">
          {/* Position Controls for Absolute Mode */}
          {isAbsoluteMode && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="text-sm font-semibold mb-2 text-blue-700">Position</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="x-position" className="text-xs font-medium">
                    X Position
                  </Label>
                  <Input
                    id="x-position"
                    type="number"
                    value={selectedWidget.props.x || 0}
                    onChange={(e) => handleChange("x", Number.parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="y-position" className="text-xs font-medium">
                    Y Position
                  </Label>
                  <Input
                    id="y-position"
                    type="number"
                    value={selectedWidget.props.y || 0}
                    onChange={(e) => handleChange("y", Number.parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="z-index" className="text-xs font-medium">
                  Z-Index (Layer)
                </Label>
                <Input
                  id="z-index"
                  type="number"
                  value={selectedWidget.props.zIndex || 1}
                  onChange={(e) => handleChange("zIndex", Number.parseFloat(e.target.value) || 1)}
                  className="h-7 text-xs"
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Controles de Alineación SOLO para Contenedores */}
          {widgetDefinition.isContainer && (
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <h4 className="text-sm font-semibold mb-2 text-slate-700">Container Layout</h4>
              <AlignmentControls
                textAlign={selectedWidget.props.textAlign}
                alignSelf={selectedWidget.props.alignSelf}
                mainAxisAlignment={selectedWidget.props.mainAxisAlignment}
                crossAxisAlignment={selectedWidget.props.crossAxisAlignment}
                onTextAlignChange={(value) => handleChange("textAlign", value)}
                onAlignSelfChange={(value) => handleChange("alignSelf", value)}
                onMainAxisAlignmentChange={(value) => handleChange("mainAxisAlignment", value)}
                onCrossAxisAlignmentChange={(value) => handleChange("crossAxisAlignment", value)}
                isContainer={true}
              />
            </div>
          )}

          {/* Propiedades Regulares */}
          <h4 className="text-sm font-semibold mt-4 pt-2 border-t text-slate-700">Specific Properties</h4>
          {enhancedEditableProps.length > 0 ? (
            enhancedEditableProps.map((propDef) => {
              // No renderizar props de alineación aquí si ya están en AlignmentControls
              if (
                ["textAlign", "alignSelf", "mainAxisAlignment", "crossAxisAlignment", "x", "y", "zIndex"].includes(
                  propDef.name,
                )
              ) {
                return null
              }
              // Special handling for listTile icon, already rendered above
              if (propDef.name === "icon" && selectedWidget.type === "listTile") {
                return null
              }
              return (
                <div key={propDef.name}>
                  <Label htmlFor={`${selectedWidget.id}-${propDef.name}`} className="text-sm font-medium">
                    {propDef.label}
                  </Label>
                  {renderPropertyInput(propDef)}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-500">This widget has no specific editable properties.</p>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
