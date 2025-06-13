"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, Trash2Icon, GripVerticalIcon, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DropdownEditorProps {
  items: string[]
  selectedValue?: string
  label?: string
  onChange: (items: string[], selectedValue?: string, label?: string) => void
}

export function DropdownEditor({ items, selectedValue, label, onChange }: DropdownEditorProps) {
  const [localItems, setLocalItems] = useState<string[]>(items || ["Option 1", "Option 2", "Option 3"])
  const [localSelectedValue, setLocalSelectedValue] = useState<string>(selectedValue || "")
  const [localLabel, setLocalLabel] = useState<string>(label || "Select")

  useEffect(() => {
    setLocalItems(items || ["Option 1", "Option 2", "Option 3"])
    setLocalSelectedValue(selectedValue || "")
    setLocalLabel(label || "Select")
  }, [items, selectedValue, label])

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...localItems]
    const oldValue = newItems[index]
    newItems[index] = value

    // If the changed item was the selected value, update the selected value too
    let newSelectedValue = localSelectedValue
    if (localSelectedValue === oldValue) {
      newSelectedValue = value
      setLocalSelectedValue(value)
    }

    setLocalItems(newItems)
    onChange(newItems, newSelectedValue, localLabel)
  }

  const handleLabelChange = (value: string) => {
    setLocalLabel(value)
    onChange(localItems, localSelectedValue, value)
  }

  const handleSelectedValueChange = (value: string) => {
    setLocalSelectedValue(value)
    onChange(localItems, value, localLabel)
  }

  const addItem = () => {
    const newItems = [...localItems, `Option ${localItems.length + 1}`]
    setLocalItems(newItems)
    onChange(newItems, localSelectedValue, localLabel)
  }

  const removeItem = (index: number) => {
    if (localItems.length <= 1) return

    const itemToRemove = localItems[index]
    const newItems = localItems.filter((_, i) => i !== index)

    // If the removed item was selected, clear the selection or select the first item
    let newSelectedValue = localSelectedValue
    if (localSelectedValue === itemToRemove) {
      newSelectedValue = newItems.length > 0 ? newItems[0] : ""
      setLocalSelectedValue(newSelectedValue)
    }

    setLocalItems(newItems)
    onChange(newItems, newSelectedValue, localLabel)
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= localItems.length) return

    const newItems = [...localItems]
    const [movedItem] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, movedItem)

    setLocalItems(newItems)
    onChange(newItems, localSelectedValue, localLabel)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Dropdown Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-600">Dropdown Label</h4>
          <Input
            value={localLabel}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="h-7 text-xs"
            placeholder="Select"
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Options</h4>
            <Button size="sm" variant="outline" onClick={addItem} className="h-6 px-2">
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {localItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <GripVerticalIcon className="h-3 w-3 text-gray-400 cursor-move" />
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    size="sm"
                    variant={localSelectedValue === item ? "default" : "ghost"}
                    onClick={() => handleSelectedValueChange(item)}
                    className="h-6 w-6 p-0"
                    title={localSelectedValue === item ? "Selected" : "Set as selected"}
                  >
                    <CheckIcon
                      className={cn("h-3 w-3", localSelectedValue === item ? "text-white" : "text-gray-400")}
                    />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                    title="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === localItems.length - 1}
                    className="h-6 w-6 p-0"
                    title="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    disabled={localItems.length <= 1}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2Icon className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Value */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-600">Default Selected Value</h4>
          <Select value={localSelectedValue} onValueChange={handleSelectedValueChange}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Choose default selection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None selected</SelectItem>
              {localItems.map((item, index) => (
                <SelectItem key={index} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-600">Preview</h4>
          <div className="border rounded-md p-2">
            <Select value={localSelectedValue} onValueChange={() => {}}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={localLabel} />
              </SelectTrigger>
              <SelectContent>
                {localItems.map((item, index) => (
                  <SelectItem key={index} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Summary:</strong> {localItems.length} option{localItems.length !== 1 ? "s" : ""}
          {localSelectedValue && ` • Default: "${localSelectedValue}"`}
        </div>
      </CardContent>
    </Card>
  )
}
