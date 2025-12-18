"use client"

import { useState, useEffect } from "react"
import { Bookmark, Trash2, Calendar, Edit2, Check, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SavedFilter, FilterGroup } from "@/lib/types"
import { getSavedFilters, deleteFilter, updateFilter } from "@/lib/filter-storage"

interface SavedFiltersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSheetName: string
  onLoadFilter: (filterGroups: FilterGroup[]) => void
}

export default function SavedFiltersDialog({
  open,
  onOpenChange,
  currentSheetName,
  onLoadFilter,
}: SavedFiltersDialogProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  useEffect(() => {
    if (open) {
      loadFilters()
    }
  }, [open])

  const loadFilters = () => {
    const filters = getSavedFilters()
    setSavedFilters(filters)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este filtro salvo?")) {
      deleteFilter(id)
      loadFilters()
    }
  }

  const handleEdit = (filter: SavedFilter) => {
    setEditingId(filter.id)
    setEditName(filter.name)
    setEditDescription(filter.description || "")
  }

  const handleSaveEdit = (id: string) => {
    updateFilter(id, {
      name: editName,
      description: editDescription,
    })
    setEditingId(null)
    loadFilters()
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditDescription("")
  }

  const handleLoad = (filter: SavedFilter) => {
    onLoadFilter(filter.filterGroups)
    onOpenChange(false)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const sheetFilters = savedFilters.filter((f) => f.sheetName === currentSheetName)
  const otherFilters = savedFilters.filter((f) => f.sheetName !== currentSheetName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros Salvos</DialogTitle>
          <DialogDescription>
            Carregue, edite ou exclua seus filtros salvos. Total: {savedFilters.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {sheetFilters.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Filtros para "{currentSheetName}"
              </h3>
              <div className="space-y-3">
                {sheetFilters.map((filter) => (
                  <FilterCard
                    key={filter.id}
                    filter={filter}
                    isEditing={editingId === filter.id}
                    editName={editName}
                    editDescription={editDescription}
                    onEditName={setEditName}
                    onEditDescription={setEditDescription}
                    onEdit={() => handleEdit(filter)}
                    onSaveEdit={() => handleSaveEdit(filter.id)}
                    onCancelEdit={handleCancelEdit}
                    onDelete={() => handleDelete(filter.id)}
                    onLoad={() => handleLoad(filter)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {otherFilters.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Outras Planilhas</h3>
              <div className="space-y-3">
                {otherFilters.map((filter) => (
                  <FilterCard
                    key={filter.id}
                    filter={filter}
                    isEditing={editingId === filter.id}
                    editName={editName}
                    editDescription={editDescription}
                    onEditName={setEditName}
                    onEditDescription={setEditDescription}
                    onEdit={() => handleEdit(filter)}
                    onSaveEdit={() => handleSaveEdit(filter.id)}
                    onCancelEdit={handleCancelEdit}
                    onDelete={() => handleDelete(filter.id)}
                    onLoad={() => handleLoad(filter)}
                    formatDate={formatDate}
                    disabled
                  />
                ))}
              </div>
            </div>
          )}

          {savedFilters.length === 0 && (
            <Card className="p-8 text-center border-dashed border-2">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Nenhum filtro salvo ainda</p>
              <p className="text-xs text-muted-foreground">
                Use o botão "Salvar Filtro" no painel de filtros para guardar suas configurações
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface FilterCardProps {
  filter: SavedFilter
  isEditing: boolean
  editName: string
  editDescription: string
  onEditName: (name: string) => void
  onEditDescription: (description: string) => void
  onEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onLoad: () => void
  formatDate: (date: Date) => string
  disabled?: boolean
}

function FilterCard({
  filter,
  isEditing,
  editName,
  editDescription,
  onEditName,
  onEditDescription,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onLoad,
  formatDate,
  disabled = false,
}: FilterCardProps) {
  return (
    <Card className={`p-4 ${disabled ? "opacity-60" : ""}`}>
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={editName}
            onChange={(e) => onEditName(e.target.value)}
            placeholder="Nome do filtro"
            className="font-semibold"
          />
          <Textarea
            value={editDescription}
            onChange={(e) => onEditDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSaveEdit}>
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{filter.name}</h4>
              {filter.description && <p className="text-xs text-muted-foreground mb-2">{filter.description}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {filter.sheetName}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {filter.filterGroups.length} grupo{filter.filterGroups.length !== 1 ? "s" : ""}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(filter.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onLoad} disabled={disabled}>
              Carregar
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
