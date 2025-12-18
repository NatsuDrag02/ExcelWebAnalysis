"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ColumnMetadata, ViewColumn } from "@/lib/types"
import { generateViewExplanation } from "@/lib/view-engine"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import * as XLSX from "xlsx"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: Record<string, any>[]
  sheetName: string
  columns: ColumnMetadata[]
  viewColumns?: ViewColumn[]
}

export default function ExportDialog({
  open,
  onOpenChange,
  data,
  sheetName,
  columns,
  viewColumns = [],
}: ExportDialogProps) {
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx")
  const [isExporting, setIsExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    setExported(false)

    try {
      if (format === "xlsx") {
        exportToXLSX()
      } else {
        exportToCSV()
      }

      setExported(true)
      setTimeout(() => {
        setExported(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error("Erro na exportação:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    const fileName = viewColumns.length > 0
      ? `${sheetName}_view.xlsx`
      : `${sheetName}_filtered.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const fileName = viewColumns.length > 0
      ? `${sheetName}_view.csv`
      : `${sheetName}_filtered.csv`
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const displayColumns = viewColumns.length > 0
    ? viewColumns.map((vc) => columns.find((c) => c.name === vc.columnName)).filter(Boolean) as ColumnMetadata[]
    : columns

  const viewExplanation = viewColumns.length > 0
    ? generateViewExplanation(viewColumns, columns, data.length)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            {viewColumns.length > 0
              ? "Exporte sua visão personalizada para download. Selecione seu formato preferido abaixo."
              : "Exporte seus dados filtrados para download. Selecione seu formato preferido abaixo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {viewExplanation && (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground text-sm">{viewExplanation}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato de Exportação</Label>
            <RadioGroup value={format} onValueChange={(value: "xlsx" | "csv") => setFormat(value)}>
              <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Pasta de Trabalho do Excel (.xlsx)</div>
                      <div className="text-xs text-muted-foreground">Melhor para análise adicional no Excel</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-accent" />
                    <div>
                      <div className="font-medium">Arquivo CSV (.csv)</div>
                      <div className="text-xs text-muted-foreground">Formato universal para todos os aplicativos</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">Resumo da Exportação</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Registros:</div>
              <div className="font-medium">{data.length}</div>
              <div className="text-muted-foreground">Colunas:</div>
              <div className="font-medium">{displayColumns.length}</div>
              <div className="text-muted-foreground">Planilha:</div>
              <div className="font-medium">{sheetName}</div>
              {viewColumns.length > 0 && (
                <>
                  <div className="text-muted-foreground">Tipo:</div>
                  <div className="font-medium">Visão Personalizada</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting || exported}>
            {exported ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Exportado!
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exportando..." : "Exportar"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
