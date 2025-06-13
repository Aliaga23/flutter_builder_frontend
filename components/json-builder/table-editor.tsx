"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, Trash2Icon, GripVerticalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface TableEditorProps {
  columns: string[]
  rows: string[][]
  onChange: (columns: string[], rows: string[][]) => void
}

export function TableEditor({ columns, rows, onChange }: TableEditorProps) {
  const [localColumns, setLocalColumns] = useState<string[]>(columns || ["Column 1", "Column 2"])
  const [localRows, setLocalRows] = useState<string[][]>(
    rows || [
      ["Data 1", "Data 2"],
      ["Data 3", "Data 4"],
    ],
  )

  useEffect(() => {
    setLocalColumns(columns || ["Column 1", "Column 2"])
    setLocalRows(
      rows || [
        ["Data 1", "Data 2"],
        ["Data 3", "Data 4"],
      ],
    )
  }, [columns, rows])

  const handleColumnChange = (index: number, value: string) => {
    const newColumns = [...localColumns]
    newColumns[index] = value
    setLocalColumns(newColumns)
    onChange(newColumns, localRows)
  }

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...localRows]
    newRows[rowIndex][colIndex] = value
    setLocalRows(newRows)
    onChange(localColumns, newRows)
  }

  const addColumn = () => {
    const newColumns = [...localColumns, `Column ${localColumns.length + 1}`]
    const newRows = localRows.map((row) => [...row, ""])
    setLocalColumns(newColumns)
    setLocalRows(newRows)
    onChange(newColumns, newRows)
  }

  const removeColumn = (index: number) => {
    if (localColumns.length <= 1) return
    const newColumns = localColumns.filter((_, i) => i !== index)
    const newRows = localRows.map((row) => row.filter((_, i) => i !== index))
    setLocalColumns(newColumns)
    setLocalRows(newRows)
    onChange(newColumns, newRows)
  }

  const addRow = () => {
    const newRow = new Array(localColumns.length).fill("")
    const newRows = [...localRows, newRow]
    setLocalRows(newRows)
    onChange(localColumns, newRows)
  }

  const removeRow = (index: number) => {
    if (localRows.length <= 1) return
    const newRows = localRows.filter((_, i) => i !== index)
    setLocalRows(newRows)
    onChange(localColumns, newRows)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Table Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column Headers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Columns</h4>
            <Button size="sm" variant="outline" onClick={addColumn} className="h-6 px-2">
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {localColumns.map((column, index) => (
              <div key={index} className="flex items-center gap-2">
                <GripVerticalIcon className="h-3 w-3 text-gray-400" />
                <Input
                  value={column}
                  onChange={(e) => handleColumnChange(index, e.target.value)}
                  className="h-7 text-xs"
                  placeholder={`Column ${index + 1}`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeColumn(index)}
                  disabled={localColumns.length <= 1}
                  className="h-6 w-6 p-0"
                >
                  <Trash2Icon className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Table Data */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Rows</h4>
            <Button size="sm" variant="outline" onClick={addRow} className="h-6 px-2">
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {localRows.map((row, rowIndex) => (
              <div key={rowIndex} className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 w-6">#{rowIndex + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRow(rowIndex)}
                    disabled={localRows.length <= 1}
                    className="h-5 w-5 p-0"
                  >
                    <Trash2Icon className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${localColumns.length}, 1fr)` }}>
                  {row.map((cell, colIndex) => (
                    <Input
                      key={colIndex}
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="h-7 text-xs"
                      placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-600">Preview</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {localColumns.map((column, index) => (
                    <th key={index} className="px-2 py-1 text-left font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={cn("border-t", rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="px-2 py-1">
                        {cell || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
