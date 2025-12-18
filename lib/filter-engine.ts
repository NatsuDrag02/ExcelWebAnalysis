import type { FilterGroup, FilterRule, ColumnMetadata } from "./types"

export function applyFilters(
  data: Record<string, any>[],
  filterGroups: FilterGroup[],
  columns?: ColumnMetadata[],
): Record<string, any>[] {
  if (filterGroups.length === 0) return data

  return data.filter((row) => {
    // All filter groups are combined with OR logic
    return filterGroups.every((group) => evaluateFilterGroup(row, group, columns))
  })
}

function evaluateFilterGroup(
  row: Record<string, any>,
  group: FilterGroup,
  columns?: ColumnMetadata[],
): boolean {
  if (group.rules.length === 0) return true

  if (group.logic === "AND") {
    return group.rules.every((rule) => evaluateRule(row, rule, columns))
  } else {
    return group.rules.some((rule) => evaluateRule(row, rule, columns))
  }
}

/**
 * Converts a value to a Date object, handling various date formats
 */
function parseDate(value: any): Date | null {
  if (!value) return null

  // If it's already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  const str = String(value).trim()

  // Try parsing as ISO date (yyyy-mm-dd)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const date = new Date(str)
    if (!isNaN(date.getTime())) return date
  }

  // Try parsing as other common formats
  const date = new Date(str)
  if (!isNaN(date.getTime())) {
    // Validate that it's a reasonable date
    const year = date.getFullYear()
    if (year >= 1900 && year <= 2100) {
      return date
    }
  }

  return null
}

/**
 * Checks if a value looks like a date
 */
function isDateValue(value: any, filterValue: any): boolean {
  const cellDate = parseDate(value)
  const filterDate = parseDate(filterValue)

  // If both can be parsed as dates, treat as date comparison
  return cellDate !== null && filterDate !== null
}

function evaluateRule(
  row: Record<string, any>,
  rule: FilterRule,
  columns?: ColumnMetadata[],
): boolean {
  const cellValue = row[rule.columnName]

  // Don't filter out empty values for "notEquals" operator
  if ((cellValue == null || cellValue === "") && rule.operator !== "notEquals") {
    return false
  }

  // If filter value is empty and operator is not "notEquals", return false
  if ((rule.value == null || rule.value === "") && rule.operator !== "notEquals") {
    return false
  }

  // Get column type if available
  const column = columns?.find((c) => c.name === rule.columnName)
  const isDateColumn = column?.type === "date"

  // Handle date comparisons
  if (isDateColumn || isDateValue(cellValue, rule.value)) {
    const cellDate = parseDate(cellValue)
    const filterDate = parseDate(rule.value)

    if (!cellDate || !filterDate) {
      // Fallback to string comparison if dates can't be parsed
      return String(cellValue).toLowerCase() === String(rule.value).toLowerCase()
    }

    switch (rule.operator) {
      case "equals":
        return cellDate.getTime() === filterDate.getTime()

      case "notEquals":
        return cellDate.getTime() !== filterDate.getTime()

      case "greaterThan":
        return cellDate.getTime() > filterDate.getTime()

      case "lessThan":
        return cellDate.getTime() < filterDate.getTime()

      case "between": {
        const filterDate2 = parseDate(rule.value2)
        if (!filterDate2) return false
        const time = cellDate.getTime()
        const time1 = filterDate.getTime()
        const time2 = filterDate2.getTime()
        const minTime = Math.min(time1, time2)
        const maxTime = Math.max(time1, time2)
        return time >= minTime && time <= maxTime
      }

      default:
        return true
    }
  }

  // Handle non-date comparisons
  switch (rule.operator) {
    case "equals":
      return String(cellValue).toLowerCase() === String(rule.value).toLowerCase()

    case "notEquals":
      return String(cellValue).toLowerCase() !== String(rule.value).toLowerCase()

    case "contains":
      return String(cellValue).toLowerCase().includes(String(rule.value).toLowerCase())

    case "notContains":
      return !String(cellValue).toLowerCase().includes(String(rule.value).toLowerCase())

    case "greaterThan": {
      const numValue = Number.parseFloat(String(cellValue).replace(/[^0-9.-]/g, ""))
      const filterValue = Number.parseFloat(String(rule.value).replace(/[^0-9.-]/g, ""))
      if (isNaN(numValue) || isNaN(filterValue)) return false
      return numValue > filterValue
    }

    case "lessThan": {
      const numValue = Number.parseFloat(String(cellValue).replace(/[^0-9.-]/g, ""))
      const filterValue = Number.parseFloat(String(rule.value).replace(/[^0-9.-]/g, ""))
      if (isNaN(numValue) || isNaN(filterValue)) return false
      return numValue < filterValue
    }

    case "between": {
      const numValue = Number.parseFloat(String(cellValue).replace(/[^0-9.-]/g, ""))
      const filterValue1 = Number.parseFloat(String(rule.value).replace(/[^0-9.-]/g, ""))
      const filterValue2 = Number.parseFloat(String(rule.value2 || "").replace(/[^0-9.-]/g, ""))
      if (isNaN(numValue) || isNaN(filterValue1) || isNaN(filterValue2)) return false
      return numValue >= filterValue1 && numValue <= filterValue2
    }

    case "in": {
      if (!Array.isArray(rule.value)) return false
      return rule.value.some((v) => String(cellValue).toLowerCase() === String(v).toLowerCase())
    }

    default:
      return true
  }
}
