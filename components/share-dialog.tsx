"use client"

import { useState, useEffect } from "react"
import { Share2, Copy, Check, LinkIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FilterGroup } from "@/lib/types"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filterGroups: FilterGroup[]
  sheetIndex: number
}

export default function ShareDialog({ open, onOpenChange, filterGroups, sheetIndex }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      generateShareUrl()
    }
  }, [open, filterGroups, sheetIndex])

  const generateShareUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const params = new URLSearchParams()

    if (sheetIndex > 0) {
      params.set("sheet", sheetIndex.toString())
    }

    if (filterGroups.length > 0) {
      const filtersEncoded = encodeURIComponent(JSON.stringify(filterGroups))
      params.set("filters", filtersEncoded)
    }

    const queryString = params.toString()
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

    setShareUrl(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Falha ao copiar:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartilhar Visualização</DialogTitle>
          <DialogDescription>
            Compartilhe esta visualização com outras pessoas. O link inclui sua seleção de planilha atual e filtros
            ativos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Link Compartilhável</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={shareUrl} readOnly className="pl-10 font-mono text-xs bg-muted" />
              </div>
              <Button onClick={handleCopy} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">Incluído no Link</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Seleção de planilha atual
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {filterGroups.length > 0 ? `${filterGroups.length} grupo(s) de filtro ativo(s)` : "Nenhum filtro ativo"}
              </li>
            </ul>
          </div>

          <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="flex gap-3">
              <Share2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-accent-foreground mb-1">Nota</p>
                <p className="text-muted-foreground">
                  Os destinatários precisarão carregar o mesmo arquivo Excel para visualizar os dados filtrados. Este
                  link compartilha apenas sua configuração de filtros.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Concluído</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
