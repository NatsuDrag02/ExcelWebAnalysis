"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Eye, Info, GripVertical, X } from "lucide-react"
import type { ColumnMetadata, ViewColumn, AggregationType } from "@/lib/types"
import { generateViewExplanation, validateView } from "@/lib/view-engine"

interface ViewBuilderProps {
  columns: ColumnMetadata[]
  selectedColumns: ViewColumn[]
  onColumnsChange: (columns: ViewColumn[]) => void
}

const AGGREGATION_LABELS: Record<AggregationType, string> = {
  count: "Contagem",
  sum: "Soma",
  avg: "Média",
  max: "Máximo",
  min: "Mínimo",
}

export default function ViewBuilder({
  columns,
  selectedColumns,
  onColumnsChange,
}: ViewBuilderProps) {
  const selectedColumnNames = useMemo(
    () => new Set(selectedColumns.map((c) => c.columnName)),
    [selectedColumns]
  )

  const handleToggleColumn = (columnName: string, checked: boolean) => {
    if (checked) {
      const column = columns.find((c) => c.name === columnName)
      if (!column) return

      // Determine default role based on column capabilities
      let defaultRole: "dimension" | "metric" = "dimension"
      if (column.possibleRoles.includes("metric") && !column.possibleRoles.includes("dimension")) {
        defaultRole = "metric"
      } else if (column.possibleRoles.includes("both")) {
        // Prefer dimension for text/date, metric for numeric
        defaultRole = column.type === "number" || column.type === "currency" ? "metric" : "dimension"
      }

      const newColumn: ViewColumn = {
        columnName,
        role: defaultRole,
        aggregation: defaultRole === "metric" ? "count" : undefined,
      }

      onColumnsChange([...selectedColumns, newColumn])
    } else {
      onColumnsChange(selectedColumns.filter((c) => c.columnName !== columnName))
    }
  }

  const handleRoleChange = (columnName: string, role: "dimension" | "metric") => {
    onColumnsChange(
      selectedColumns.map((col) => {
        if (col.columnName === columnName) {
          return {
            ...col,
            role,
            aggregation: role === "metric" ? (col.aggregation || "count") : undefined,
          }
        }
        return col
      })
    )
  }

  const handleAggregationChange = (columnName: string, aggregation: AggregationType) => {
    onColumnsChange(
      selectedColumns.map((col) => {
        if (col.columnName === columnName) {
          return { ...col, aggregation }
        }
        return col
      })
    )
  }

  const handleRemoveColumn = (columnName: string) => {
    onColumnsChange(selectedColumns.filter((c) => c.columnName !== columnName))
  }

  const validation = useMemo(() => validateView(selectedColumns, columns), [selectedColumns, columns])
  const explanation = useMemo(
    () => generateViewExplanation(selectedColumns, columns, 0),
    [selectedColumns, columns]
  )

  // Group columns by type for better organization
  const dimensionColumns = columns.filter(
    (c) => c.possibleRoles.includes("dimension") || c.possibleRoles.includes("both")
  )
  const metricColumns = columns.filter(
    (c) => c.possibleRoles.includes("metric") || c.possibleRoles.includes("both")
  )

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Configurar Visão
            </CardTitle>
            <CardDescription>
              Selecione as colunas que deseja visualizar e defina seus papéis
            </CardDescription>
          </div>
          {validation.valid ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              Válido
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
              Inválido
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!validation.valid && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Configuração inválida</AlertTitle>
            <AlertDescription>{validation.reason}</AlertDescription>
          </Alert>
        )}

        {/* Column Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-3 block">Selecionar Colunas</Label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-lg p-4 bg-secondary/20">
              {/* Dimension-capable columns */}
              {dimensionColumns.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">
                    Dimensões (para agrupar)
                  </Label>
                  {dimensionColumns.map((column) => (
                    <div
                      key={column.name}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/20 transition-colors"
                    >
                      <Checkbox
                        id={`col-${column.name}`}
                        checked={selectedColumnNames.has(column.name)}
                        onCheckedChange={(checked) =>
                          handleToggleColumn(column.name, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`col-${column.name}`}
                        className="flex-1 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="font-medium">{column.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {column.type}
                        </Badge>
                        {column.possibleRoles.includes("metric") && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600">
                            D
                          </Badge>
                        )}
                        {column.possibleRoles.includes("metric") && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                            M
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {/* Metric-capable columns */}
              {metricColumns.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label className="text-xs text-muted-foreground font-medium">
                    Métricas (para medir)
                  </Label>
                  {metricColumns.map((column) => (
                    <div
                      key={column.name}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/20 transition-colors"
                    >
                      <Checkbox
                        id={`col-${column.name}`}
                        checked={selectedColumnNames.has(column.name)}
                        onCheckedChange={(checked) =>
                          handleToggleColumn(column.name, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`col-${column.name}`}
                        className="flex-1 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="font-medium">{column.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {column.type}
                        </Badge>
                        {column.possibleRoles.includes("dimension") && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600">
                            D
                          </Badge>
                        )}
                        {column.possibleRoles.includes("metric") && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                            M
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Columns Configuration */}
          {selectedColumns.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold mb-3 block">Configurar Colunas Selecionadas</Label>
              <div className="space-y-3 border rounded-lg p-4 bg-card">
                {selectedColumns.map((viewCol, index) => {
                  const column = columns.find((c) => c.name === viewCol.columnName)
                  if (!column) return null

                  return (
                    <div
                      key={viewCol.columnName}
                      className="flex items-center gap-3 p-3 rounded-md border bg-secondary/20"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{viewCol.columnName}</span>
                          <Badge variant="outline" className="text-xs">
                            {column.type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1 block">Papel</Label>
                            <Select
                              value={viewCol.role}
                              onValueChange={(value: "dimension" | "metric") =>
                                handleRoleChange(viewCol.columnName, value)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(column.possibleRoles.includes("dimension") ||
                                  column.possibleRoles.includes("both")) && (
                                  <SelectItem value="dimension">Dimensão</SelectItem>
                                )}
                                {(column.possibleRoles.includes("metric") ||
                                  column.possibleRoles.includes("both")) && (
                                  <SelectItem value="metric">Métrica</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {viewCol.role === "metric" && (
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground mb-1 block">
                                Agregação
                              </Label>
                              <Select
                                value={viewCol.aggregation || "count"}
                                onValueChange={(value: AggregationType) =>
                                  handleAggregationChange(viewCol.columnName, value)
                                }
                                disabled={
                                  column.type !== "number" &&
                                  column.type !== "currency" &&
                                  viewCol.aggregation !== "count"
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="count">Contagem</SelectItem>
                                  {(column.type === "number" || column.type === "currency") && (
                                    <>
                                      <SelectItem value="sum">Soma</SelectItem>
                                      <SelectItem value="avg">Média</SelectItem>
                                      <SelectItem value="max">Máximo</SelectItem>
                                      <SelectItem value="min">Mínimo</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRemoveColumn(viewCol.columnName)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Explanation */}
        {selectedColumns.length > 0 && (
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Explicação da Visão</AlertTitle>
            <AlertDescription className="text-foreground">{explanation}</AlertDescription>
          </Alert>
        )}

        {selectedColumns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma coluna selecionada</p>
            <p className="text-xs mt-1">Selecione colunas acima para criar sua visão personalizada</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


