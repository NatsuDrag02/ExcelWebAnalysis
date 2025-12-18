"use client"

import { useState, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { SheetMetadata, FilterGroup, ViewColumn } from "@/lib/types"
import { generateViewExplanation } from "@/lib/view-engine"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface DataTableProps {
  sheet: SheetMetadata
  filterGroups: FilterGroup[]
  viewColumns: ViewColumn[]
  viewData: Record<string, any>[]
}

export default function DataTable({ sheet, filterGroups, viewColumns, viewData }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const rowsPerPage = 50

  // Use viewData if view is configured, otherwise use filtered data
  const displayData = viewColumns.length > 0 ? viewData : viewData
  
  // Get columns to display
  const displayColumns = useMemo(() => {
    if (viewColumns.length > 0) {
      return viewColumns.map((vc) => sheet.columns.find((c) => c.name === vc.columnName)).filter(Boolean) as typeof sheet.columns
    }
    return sheet.columns
  }, [viewColumns, sheet.columns])
  
  const viewExplanation = useMemo(() => {
    if (viewColumns.length === 0) return null
    return generateViewExplanation(viewColumns, sheet.columns, displayData.length)
  }, [viewColumns, sheet.columns, displayData.length])

  const sortedData = useMemo(() => {
    if (!sortColumn) return displayData
  
    const column = sheet.columns.find(c => c.name === sortColumn)
    if (!column) return displayData
  
    return [...displayData].sort((a, b) => {
      const aVal = normalizeValue(a[sortColumn], column.type)
      const bVal = normalizeValue(b[sortColumn], column.type)
  
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
  
      if (aVal === bVal) return 0
  
      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [displayData, sortColumn, sortDirection, sheet.columns])
  function normalizeValue(value: any, type: string) {
    if (value == null) return null
  
    switch (type) {
      case "number":
      case "currency":
        return Number(
          String(value).replace(/[^0-9.-]/g, "")
        )
  
      case "date":
        return new Date(value).getTime()
  
      default:
        return String(value).toLowerCase()
    }
  }
    

  useMemo(() => {
    setCurrentPage(1)
  }, [filterGroups, viewColumns])

  const totalPages = Math.ceil(sortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentData = sortedData.slice(startIndex, endIndex)

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnName)
      setSortDirection("asc")
    }
  }

  return (
    <div className="space-y-6">
      {viewExplanation && (
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">{viewExplanation}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{sheet.name}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {displayData.length !== sheet.rowCount && (
              <span className="text-primary font-semibold bg-primary/10 px-2 py-1 rounded-md mr-2">
                {displayData.length} {viewColumns.length > 0 ? "registros na visão" : "linhas filtradas"}
              </span>
            )}
            {viewColumns.length > 0 ? (
              <>
                {displayData.length} registros • {displayColumns.length} colunas selecionadas
              </>
            ) : (
              <>
                {sheet.rowCount} linhas totais • {sheet.columns.length} colunas
              </>
            )}
          </p>
        </div>
      </div>

      <Card className="border-2 border-border/60 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b-2 border-border/60">
              <tr>
                {displayColumns.map((column) => {
                  const viewCol = viewColumns.find((vc) => vc.columnName === column.name)
                  return (
                    <th
                      key={column.name}
                      className="px-5 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-secondary transition-colors group"
                      onClick={() => handleSort(column.name)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-balance text-foreground">{column.name}</span>
                        {sortColumn === column.name ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="text-xs text-muted-foreground font-normal bg-muted/50 px-2 py-0.5 rounded-full">
                          {column.type}
                        </div>
                        {viewCol && (
                          <>
                            <div className="text-xs bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded-full">
                              {viewCol.role === "dimension" ? "D" : "M"}
                            </div>
                            {viewCol.aggregation && (
                              <div className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">
                                {viewCol.aggregation}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="bg-card">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Filter className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-semibold text-foreground">Nenhum resultado encontrado</p>
                      <p className="text-sm text-muted-foreground">
                        {viewColumns.length > 0 ? "Tente ajustar sua visão ou filtros" : "Tente ajustar seus filtros"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-border/40 hover:bg-secondary/30 transition-colors">
                    {displayColumns.map((column) => (
                      <td key={column.name} className="px-5 py-4 text-sm text-foreground">
                        {formatCellValue(row[column.name], column.type)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {sortedData.length > 0 && (
        <div className="flex items-center justify-between bg-card/50 p-4 rounded-xl border border-border/60">
          <div className="text-sm text-muted-foreground font-medium">
            Mostrando <span className="text-foreground font-semibold">{startIndex + 1}</span> a{" "}
            <span className="text-foreground font-semibold">{Math.min(endIndex, sortedData.length)}</span> de{" "}
            <span className="text-foreground font-semibold">{sortedData.length}</span> linhas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="shadow-sm"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-4 font-medium text-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="shadow-sm"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatCellValue(value: any, type: string): string {
  if (value == null) return "-"

  if (type === "date") {
    const date = new Date(value)
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
  }

  if (type === "currency") {
    const num = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ""))
    return isNaN(num) ? String(value) : `$${num.toFixed(2)}`
  }

  return String(value)
}
