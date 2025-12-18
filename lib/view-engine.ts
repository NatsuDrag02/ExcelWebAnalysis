import type { DataView, ViewColumn, ColumnMetadata, AggregationType } from "./types"

/**
 * Applies a view to data, selecting columns and applying aggregations
 */
export function applyView(
  data: Record<string, any>[],
  viewColumns: ViewColumn[],
  columns: ColumnMetadata[],
): Record<string, any>[] {
  if (viewColumns.length === 0) return []

  // Separate dimensions and metrics
  const dimensions = viewColumns.filter((col) => col.role === "dimension")
  const metrics = viewColumns.filter((col) => col.role === "metric")

  // If there are metrics with aggregations, group by dimensions
  if (metrics.length > 0 && metrics.some((m) => m.aggregation)) {
    return applyAggregatedView(data, dimensions, metrics, columns)
  }

  // If only dimensions, show unique combinations
  if (dimensions.length > 0 && metrics.length === 0) {
    return getUniqueCombinations(data, dimensions.map((d) => d.columnName))
  }

  // If only metrics without aggregation, show raw values
  if (metrics.length > 0 && !metrics.some((m) => m.aggregation)) {
    return selectColumns(data, viewColumns.map((c) => c.columnName))
  }

  // Default: just select columns
  return selectColumns(data, viewColumns.map((c) => c.columnName))
}

/**
 * Applies aggregations grouping by dimensions
 */
function applyAggregatedView(
  data: Record<string, any>[],
  dimensions: ViewColumn[],
  metrics: ViewColumn[],
  columns: ColumnMetadata[],
): Record<string, any>[] {
  const dimensionNames = dimensions.map((d) => d.columnName)

  // Group data by dimension values
  const grouped = data.reduce(
    (acc, row) => {
      // Create key from dimension values
      const key = dimensionNames.map((dim) => String(row[dim] || "")).join("|")

      if (!acc[key]) {
        acc[key] = {
          key,
          dimensions: dimensionNames.reduce(
            (dims, dim) => {
              dims[dim] = row[dim]
              return dims
            },
            {} as Record<string, any>,
          ),
          rows: [] as Record<string, any>[],
        }
      }

      acc[key].rows.push(row)
      return acc
    },
    {} as Record<
      string,
      {
        key: string
        dimensions: Record<string, any>
        rows: Record<string, any>[]
      }
    >,
  )

  // Apply aggregations to each group
  return Object.values(grouped).map((group) => {
    const result: Record<string, any> = { ...group.dimensions }

    metrics.forEach((metric) => {
      const column = columns.find((c) => c.name === metric.columnName)
      if (!column) return

      const values = group.rows
        .map((row) => {
          const val = row[metric.columnName]
          if (val == null || val === "") return null

          if (column.type === "number" || column.type === "currency") {
            const num = typeof val === "string"
              ? Number.parseFloat(val.replace(/[,$€£¥₹]/g, "").replace(/,/g, ""))
              : Number.parseFloat(val)
            return isNaN(num) || !isFinite(num) ? null : num
          }

          return val
        })
        .filter((v) => v !== null) as number[]

      const aggregation = metric.aggregation || "count"

      switch (aggregation) {
        case "count":
          result[metric.columnName] = group.rows.length
          break
        case "sum":
          result[metric.columnName] =
            values.length > 0 ? values.reduce((sum, val) => sum + val, 0) : 0
          break
        case "avg":
          result[metric.columnName] =
            values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
          break
        case "max":
          result[metric.columnName] = values.length > 0 ? Math.max(...values) : null
          break
        case "min":
          result[metric.columnName] = values.length > 0 ? Math.min(...values) : null
          break
      }
    })

    return result
  })
}

/**
 * Gets unique combinations of dimension columns
 */
