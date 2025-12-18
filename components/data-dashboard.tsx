"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, Download, Share2, Filter, BarChart3, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { WorkbookData, FilterGroup, ViewColumn } from "@/lib/types"
import DataStructure from "./data-structure"
import DataTable from "./data-table"
import FilterPanel from "./filter-panel"
import ExportDialog from "./export-dialog"
import ShareDialog from "./share-dialog"
import SaveFilterDialog from "./save-filter-dialog"
import SavedFiltersDialog from "./saved-filters-dialog"
import DataVisualization from "./data-visualization"
import ViewBuilder from "./view-builder"
import { applyFilters } from "@/lib/filter-engine"
import { applyView } from "@/lib/view-engine"
import ActiveFiltersBar from "./active-filters-bar"

interface DataDashboardProps {
  workbookData: WorkbookData
  onReset: () => void
  initialFilters?: FilterGroup[] | null
  initialSheet?: number
}

export default function DataDashboard({ workbookData, onReset, initialFilters, initialSheet = 0 }: DataDashboardProps) {
  const [selectedSheet, setSelectedSheet] = useState(initialSheet)
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(initialFilters || [])
  const [viewColumns, setViewColumns] = useState<ViewColumn[]>([])
  const [showFilters, setShowFilters] = useState(true)
  const [showView, setShowView] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showSaveFilterDialog, setShowSaveFilterDialog] = useState(false)
  const [showSavedFiltersDialog, setShowSavedFiltersDialog] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "charts">("table")

  useEffect(() => {
    if (initialFilters && initialFilters.length > 0) {
      setFilterGroups(initialFilters)
      setShowFilters(true)
    }
  }, [initialFilters])

  useEffect(() => {
    if (initialSheet !== undefined && initialSheet < workbookData.sheets.length) {
      setSelectedSheet(initialSheet)
    }
  }, [initialSheet, workbookData.sheets.length])

  const currentSheet = workbookData.sheets[selectedSheet]
  
  // Apply filters first
  const filteredData = applyFilters(currentSheet.data, filterGroups, currentSheet.columns)
  
  // Apply view if columns are selected
  const viewData = useMemo(() => {
    if (viewColumns.length === 0) {
      return filteredData
    }
    return applyView(filteredData, viewColumns, currentSheet.columns)
  }, [filteredData, viewColumns, currentSheet.columns])
  
  // Reset view when sheet changes
  useEffect(() => {
    setViewColumns([])
  }, [selectedSheet])

  const handleLoadFilter = (loadedFilterGroups: FilterGroup[]) => {
    setFilterGroups(loadedFilterGroups)
    setShowFilters(true)
  }

  const handleRemoveFilter = (groupId: string, ruleId: string) => {
    setFilterGroups(
      filterGroups
        .map((group) =>
          group.id === groupId
            ? {
                ...group,
                rules: group.rules.filter((rule) => rule.id !== ruleId),
              }
            : group,
        )
        .filter((group) => group.rules.length > 0),
    )
  }

  const handleClearAllFilters = () => {
    setFilterGroups([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/5">
      <header className="border-b border-border/60 bg-card/95 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onReset} className="hover:bg-secondary">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="border-l border-border/60 pl-4">
                <h1 className="text-xl font-bold text-foreground">{workbookData.fileName}</h1>
                <p className="text-sm text-muted-foreground">
                  {workbookData.sheets.length} planilha{workbookData.sheets.length !== 1 ? "s" : ""} carregada
                  {workbookData.sheets.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showView ? "default" : "outline"}
                size="sm"
                onClick={() => setShowView(!showView)}
                className="shadow-sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visão {viewColumns.length > 0 && `(${viewColumns.length})`}
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="shadow-sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros {filterGroups.length > 0 && `(${filterGroups.length})`}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)} className="shadow-sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        <aside className="w-80 border-r border-border/60 bg-sidebar/50 backdrop-blur-sm min-h-[calc(100vh-89px)] overflow-y-auto">
          <div className="p-6">
            <DataStructure
              sheets={workbookData.sheets}
              selectedSheet={selectedSheet}
              onSelectSheet={setSelectedSheet}
            />
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col min-h-[calc(100vh-89px)]">
          {showView && (
            <div className="border-b border-border/60 bg-card/80 backdrop-blur-sm shadow-sm">
              <div className="p-4">
                <ViewBuilder
                  columns={currentSheet.columns}
                  selectedColumns={viewColumns}
                  onColumnsChange={setViewColumns}
                />
              </div>
            </div>
          )}
          {showFilters && (
            <div className="border-b border-border/60 bg-card/80 backdrop-blur-sm shadow-sm">
              <FilterPanel
                sheet={currentSheet}
                filterGroups={filterGroups}
                onFilterGroupsChange={setFilterGroups}
                onSaveFilter={() => setShowSaveFilterDialog(true)}
                onLoadFilter={() => setShowSavedFiltersDialog(true)}
              />
            </div>
          )}

          <div className="flex-1 overflow-auto">
            <div className="p-8 space-y-6">
              <ActiveFiltersBar
                filterGroups={filterGroups}
                columns={currentSheet.columns}
                totalRows={currentSheet.data.length}
                filteredRows={filteredData.length}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
              />

              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "charts")} className="w-full">
                <TabsList className="mb-6 bg-secondary/50 p-1 shadow-sm">
                  <TabsTrigger value="table" className="data-[state=active]:bg-card data-[state=active]:shadow-md">
                    Tabela de Dados
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="data-[state=active]:bg-card data-[state=active]:shadow-md">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Visualizações
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                  <DataTable
                    sheet={currentSheet}
                    filterGroups={filterGroups}
                    viewColumns={viewColumns}
                    viewData={viewData}
                  />
                </TabsContent>

                <TabsContent value="charts">
                  <DataVisualization data={viewData} columns={currentSheet.columns} sheetName={currentSheet.name} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        data={viewData}
        sheetName={currentSheet.name}
        columns={currentSheet.columns}
        viewColumns={viewColumns}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        filterGroups={filterGroups}
        sheetIndex={selectedSheet}
      />

      <SaveFilterDialog
        open={showSaveFilterDialog}
        onOpenChange={setShowSaveFilterDialog}
        filterGroups={filterGroups}
        sheetName={currentSheet.name}
      />

      <SavedFiltersDialog
        open={showSavedFiltersDialog}
        onOpenChange={setShowSavedFiltersDialog}
        currentSheetName={currentSheet.name}
        onLoadFilter={handleLoadFilter}
      />
    </div>
  )
}
