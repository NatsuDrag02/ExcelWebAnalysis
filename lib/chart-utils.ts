import type {
  ColumnMetadata,
  ChartConfiguration,
  ChartExplanation,
  AggregationType,
  ChartType,
  ColumnRole,
} from "./types"

/**
 * Generates a natural language explanation of a chart configuration
 */
export function generateChartExplanation(
  config: ChartConfiguration,
  columns: ColumnMetadata[],
  dataPointCount: number,
): ChartExplanation {
  const dimensionCol = columns.find((c) => c.name === config.dimension)
  const metricCol = config.metric ? columns.find((c) => c.name === config.metric) : null

  const dimensionName = dimensionCol?.name || config.dimension
  const metricName = metricCol?.name || "registros"

  const aggregationLabels: Record<AggregationType, string> = {
    count: "contagem",
    sum: "soma",
    avg: "média",
    max: "máximo",
    min: "mínimo",
  }

  const chartTypeLabels: Record<ChartType, string> = {
    bar: "gráfico de barras",
    line: "gráfico de linhas",
    pie: "gráfico de pizza",
    area: "gráfico de área",
    scatter: "gráfico de dispersão",
  }

  const aggregationLabel = aggregationLabels[config.aggregation]
  const chartTypeLabel = chartTypeLabels[config.chartType]

  let text = ""
  if (config.metric) {
    text = `Exibindo a ${aggregationLabel} de ${metricName} agrupada por ${dimensionName}`
  } else {
    text = `Exibindo a contagem de registros agrupada por ${dimensionName}`
  }

  text += ` em um ${chartTypeLabel}.`

  if (dataPointCount > 0) {
    text += ` Mostrando ${dataPointCount} ${dataPointCount === 1 ? "categoria" : "categorias"}.`
  }

  return {
    text,
    dimension: config.dimension,
    metric: config.metric,
    aggregation: config.aggregation,
    chartType: config.chartType,
    dataPointCount,
  }
}

/**
 * Suggests compatible metrics for a given dimension
 */
export function suggestCompatibleMetrics(
  dimension: string,
  columns: ColumnMetadata[],
): ColumnMetadata[] {
  const dimensionCol = columns.find((c) => c.name === dimension)
  if (!dimensionCol) return []

  // Return all columns that can be metrics
  return columns.filter(
    (col) =>
      col.name !== dimension &&
      (col.possibleRoles.includes("metric") || col.possibleRoles.includes("both")),
  )
}

/**
 * Suggests compatible dimensions for a given metric
 */
export function suggestCompatibleDimensions(
  metric: string | null,
  columns: ColumnMetadata[],
): ColumnMetadata[] {
  if (!metric) {
    // For count, suggest all dimension-capable columns
    return columns.filter(
      (col) => col.possibleRoles.includes("dimension") || col.possibleRoles.includes("both"),
    )
  }

  const metricCol = columns.find((c) => c.name === metric)
  if (!metricCol) return []

  // Return all columns that can be dimensions
  return columns.filter(
    (col) =>
      col.name !== metric &&
      (col.possibleRoles.includes("dimension") || col.possibleRoles.includes("both")),
  )
}

/**
 * Suggests an appropriate aggregation type for a metric
 */
export function suggestAggregation(metric: ColumnMetadata | null): AggregationType {
  if (!metric) return "count"

  // For numeric metrics, default to sum if it makes sense, otherwise avg
  if (metric.type === "number" || metric.type === "currency") {
    // If values are likely counts or IDs, use sum
    if (metric.stats.min !== undefined && metric.stats.min >= 0 && metric.stats.max !== undefined) {
      // If max is reasonable for sum (not too large), use sum
      if (metric.stats.max < 1000000) {
        return "sum"
      }
    }
    return "avg"
  }

  return "count"
}

/**
 * Suggests an appropriate chart type based on dimension and metric
 */
export function suggestChartType(
  dimension: ColumnMetadata,
  metric: ColumnMetadata | null,
  aggregation: AggregationType,
): ChartType {
  const distinctCount = dimension.stats.distinctCount

  // For very few categories, pie chart works well
  if (distinctCount <= 5 && aggregation !== "count") {
    return "pie"
  }

  // For many categories, bar chart is better
  if (distinctCount > 20) {
    return "bar"
  }

  // For time-based dimensions, line or area chart
  if (dimension.type === "date") {
    return aggregation === "count" ? "line" : "area"
  }

  // Default to bar chart
  return "bar"
}

/**
 * Validates if a chart configuration is valid
 */
export function validateChartConfiguration(
  config: ChartConfiguration,
  columns: ColumnMetadata[],
): { valid: boolean; reason?: string } {
  const dimensionCol = columns.find((c) => c.name === config.dimension)
  if (!dimensionCol) {
    return { valid: false, reason: "Dimensão não encontrada" }
  }

  if (!dimensionCol.possibleRoles.includes("dimension") && !dimensionCol.possibleRoles.includes("both")) {
    return { valid: false, reason: "A coluna selecionada não pode ser usada como dimensão" }
  }

  if (config.metric) {
    const metricCol = columns.find((c) => c.name === config.metric)
    if (!metricCol) {
      return { valid: false, reason: "Métrica não encontrada" }
    }

    if (!metricCol.possibleRoles.includes("metric") && !metricCol.possibleRoles.includes("both")) {
      return { valid: false, reason: "A coluna selecionada não pode ser usada como métrica" }
    }

    // Aggregation validation
    if (config.aggregation !== "count") {
      if (metricCol.type !== "number" && metricCol.type !== "currency") {
        return {
          valid: false,
          reason: `A agregação "${config.aggregation}" requer uma coluna numérica`,
        }
      }
    }
  }

  return { valid: true }
}

/**
 * Gets default chart configuration based on available columns
 */
export function getDefaultChartConfiguration(columns: ColumnMetadata[]): ChartConfiguration | null {
  const dimensions = columns.filter(
    (col) => col.possibleRoles.includes("dimension") || col.possibleRoles.includes("both"),
  )
  const metrics = columns.filter(
    (col) => col.possibleRoles.includes("metric") || col.possibleRoles.includes("both"),
  )

  if (dimensions.length === 0) return null

  const dimension = dimensions[0]
  const metric = metrics.length > 0 ? metrics[0] : null

  const aggregation = suggestAggregation(metric || null)
  const chartType = suggestChartType(dimension, metric, aggregation)

  return {
    dimension: dimension.name,
    metric: metric?.name || null,
    aggregation,
    chartType,
  }
}