function getUniqueCombinations(data: Record<string, any>[], columnNames: string[]): Record<string, any>[] {
  const seen = new Set<string>()
  const result: Record<string, any>[] = []

  for (const row of data) {
    const key = columnNames.map((col) => String(row[col] || "")).join("|")

    if (!seen.has(key)) {
      seen.add(key)
      result.push(selectColumns([row], columnNames)[0])
    }
  }

  return result
}

/**
 * Selects only specified columns from data
 */
function selectColumns(data: Record<string, any>[], columnNames: string[]): Record<string, any>[] {
  return data.map((row) => {
    const selected: Record<string, any> = {}
    columnNames.forEach((col) => {
      selected[col] = row[col]
    })
    return selected
  })
}

/**
 * Generates natural language explanation of a view
 */
export function generateViewExplanation(
  viewColumns: ViewColumn[],
  columns: ColumnMetadata[],
  rowCount: number,
): string {
  const dimensions = viewColumns.filter((c) => c.role === "dimension")
  const metrics = viewColumns.filter((c) => c.role === "metric")

  let explanation = ""

  if (dimensions.length === 0 && metrics.length === 0) {
    return "Nenhuma coluna selecionada"
  }

  // Build dimension part
  if (dimensions.length > 0) {
    const dimNames = dimensions.map((d) => {
      const col = columns.find((c) => c.name === d.columnName)
      return col?.name || d.columnName
    })

    if (dimensions.length === 1) {
      explanation += `agrupado por ${dimNames[0]}`
    } else {
      explanation += `agrupado por ${dimNames.slice(0, -1).join(", ")} e ${dimNames[dimNames.length - 1]}`
    }
  }

  // Build metric part
  if (metrics.length > 0) {
    const metricParts = metrics.map((m) => {
      const col = columns.find((c) => c.name === m.columnName)
      const colName = col?.name || m.columnName

      if (m.aggregation) {
        const aggLabels: Record<AggregationType, string> = {
          count: "contagem",
          sum: "soma",
          avg: "média",
          max: "máximo",
          min: "mínimo",
        }
        return `${aggLabels[m.aggregation]} de ${colName}`
      }
      return colName
    })

    if (explanation) {
      explanation = `Mostrando ${metricParts.join(", ")} ${explanation}`
    } else {
      explanation = `Mostrando ${metricParts.join(", ")}`
    }
  } else if (dimensions.length > 0) {
    explanation = `Mostrando combinações únicas ${explanation}`
  }

  if (rowCount > 0) {
    explanation += `. ${rowCount} ${rowCount === 1 ? "registro" : "registros"} exibido${rowCount === 1 ? "" : "s"}.`
  }

  return explanation || "Visualização configurada"
}

/**
 * Validates a view configuration
 */
export function validateView(viewColumns: ViewColumn[], columns: ColumnMetadata[]): {
  valid: boolean
  reason?: string
} {
  if (viewColumns.length === 0) {
    return { valid: false, reason: "Selecione pelo menos uma coluna" }
  }

  // Check if all column names exist
  for (const viewCol of viewColumns) {
    const column = columns.find((c) => c.name === viewCol.columnName)
    if (!column) {
      return { valid: false, reason: `Coluna "${viewCol.columnName}" não encontrada` }
    }

    // Validate role
    if (viewCol.role === "metric") {
      if (!column.possibleRoles.includes("metric") && !column.possibleRoles.includes("both")) {
        return {
          valid: false,
          reason: `A coluna "${viewCol.columnName}" não pode ser usada como métrica`,
        }
      }

      // Validate aggregation for numeric columns
      if (viewCol.aggregation && viewCol.aggregation !== "count") {
        if (column.type !== "number" && column.type !== "currency") {
          return {
            valid: false,
            reason: `A agregação "${viewCol.aggregation}" requer uma coluna numérica`,
          }
        }
      }
    } else if (viewCol.role === "dimension") {
      if (!column.possibleRoles.includes("dimension") && !column.possibleRoles.includes("both")) {
        return {
          valid: false,
          reason: `A coluna "${viewCol.columnName}" não pode ser usada como dimensão`,
        }
      }
    }
  }

  return { valid: true }
}


