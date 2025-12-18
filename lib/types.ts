export type ColumnType = "text" | "number" | "date" | "boolean" | "currency"
export type ColumnRole = "dimension" | "metric" | "both"
export type AggregationType = "count" | "sum" | "avg" | "max" | "min"
export type ChartType = "bar" | "line" | "pie" | "area" | "scatter"

export interface ColumnStats {
  min?: number
  max?: number
  avg?: number
  distinctCount: number
  nullCount: number
  minDate?: Date
  maxDate?: Date
}

export interface ColumnMetadata {
  name: string
  type: ColumnType
  possibleRoles: ColumnRole[]
  stats: ColumnStats
  uniqueValues?: (string | number | boolean)[]
  // Legacy fields for backward compatibility
  min?: number
  max?: number
  minDate?: Date
  maxDate?: Date
}

export interface SheetMetadata {
  name: string
  columns: ColumnMetadata[]
  rowCount: number
  data: Record<string, any>[]
}

export interface WorkbookData {
  fileName: string
  sheets: SheetMetadata[]
}

export interface FilterRule {
  id: string
  columnName: string
  operator: "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "lessThan" | "between" | "in"
  value: any
  value2?: any // For 'between' operator
}

export interface FilterGroup {
  id: string
  logic: "AND" | "OR"
  rules: FilterRule[]
}

export interface SavedFilter {
  id: string
  name: string
  description?: string
  filterGroups: FilterGroup[]
  sheetName: string
  createdAt: Date
  updatedAt: Date
}

export interface ChartConfiguration {
  dimension: string // Column name for grouping
  metric: string | null // Column name for measurement (null = count)
  aggregation: AggregationType
  chartType: ChartType
}

export interface ChartExplanation {
  text: string
  dimension: string
  metric: string | null
  aggregation: AggregationType
  chartType: ChartType
  dataPointCount: number
}

export interface ViewColumn {
  columnName: string
  role: "dimension" | "metric"
  aggregation?: AggregationType
}

export interface DataView {
  id: string
  name: string
  sheetName: string
  columns: ViewColumn[]
  filters: FilterGroup[]
  createdAt: Date
  updatedAt?: Date
}

export interface ViewExplanation {
  text: string
  columns: ViewColumn[]
  hasAggregation: boolean
  rowCount: number
}
