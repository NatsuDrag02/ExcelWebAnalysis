"use client"
import { Plus, Trash2, X, Save, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { SheetMetadata, FilterGroup, FilterRule } from "@/lib/types"

interface FilterPanelProps {
  sheet: SheetMetadata
  filterGroups: FilterGroup[]
  onFilterGroupsChange: (groups: FilterGroup[]) => void
  onSaveFilter: () => void
  onLoadFilter: () => void
}

export default function FilterPanel({
  sheet,
  filterGroups,
  onFilterGroupsChange,
  onSaveFilter,
  onLoadFilter,
}: FilterPanelProps) {
  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: crypto.randomUUID(),
      logic: "AND",
      rules: [],
    }
    onFilterGroupsChange([...filterGroups, newGroup])
  }

  const removeFilterGroup = (groupId: string) => {
    onFilterGroupsChange(filterGroups.filter((g) => g.id !== groupId))
  }

  const updateFilterGroup = (groupId: string, updates: Partial<FilterGroup>) => {
    onFilterGroupsChange(filterGroups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)))
  }

  const addRule = (groupId: string) => {
    const newRule: FilterRule = {
      id: crypto.randomUUID(),
      columnName: sheet.columns[0]?.name || "",
      operator: "equals",
      value: "",
    }

    onFilterGroupsChange(filterGroups.map((g) => (g.id === groupId ? { ...g, rules: [...g.rules, newRule] } : g)))
  }

  const removeRule = (groupId: string, ruleId: string) => {
    onFilterGroupsChange(
      filterGroups.map((g) => (g.id === groupId ? { ...g, rules: g.rules.filter((r) => r.id !== ruleId) } : g)),
    )
  }

  const updateRule = (groupId: string, ruleId: string, updates: Partial<FilterRule>) => {
    onFilterGroupsChange(
      filterGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              rules: g.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
            }
          : g,
      ),
    )
  }

  const clearAllFilters = () => {
    onFilterGroupsChange([])
  }

  return (
    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Construtor de Filtros</h3>
        <div className="flex items-center gap-2">
          {filterGroups.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={onLoadFilter} className="shadow-sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Carregar
              </Button>
              <Button variant="ghost" size="sm" onClick={onSaveFilter} className="shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                Salvar Filtro
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="shadow-sm">
                <X className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={addFilterGroup} className="shadow-sm bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Grupo de Filtros
          </Button>
        </div>
      </div>

      {filterGroups.length === 0 ? (
        <Card className="p-8 border-dashed border-2 text-center bg-accent/5">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum filtro aplicado</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Crie filtros para refinar seus dados e encontrar informações específicas
            </p>
            <Button variant="default" size="sm" onClick={addFilterGroup} className="mt-2 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Filtro
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filterGroups.map((group, groupIndex) => (
            <Card key={group.id} className="p-4 bg-card border-border/60 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Grupo {groupIndex + 1}</span>
                  <Select
                    value={group.logic}
                    onValueChange={(value: "AND" | "OR") => updateFilterGroup(group.id, { logic: value })}
                  >
                    <SelectTrigger className="w-20 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">E</SelectItem>
                      <SelectItem value="OR">OU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFilterGroup(group.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-2">
                {group.rules.map((rule, ruleIndex) => (
                  <FilterRuleEditor
                    key={rule.id}
                    rule={rule}
                    sheet={sheet}
                    showLogic={ruleIndex > 0}
                    logic={group.logic}
                    onUpdate={(updates) => updateRule(group.id, rule.id, updates)}
                    onRemove={() => removeRule(group.id, rule.id)}
                  />
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 bg-transparent shadow-sm"
                  onClick={() => addRule(group.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Regra
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface FilterRuleEditorProps {
  rule: FilterRule
  sheet: SheetMetadata
  showLogic: boolean
  logic: "AND" | "OR"
  onUpdate: (updates: Partial<FilterRule>) => void
  onRemove: () => void
}

function FilterRuleEditor({ rule, sheet, showLogic, logic, onUpdate, onRemove }: FilterRuleEditorProps) {
  const selectedColumn = sheet.columns.find((c) => c.name === rule.columnName)
  const columnType = selectedColumn?.type || "text"

  const getOperatorsForType = (type: string) => {
    switch (type) {
      case "number":
      case "currency":
        return [
          { value: "equals", label: "Igual a" },
          { value: "notEquals", label: "Diferente de" },
          { value: "greaterThan", label: "Maior que" },
          { value: "lessThan", label: "Menor que" },
          { value: "between", label: "Entre" },
        ]
      case "date":
        return [
          { value: "equals", label: "Igual a" },
          { value: "notEquals", label: "Diferente de" },
          { value: "greaterThan", label: "Depois de" },
          { value: "lessThan", label: "Antes de" },
          { value: "between", label: "Entre" },
        ]
      case "boolean":
        return [
          { value: "equals", label: "Igual a" },
          { value: "notEquals", label: "Diferente de" },
        ]
      default:
        return [
          { value: "equals", label: "Igual a" },
          { value: "notEquals", label: "Diferente de" },
          { value: "contains", label: "Contém" },
          { value: "notContains", label: "Não Contém" },
          { value: "in", label: "Na Lista" },
        ]
    }
  }

  const operators = getOperatorsForType(columnType)

  return (
    <div className="flex items-start gap-2 bg-card p-3 rounded-md border border-border">
      {showLogic && (
        <div className="flex items-center justify-center w-12 h-9 text-xs font-medium text-primary bg-primary/10 rounded">
          {logic === "AND" ? "E" : "OU"}
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <Select value={rule.columnName} onValueChange={(value) => onUpdate({ columnName: value })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Coluna" />
            </SelectTrigger>
            <SelectContent>
              {sheet.columns.map((col) => (
                <SelectItem key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-3">
          <Select value={rule.operator} onValueChange={(value: any) => onUpdate({ operator: value })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Operador" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-5">
          <FilterValueInput rule={rule} column={selectedColumn} onUpdate={onUpdate} />
        </div>
      </div>

      <Button variant="ghost" size="sm" className="h-9 px-2" onClick={onRemove}>
        <X className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}

interface FilterValueInputProps {
  rule: FilterRule
  column: any
  onUpdate: (updates: Partial<FilterRule>) => void
}

function FilterValueInput({ rule, column, onUpdate }: FilterValueInputProps) {
  if (!column) {
    return <Input className="h-9 text-xs" placeholder="Valor" disabled />
  }

  if (rule.operator === "in" && column.uniqueValues && column.uniqueValues.length > 0) {
    const selectedValues = Array.isArray(rule.value) ? rule.value : []

    return (
      <div className="border border-input rounded-md p-2 max-h-32 overflow-y-auto bg-background">
        <div className="space-y-2">
          {column.uniqueValues.slice(0, 10).map((val: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <Checkbox
                id={`${rule.id}-${idx}`}
                checked={selectedValues.includes(val)}
                onCheckedChange={(checked) => {
                  const newValues = checked ? [...selectedValues, val] : selectedValues.filter((v: any) => v !== val)
                  onUpdate({ value: newValues })
                }}
              />
              <Label htmlFor={`${rule.id}-${idx}`} className="text-xs cursor-pointer">
                {String(val)}
              </Label>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (
    (rule.operator === "equals" || rule.operator === "notEquals") &&
    column.type === "text" &&
    column.uniqueValues &&
    column.uniqueValues.length > 0 &&
    column.uniqueValues.length <= 50
  ) {
    return (
      <Select value={String(rule.value || "")} onValueChange={(value) => onUpdate({ value })}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Selecione um valor" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {column.uniqueValues.map((val: any, idx: number) => (
            <SelectItem key={idx} value={String(val)}>
              {String(val)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (rule.operator === "between") {
    return (
      <div className="flex gap-1">
        <Input
          type={
            column.type === "date" ? "date" : column.type === "number" || column.type === "currency" ? "number" : "text"
          }
          className="h-9 text-xs"
          placeholder="De"
          value={rule.value || ""}
          onChange={(e) => onUpdate({ value: e.target.value })}
        />
        <Input
          type={
            column.type === "date" ? "date" : column.type === "number" || column.type === "currency" ? "number" : "text"
          }
          className="h-9 text-xs"
          placeholder="Até"
          value={rule.value2 || ""}
          onChange={(e) => onUpdate({ value2: e.target.value })}
        />
      </div>
    )
  }

  if (column.type === "boolean") {
    return (
      <Select value={String(rule.value)} onValueChange={(value) => onUpdate({ value })}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Selecione um valor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Verdadeiro</SelectItem>
          <SelectItem value="false">Falso</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (column.type === "date") {
    return (
      <Input
        type="date"
        className="h-9 text-xs"
        value={rule.value || ""}
        onChange={(e) => onUpdate({ value: e.target.value })}
      />
    )
  }

  if (column.type === "number" || column.type === "currency") {
    return (
      <Input
        type="number"
        className="h-9 text-xs"
        placeholder="Valor"
        value={rule.value || ""}
        onChange={(e) => onUpdate({ value: e.target.value })}
      />
    )
  }

  if (
    (rule.operator === "contains" || rule.operator === "notContains") &&
    column.type === "text" &&
    column.uniqueValues &&
    column.uniqueValues.length > 0 &&
    column.uniqueValues.length <= 50
  ) {
    return (
      <div className="space-y-2">
        <Select value={String(rule.value || "")} onValueChange={(value) => onUpdate({ value })}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Selecione ou digite" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {column.uniqueValues.map((val: any, idx: number) => (
              <SelectItem key={idx} value={String(val)}>
                {String(val)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          className="h-9 text-xs"
          placeholder="Ou digite um valor personalizado"
          value={rule.value || ""}
          onChange={(e) => onUpdate({ value: e.target.value })}
        />
      </div>
    )
  }

  return (
    <Input
      type="text"
      className="h-9 text-xs"
      placeholder="Valor"
      value={rule.value || ""}
      onChange={(e) => onUpdate({ value: e.target.value })}
    />
  )
}
