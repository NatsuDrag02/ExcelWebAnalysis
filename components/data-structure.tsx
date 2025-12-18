"use client"

import { ChevronRight, Table, Columns } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { SheetMetadata } from "@/lib/types"

interface DataStructureProps {
  sheets: SheetMetadata[]
  selectedSheet: number
  onSelectSheet: (index: number) => void
}

export default function DataStructure({ sheets, selectedSheet, onSelectSheet }: DataStructureProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Estrutura de Dados</h2>
        <div className="space-y-3">
          {sheets.map((sheet, index) => (
            <Card
              key={index}
              className={`
                p-4 cursor-pointer transition-all duration-200 border-2
                ${
                  selectedSheet === index
                    ? "bg-primary/10 border-primary shadow-md scale-[1.02]"
                    : "bg-card hover:bg-secondary/50 border-border/60 hover:border-primary/30 hover:shadow-sm"
                }
              `}
              onClick={() => onSelectSheet(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedSheet === index ? "bg-primary/20" : "bg-primary/10"}`}>
                    <Table className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">{sheet.name}</span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${selectedSheet === index ? "rotate-90" : ""}`}
                />
              </div>

              {selectedSheet === index && (
                <div className="mt-4 space-y-3 pl-2 animate-in fade-in duration-200">
                  <div className="text-xs text-muted-foreground font-medium">
                    {sheet.rowCount} linhas • {sheet.columns.length} colunas
                  </div>
                  <div className="space-y-2">
                    {sheet.columns.slice(0, 5).map((col, colIndex) => (
                      <div key={colIndex} className="flex items-center gap-2 text-xs bg-secondary/30 p-2 rounded-lg">
                        <Columns className="h-3 w-3 text-accent" />
                        <span className="text-foreground truncate font-medium flex-1">{col.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-[10px] bg-muted px-2 py-0.5 rounded-full">
                            {col.type}
                          </span>
                          {col.possibleRoles.includes("dimension") && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded" title="Pode ser usado como dimensão">
                              D
                            </span>
                          )}
                          {col.possibleRoles.includes("metric") && (
                            <span className="text-[10px] bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded" title="Pode ser usado como métrica">
                              M
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {sheet.columns.length > 5 && (
                      <div className="text-xs text-muted-foreground pl-2 font-medium">
                        +{sheet.columns.length - 5} colunas adicionais
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
