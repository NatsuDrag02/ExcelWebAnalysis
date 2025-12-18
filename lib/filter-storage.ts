import type { SavedFilter, FilterGroup } from "./types"

const STORAGE_KEY = "bi_saved_filters"

export function getSavedFilters(): SavedFilter[] {
  if (typeof window === "undefined") return []

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []

    const filters = JSON.parse(saved)
    return filters.map((f: any) => ({
      ...f,
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    }))
  } catch (error) {
    console.error("Erro ao carregar filtros salvos:", error)
    return []
  }
}

export function saveFilter(
  name: string,
  description: string,
  filterGroups: FilterGroup[],
  sheetName: string,
): SavedFilter {
  const filters = getSavedFilters()

  const newFilter: SavedFilter = {
    id: crypto.randomUUID(),
    name,
    description,
    filterGroups: JSON.parse(JSON.stringify(filterGroups)), // Deep clone
    sheetName,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  filters.push(newFilter)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))

  return newFilter
}

export function updateFilter(id: string, updates: Partial<SavedFilter>): void {
  const filters = getSavedFilters()
  const index = filters.findIndex((f) => f.id === id)

  if (index !== -1) {
    filters[index] = {
      ...filters[index],
      ...updates,
      updatedAt: new Date(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }
}

export function deleteFilter(id: string): void {
  const filters = getSavedFilters()
  const filtered = filters.filter((f) => f.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function getFiltersBySheet(sheetName: string): SavedFilter[] {
  const filters = getSavedFilters()
  return filters.filter((f) => f.sheetName === sheetName)
}
