"use client"

import { useState, useMemo, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, AlertCircle, Info, Sparkles, CheckCircle2, XCircle } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import QuickGuide from "./quick-guide"
import type { ColumnMetadata, ChartConfiguration, AggregationType, ChartType } from "@/lib/types"
import {
  generateChartExplanation,
  suggestCompatibleMetrics,
  suggestCompatibleDimensions,
  suggestAggregation,
  suggestChartType,
  validateChartConfiguration,
  getDefaultChartConfiguration,
} from "@/lib/chart-utils"

interface DataVisualizationProps {
  data: Record<string, any>[]
  columns: ColumnMetadata[]
  sheetName: string
}

const CHART_COLORS = [
  "#8B5CF6", // Roxo vibrante
  "#10B981", // Verde esmeralda
  "#F59E0B", // Amarelo âmbar
  "#EF4444", // Vermelho
  "#06B6D4", // Ciano
  "#EC4899", // Rosa
  "#6366F1", // Índigo
]

const AGGREGATION_LABELS: Record<AggregationType, string> = {
  count: "Contagem",
  sum: "Soma",
  avg: "Média",
  max: "Máximo",
  min: "Mínimo",
}

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Barras",
  line: "Linhas",
  pie: "Pizza",
  area: "Área",
  scatter: "Dispersão",
}

