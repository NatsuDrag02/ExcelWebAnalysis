"use client"

import { useState, useEffect } from "react"
import { Upload, Database, Filter, BarChart3, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import FileUpload from "@/components/file-upload"
import DataDashboard from "@/components/data-dashboard"
import type { WorkbookData, FilterGroup } from "@/lib/types"

export default function Home() {
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null)
  const [initialFilters, setInitialFilters] = useState<FilterGroup[] | null>(null)
  const [initialSheet, setInitialSheet] = useState<number>(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const filtersParam = params.get("filters")
      const sheetParam = params.get("sheet")

      if (filtersParam) {
        try {
          const filters = JSON.parse(decodeURIComponent(filtersParam))
          setInitialFilters(filters)
        } catch (error) {
          console.error("Falha ao analisar filtros:", error)
        }
      }

      if (sheetParam) {
        const sheetIndex = Number.parseInt(sheetParam, 10)
        if (!isNaN(sheetIndex)) {
          setInitialSheet(sheetIndex)
        }
      }
    }
  }, [])

  const handleDataLoaded = (data: WorkbookData) => {
    setWorkbookData(data)
  }

  if (workbookData) {
    return (
      <DataDashboard
        workbookData={workbookData}
        onReset={() => setWorkbookData(null)}
        initialFilters={initialFilters}
        initialSheet={initialSheet}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="text-center mb-16 space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Database className="h-14 w-14 text-primary" />
                <Sparkles className="h-6 w-6 text-accent absolute -top-1 -right-1" />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-balance tracking-tight">
              Análise de Dados
              <span className="block text-primary mt-2">Simplificada</span>
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              Transforme suas planilhas Excel em insights poderosos com filtros inteligentes e visualizações interativas
            </p>
          </div>

          <Card className="w-full max-w-4xl p-10 bg-card shadow-xl border-2 border-border/50 hover:shadow-2xl transition-shadow duration-300">
            <FileUpload onDataLoaded={handleDataLoaded} />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full max-w-5xl">
            <Card className="p-8 bg-card border-2 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Carregar Arquivos</h3>
              <p className="text-muted-foreground leading-relaxed">
                Importe facilmente seus arquivos Excel com múltiplas planilhas e milhares de linhas
              </p>
            </Card>

            <Card className="p-8 bg-card border-2 border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg group">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Filter className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Filtros Inteligentes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Crie filtros complexos com interface visual e salve suas configurações favoritas
              </p>
            </Card>

            <Card className="p-8 bg-card border-2 border-border/50 hover:border-chart-3/30 transition-all duration-300 hover:shadow-lg group">
              <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-6 group-hover:bg-chart-3/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Visualizações</h3>
              <p className="text-muted-foreground leading-relaxed">
                Analise seus dados com gráficos interativos e dashboards personalizáveis
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
