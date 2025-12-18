"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { FilterGroup } from "@/lib/types"
import { saveFilter } from "@/lib/filter-storage"

interface SaveFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filterGroups: FilterGroup[]
  sheetName: string
}

export default function SaveFilterDialog({ open, onOpenChange, filterGroups, sheetName }: SaveFilterDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    if (!name.trim()) {
      alert("Por favor, insira um nome para o filtro")
      return
    }

    setSaving(true)
    try {
      saveFilter(name, description, filterGroups, sheetName)
      setName("")
      setDescription("")
      onOpenChange(false)
      alert("Filtro salvo com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar filtro:", error)
      alert("Erro ao salvar filtro. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Configuração de Filtro</DialogTitle>
          <DialogDescription>
            Salve esta configuração para reutilizar depois. {filterGroups.length} grupo
            {filterGroups.length !== 1 ? "s" : ""} de filtro{filterGroups.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filter-name">Nome do Filtro *</Label>
            <Input
              id="filter-name"
              placeholder="Ex: Vendas Acima de R$ 1000"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-description">Descrição (opcional)</Label>
            <Textarea
              id="filter-description"
              placeholder="Descreva o propósito deste filtro..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>Planilha:</strong> {sheetName}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Filtro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