export default function DataVisualization({ data, columns, sheetName }: DataVisualizationProps) {
  // Initialize with default configuration
  const defaultConfig = useMemo(() => getDefaultChartConfiguration(columns), [columns])
  
  const [config, setConfig] = useState<ChartConfiguration>(
    defaultConfig || {
      dimension: columns.find((c) => c.possibleRoles.includes("dimension") || c.possibleRoles.includes("both"))?.name || columns[0]?.name || "",
      metric: null,
      aggregation: "count",
      chartType: "bar",
    }
  )

  // Update config when columns change
  useEffect(() => {
    if (defaultConfig) {
      setConfig(defaultConfig)
    }
  }, [defaultConfig])

  // Get dimension and metric column objects
  const dimensionCol = columns.find((c) => c.name === config.dimension)
  const metricCol = config.metric ? columns.find((c) => c.name === config.metric) : null

  // Get compatible options
  const compatibleDimensions = useMemo(
    () => suggestCompatibleDimensions(config.metric, columns),
    [config.metric, columns]
  )
  const compatibleMetrics = useMemo(
    () => suggestCompatibleMetrics(config.dimension, columns),
    [config.dimension, columns]
  )

  // Validate configuration
  const validation = useMemo(() => validateChartConfiguration(config, columns), [config, columns])

  // Calculate chart data with aggregation
  const chartData = useMemo(() => {
    if (!config.dimension || data.length === 0) return []

    const grouped = data.reduce(
      (acc, row) => {
        const key = String(row[config.dimension] || "Não definido")
        
        if (!acc[key]) {
          acc[key] = {
            name: key,
            value: 0,
            count: 0,
            values: [] as number[],
          }
        }

        acc[key].count += 1

        if (config.metric) {
          const rawValue = row[config.metric]
          const numValue = typeof rawValue === "string" 
            ? Number.parseFloat(rawValue.replace(/[,$€£¥₹]/g, "").replace(/,/g, ""))
            : Number.parseFloat(rawValue)
          
          if (!isNaN(numValue) && isFinite(numValue)) {
            acc[key].values.push(numValue)
          }
        }

        return acc
      },
      {} as Record<string, { name: string; value: number; count: number; values: number[] }>,
    )

    // Apply aggregation
    return Object.values(grouped)
      .map((item) => {
        let value = item.count // Default to count

        if (config.metric && item.values.length > 0) {
          switch (config.aggregation) {
            case "sum":
              value = item.values.reduce((sum: number, val: number) => sum + val, 0)
              break
            case "avg":
              value = item.values.reduce((sum: number, val: number) => sum + val, 0) / item.values.length
              break
            case "max":
              value = Math.max(...item.values)
              break
            case "min":
              value = Math.min(...item.values)
              break
            case "count":
            default:
              value = item.count
              break
          }
        }

        return {
          name: item.name,
          value: Number.isFinite(value) ? value : 0,
          count: item.count,
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 50) // Limit to 50 categories for performance
  }, [data, config])

  // Generate explanation
  const explanation = useMemo(
    () => generateChartExplanation(config, columns, chartData.length),
    [config, columns, chartData.length]
  )

  // Handle dimension change
  const handleDimensionChange = (dimension: string) => {
    const newDimensionCol = columns.find((c) => c.name === dimension)
    if (!newDimensionCol) return

    // Suggest compatible metrics
    const newCompatibleMetrics = suggestCompatibleMetrics(dimension, columns)
    const newMetric = newCompatibleMetrics.length > 0 ? newCompatibleMetrics[0].name : null

    // Suggest aggregation
    const newMetricCol = newMetric ? columns.find((c) => c.name === newMetric) : null
    const newAggregation = suggestAggregation(newMetricCol || null)

    // Suggest chart type
    const newChartType = suggestChartType(newDimensionCol, newMetricCol || null, newAggregation)

    setConfig({
      dimension,
      metric: newMetric,
      aggregation: newAggregation,
      chartType: newChartType,
    })
  }

  // Handle metric change
  const handleMetricChange = (metric: string | null) => {
    const newMetricCol = metric ? columns.find((c) => c.name === metric) : null
    const newAggregation = suggestAggregation(newMetricCol || null)
    const newChartType = dimensionCol ? suggestChartType(dimensionCol, newMetricCol || null, newAggregation) : "bar"

    setConfig({
      ...config,
      metric,
      aggregation: newAggregation,
      chartType: newChartType,
    })
  }

  // Handle aggregation change
  const handleAggregationChange = (aggregation: AggregationType) => {
    setConfig({
      ...config,
      aggregation,
    })
  }

  // Handle chart type change
  const handleChartTypeChange = (chartType: ChartType) => {
    setConfig({
      ...config,
      chartType,
    })
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-accent/5">
        <CardContent className="p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">Nenhum dado disponível para visualização</p>
              <p className="text-sm text-muted-foreground">
                Aplique ou ajuste seus filtros para visualizar dados em gráficos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No dimensions available
  if (compatibleDimensions.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-accent/5">
        <CardContent className="p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">Sem colunas adequadas para dimensão</p>
              <p className="text-sm text-muted-foreground">
                Gráficos requerem pelo menos uma coluna que possa ser usada como dimensão (texto, data ou categoria)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Guide */}
      <QuickGuide />

      {/* Configuration Panel */}
      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Criar Visualização
              </CardTitle>
              <CardDescription>
                Configure seu gráfico: escolha uma dimensão para agrupar e uma métrica para medir
              </CardDescription>
            </div>
            {validation.valid ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Válido
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                <XCircle className="h-3 w-3 mr-1" />
                Inválido
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!validation.valid && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuração inválida</AlertTitle>
              <AlertDescription>{validation.reason}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Dimension Selector */}
            <div className="space-y-2">
              <Label htmlFor="dimension" className="flex items-center gap-2">
                Agrupar por <span className="text-xs text-muted-foreground">(Dimensão)</span>
              </Label>
              <Select value={config.dimension} onValueChange={handleDimensionChange}>
                <SelectTrigger id="dimension">
                  <SelectValue placeholder="Selecione a dimensão" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleDimensions.map((col: ColumnMetadata) => (
                    <SelectItem key={col.name} value={col.name}>
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {col.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dimensionCol && (
                <p className="text-xs text-muted-foreground">
                  {dimensionCol.stats.distinctCount} valores únicos
                </p>
              )}
            </div>

            {/* Metric Selector */}
            <div className="space-y-2">
              <Label htmlFor="metric" className="flex items-center gap-2">
                Mostrar <span className="text-xs text-muted-foreground">(Métrica)</span>
              </Label>
              <Select value={config.metric || "count"} onValueChange={(value: string) => handleMetricChange(value === "count" ? null : value)}>
                <SelectTrigger id="metric">
                  <SelectValue placeholder="Selecione a métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Contagem de registros</SelectItem>
                  {compatibleMetrics.map((col: ColumnMetadata) => (
                    <SelectItem key={col.name} value={col.name}>
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {col.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {metricCol && (
                <p className="text-xs text-muted-foreground">
                  {metricCol.stats.avg !== undefined && `Média: ${metricCol.stats.avg.toFixed(2)}`}
                </p>
              )}
            </div>

            {/* Aggregation Selector */}
            <div className="space-y-2">
              <Label htmlFor="aggregation">Agregação</Label>
              <Select
                value={config.aggregation}
                onValueChange={(value: string) => handleAggregationChange(value as AggregationType)}
                disabled={!config.metric}
              >
                <SelectTrigger id="aggregation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AGGREGATION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!config.metric && (
                <p className="text-xs text-muted-foreground">Use "Contagem" quando não há métrica</p>
              )}
            </div>

            {/* Chart Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="chart-type">Tipo de Gráfico</Label>
              <Select
                value={config.chartType}
                onValueChange={(value: string) => handleChartTypeChange(value as ChartType)}
              >
                <SelectTrigger id="chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHART_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Natural Language Explanation */}
          {validation.valid && (
            <Alert className="mt-4 bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Explicação</AlertTitle>
              <AlertDescription className="text-foreground">{explanation.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Chart Display */}
      {validation.valid && chartData.length > 0 && (
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {config.metric ? `${config.metric} por ${config.dimension}` : `Contagem por ${config.dimension}`}
                </CardTitle>
                <CardDescription>
                  {explanation.text}
                </CardDescription>
              </div>
              <Badge variant="outline" className="shadow-sm">
                {CHART_TYPE_LABELS[config.chartType]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] bg-secondary/20 rounded-lg p-4">
              {config.chartType === "bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(0, 30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      stroke="#E5E7EB"
                      fontSize={12}
                      tick={{ fill: "#E5E7EB" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="#E5E7EB" fontSize={12} tick={{ fill: "#E5E7EB" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                      }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Legend wrapperStyle={{ color: "#E5E7EB" }} />
                    <Bar
                      dataKey="value"
                      fill={CHART_COLORS[0]}
                      name={config.metric ? `${AGGREGATION_LABELS[config.aggregation as AggregationType]} de ${config.metric}` : "Contagem"}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {config.chartType === "line" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(0, 50)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      stroke="#E5E7EB"
                      fontSize={12}
                      tick={{ fill: "#E5E7EB" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="#E5E7EB" fontSize={12} tick={{ fill: "#E5E7EB" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                      }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Legend wrapperStyle={{ color: "#E5E7EB" }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={CHART_COLORS[1]}
                      strokeWidth={3}
                      name={config.metric ? `${AGGREGATION_LABELS[config.aggregation as AggregationType]} de ${config.metric}` : "Contagem"}
                      dot={{ r: 4, fill: CHART_COLORS[1] }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {config.chartType === "area" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.slice(0, 50)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      stroke="#E5E7EB"
                      fontSize={12}
                      tick={{ fill: "#E5E7EB" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="#E5E7EB" fontSize={12} tick={{ fill: "#E5E7EB" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                      }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Legend wrapperStyle={{ color: "#E5E7EB" }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={CHART_COLORS[2]}
                      fill={CHART_COLORS[2]}
                      fillOpacity={0.4}
                      name={config.metric ? `${AGGREGATION_LABELS[config.aggregation as AggregationType]} de ${config.metric}` : "Contagem"}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {config.chartType === "pie" && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.slice(0, 10)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={140}
                      label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value.toFixed(1)}`}
                      labelStyle={{ fill: "#F9FAFB", fontSize: 12, fontWeight: 600 }}
                    >
                      {chartData.slice(0, 10).map((entry: { name: string; value: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#E5E7EB" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Summary */}
      {validation.valid && chartData.length > 0 && (
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Resumo dos Dados</CardTitle>
            <CardDescription>
              {chartData.length} {chartData.length === 1 ? "categoria" : "categorias"} • {data.length} {data.length === 1 ? "registro" : "registros"} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold text-foreground">{config.dimension}</th>
                      <th className="text-right p-3 font-semibold text-foreground">
                        {config.metric ? `${AGGREGATION_LABELS[config.aggregation as AggregationType]} de ${config.metric}` : "Contagem"}
                      </th>
                      <th className="text-right p-3 font-semibold text-foreground">Registros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item: { name: string; value: number; count: number }, index: number) => (
                      <tr key={index} className="border-b border-border hover:bg-accent/20 transition-colors">
                        <td className="p-3 font-medium text-foreground">{item.name}</td>
                        <td className="text-right p-3 text-foreground/90">
                          {typeof item.value === "number"
                            ? item.value.toLocaleString("pt-BR", {
                                minimumFractionDigits: config.aggregation === "avg" ? 2 : 0,
                                maximumFractionDigits: config.aggregation === "avg" ? 2 : 0,
                              })
                            : item.value}
                        </td>
                        <td className="text-right p-3 text-foreground/90">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
