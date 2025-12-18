"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Sparkles, BarChart3, Filter, Layers } from "lucide-react"
import { useState } from "react"

interface QuickGuideProps {
  onDismiss?: () => void
}

export default function QuickGuide({ onDismiss }: QuickGuideProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Guia Rápido</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Aprenda a criar visualizações em 3 passos simples
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Layers className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-semibold text-sm">1. Escolha uma Dimensão</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione uma coluna para agrupar os dados (ex: categoria, data, região)
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-semibold text-sm">2. Escolha uma Métrica</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione o que medir (ex: soma, média, contagem) ou use "Contagem de registros"
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Filter className="h-4 w-4 text-purple-600" />
              </div>
              <span className="font-semibold text-sm">3. Configure Agregação</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Escolha como agregar: soma, média, máximo, mínimo ou contagem
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-foreground">
            <strong>Dica:</strong> O sistema detecta automaticamente os tipos de dados e sugere combinações válidas. 
            Você verá explicações em linguagem natural para cada gráfico criado.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


