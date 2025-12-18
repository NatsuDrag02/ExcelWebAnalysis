"use client"

import { X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { FilterGroup, ColumnMetadata } from "@/lib/types"

interface ActiveFiltersBarProps {
  filterGroups: FilterGroup[]
  columns: ColumnMetadata[]
  totalRows: number
  filteredRows: number
  onRemoveFilter: (groupId: string, ruleId: string) => void
  onClearAll: () => void
}

export default function ActiveFiltersBar({
  filterGroups,
  columns,
  totalRows,
  filteredRows,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersBarProps) {
  const hasFilters = filterGroups.some((group) => group.rules.length > 0)

  if (!hasFilters) {
    return (
      <Card className="border-dashed border-2 bg-accent/5 shadow-sm">
        <div className="p-6 text-center">
          <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-1">Nenhum filtro aplicado</p>
          <p className="text-xs text-muted-foreground">
            Aplique filtros para refinar os dados e encontrar informações específicas
          </p>
        </div>
      </Card>
    )
  }

  const getOperatorLabel = (operator: string) => {
    const labels: Record<string, string> = {
      equals: "igual a",
      notEquals: "diferente de",
      contains: "contém",
      notContains: "não contém",
      greaterThan: "maior que",
      lessThan: "menor que",
      between: "entre",
      in: "na lista",
    }
    return labels[operator] || operator
  }

  const getFilterDescription = () => {
    const parts: string[] = []

    filterGroups.forEach((group, groupIndex) => {
      const groupParts: string[] = []

      group.rules.forEach((rule) => {
        const column = columns.find((c) => c.name === rule.columnName)
        if (!column) return

        let description = `${rule.columnName} ${getOperatorLabel(rule.operator)}`

        if (rule.operator === "between") {
          description += ` ${rule.value} e ${rule.value2}`
        } else if (rule.operator === "in" && Array.isArray(rule.value)) {
          description += ` (${rule.value.length} valores)`
        } else {
          description += ` "${rule.value}"`
        }

        groupParts.push(description)
      })

      if (groupParts.length > 0) {
        const groupText = groupParts.join(group.logic === "AND" ? " E " : " OU ")
        parts.push(groupIndex > 0 ? `(${groupText})` : groupText)
      }
    })

    return parts.join(" E ")
  }

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm">
      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-primary text-primary-foreground shadow-sm">
                {filteredRows.toLocaleString("pt-BR")} de {totalRows.toLocaleString("pt-BR")} registros
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({((filteredRows / totalRows) * 100).toFixed(1)}% dos dados)
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-medium">Filtros ativos:</span> {getFilterDescription()}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClearAll} className="shrink-0 shadow-sm bg-transparent">
            <X className="h-4 w-4 mr-2" />
            Limpar Todos
          </Button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {filterGroups.map((group) =>
            group.rules.map((rule) => {
              const column = columns.find((c) => c.name === rule.columnName)
              if (!column) return null

              let displayValue = rule.value
              if (rule.operator === "between") {
                displayValue = `${rule.value} — ${rule.value2}`
              } else if (rule.operator === "in" && Array.isArray(rule.value)) {
                displayValue = `${rule.value.length} valores`
              }

              return (
                <Badge
                  key={rule.id}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 text-xs font-normal bg-card hover:bg-card/80 border border-border/60 shadow-sm transition-colors"
                >
                  <span className="font-medium text-foreground">{rule.columnName}</span>
                  <span className="text-muted-foreground mx-1.5">{getOperatorLabel(rule.operator)}</span>
                  <span className="text-foreground max-w-[150px] truncate">{displayValue}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-5 w-5 p-0 hover:bg-destructive/10 rounded-full"
                    onClick={() => onRemoveFilter(group.id, rule.id)}
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </Badge>
              )
            }),
          )}
        </div>
      </div>
    </Card>
  )
}
