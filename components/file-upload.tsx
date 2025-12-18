"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseExcelFile } from "@/lib/excel-parser"
import type { WorkbookData } from "@/lib/types"

interface FileUploadProps {
  onDataLoaded: (data: WorkbookData) => void
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Por favor, carregue um arquivo Excel válido (.xlsx ou .xls)")
      setSuccessMessage(null)
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const data = await parseExcelFile(file)
      setSuccessMessage(
        `Arquivo carregado com sucesso! ${data.sheets.length} planilha${data.sheets.length !== 1 ? "s" : ""} detectada${data.sheets.length !== 1 ? "s" : ""}.`,
      )
      setTimeout(() => {
        onDataLoaded(data)
      }, 800)
    } catch (err) {
      setError("Falha ao analisar arquivo Excel. Por favor, certifique-se de que é uma planilha válida.")
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-3 border-dashed rounded-2xl p-16 text-center transition-all duration-300
          ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.02] shadow-lg"
              : "border-border/60 hover:border-primary/40 hover:bg-secondary/30"
          }
          ${isProcessing || successMessage ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
        onClick={() => !successMessage && fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <Sparkles className="h-6 w-6 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-xl font-semibold text-foreground">Processando seu arquivo...</p>
            <div className="space-y-1 text-sm text-muted-foreground text-center">
              <p>✓ Lendo planilhas do arquivo</p>
              <p>✓ Detectando colunas e cabeçalhos</p>
              <p>✓ Analisando tipos de dados automaticamente</p>
              <p>✓ Inferindo papéis (dimensão/métrica)</p>
              <p>✓ Calculando estatísticas</p>
            </div>
          </div>
        ) : successMessage ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <CheckCircle2 className="h-16 w-16 text-green-600 animate-in zoom-in duration-300" />
            </div>
            <p className="text-xl font-semibold text-green-600">{successMessage}</p>
            <p className="text-sm text-muted-foreground">Preparando visualização...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
              <FileSpreadsheet className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">Solte seu arquivo Excel aqui</p>
              <p className="text-muted-foreground">ou clique para navegar</p>
              <p className="text-sm text-muted-foreground">Suporta arquivos .xlsx e .xls com múltiplas planilhas</p>
            </div>
            <Button size="lg" className="mt-4 shadow-md hover:shadow-lg transition-shadow">
              <Upload className="mr-2 h-5 w-5" />
              Selecionar Arquivo
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/30 text-destructive animate-in slide-in-from-top duration-300">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}
