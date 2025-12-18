import * as XLSX from "xlsx"
import type { WorkbookData, SheetMetadata, ColumnMetadata } from "./types"

export async function parseExcelFile(file: File): Promise<WorkbookData> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true })

  const sheets: SheetMetadata[] = []

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: "yyyy-mm-dd",
      defval: null,
    })
    
    const jsonData = rawData.map((row: Record<string, any>) => {
      const normalizedRow: Record<string, any> = {}
    
      for (const key in row) {
        normalizedRow[key] = normalizeCellValue(row[key])
      }
    
      return normalizedRow
    })

    if (jsonData.length === 0) continue

    const columns = analyzeColumns(jsonData)

    sheets.push({
      name: sheetName,
      columns,
      rowCount: jsonData.length,
      data: jsonData,
    })
  }

  return {
    fileName: file.name,
    sheets,
  }
}
function normalizeCellValue(value: any): any {
  if (value == null) return null

  if (typeof value === "string") {
    const trimmed = value.trim()

    // Fórmulas não calculadas
    if (trimmed.startsWith("=")) {
      return null
    }

    // Erros comuns do Excel
    if (
      trimmed === "#DIV/0!" ||
      trimmed === "#N/A" ||
      trimmed === "#VALUE!" ||
      trimmed === "#REF!" ||
      trimmed === "#NAME?" ||
      trimmed === "#NUM!"
    ) {
      return null
    }
  }

  return value
}
function analyzeColumns(data: Record<string, any>[]): ColumnMetadata[] {
  if (data.length === 0) return []

  const columnNames = Object.keys(data[0])
  const columns: ColumnMetadata[] = []
  const totalRows = data.length

  for (const columnName of columnNames) {
    const allValues = data.map((row) => row[columnName])
    const values = allValues.filter((v) => v != null && v !== "")
    const nullCount = totalRows - values.length

    if (values.length === 0) {
      columns.push({
        name: columnName,
        type: "text",
        possibleRoles: ["dimension"],
        stats: {
          distinctCount: 0,
          nullCount,
        },
      })
      continue
    }

    const type = detectColumnType(values)
    const uniqueValues = [...new Set(values)]
    const distinctCount = uniqueValues.length

    // Infer possible roles based on type and cardinality
    const possibleRoles: ColumnRole[] = []
    
    // Dimensions: text, date, boolean, or low-cardinality numeric
    if (type === "text" || type === "date" || type === "boolean") {
      possibleRoles.push("dimension")
    } else if (type === "number" || type === "currency") {
      // Low cardinality numeric can be dimension (e.g., year, category ID)
      if (distinctCount <= 20 && distinctCount < totalRows * 0.1) {
        possibleRoles.push("dimension")
      }
    }

    // Metrics: numeric or currency (can also be dimension if low cardinality)
    if (type === "number" || type === "currency") {
      possibleRoles.push("metric")
      // If it can be both, mark as "both"
      if (possibleRoles.includes("dimension")) {
        possibleRoles[0] = "both"
      }
    }

    // Default to dimension if no role assigned
    if (possibleRoles.length === 0) {
      possibleRoles.push("dimension")
    }

    const stats: ColumnStats = {
      distinctCount,
      nullCount,
    }

    // Calculate numeric statistics
    if (type === "number" || type === "currency") {
      const numericValues = values.map((v) => {
        const str = String(v).replace(/[,$€£¥₹]/g, "").replace(/,/g, "")
        return Number.parseFloat(str)
      }).filter((v) => !isNaN(v) && isFinite(v))
      
      if (numericValues.length > 0) {
        stats.min = Math.min(...numericValues)
        stats.max = Math.max(...numericValues)
        stats.avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      }
    }

    // Calculate date statistics
    if (type === "date") {
      const dates = values.map((v) => new Date(v)).filter((d) => !isNaN(d.getTime()))
      if (dates.length > 0) {
        stats.minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
        stats.maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
      }
    }

    const metadata: ColumnMetadata = {
      name: columnName,
      type,
      possibleRoles,
      stats,
    }

    // Store unique values for categorical data (useful for filters and dimensions)
    if ((type === "text" || type === "boolean") && distinctCount <= 100) {
      metadata.uniqueValues = uniqueValues as (string | number | boolean)[]
    } else if ((type === "number" || type === "currency") && distinctCount <= 50) {
      // Store unique values for low-cardinality numeric dimensions
      metadata.uniqueValues = uniqueValues as (string | number | boolean)[]
    }

    // Legacy fields for backward compatibility
    if (stats.min !== undefined) {
      metadata.min = stats.min
      metadata.max = stats.max
    }
    if (stats.minDate) {
      metadata.minDate = stats.minDate
      metadata.maxDate = stats.maxDate
    }

    columns.push(metadata)
  }

  return columns
}

function detectColumnType(values: any[]): ColumnMetadata["type"] {
  if (values.length === 0) return "text"

  const sample = values.slice(0, Math.min(200, values.length))
  const total = sample.length

  let numberCount = 0
  let dateCount = 0
  let booleanCount = 0
  let currencyCount = 0
  let emptyCount = 0

  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY ou MM/DD/YYYY
    /^\d{2}\/\d{2}\/\d{2}$/, // DD/MM/YY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  ]

  // Common currency symbols and patterns
  const currencyPatterns = [
    /^[$€£¥₹R$]\s*[\d.,]+/, // Currency symbol at start
    /[\d.,]+\s*[$€£¥₹R$]/, // Currency symbol at end
    /R\$\s*[\d.,]+/, // Brazilian Real
  ]

  for (const value of sample) {
    if (value == null || value === "" || String(value).trim() === "") {
      emptyCount++
      continue
    }

    const str = String(value).trim()
    const hasLetters = /[a-zA-Z]/.test(str)

    // Check for boolean (more strict)
    const lowerStr = str.toLowerCase()
    if (
      lowerStr === "true" ||
      lowerStr === "false" ||
      lowerStr === "sim" ||
      lowerStr === "não" ||
      lowerStr === "yes" ||
      lowerStr === "no" ||
      lowerStr === "1" ||
      lowerStr === "0" ||
      lowerStr === "s" ||
      lowerStr === "n"
    ) {
      booleanCount++
      continue
    }

    // Check for currency (more comprehensive e conservador)
    const isCurrency =
      !hasLetters &&
      (currencyPatterns.some((pattern) => pattern.test(str)) ||
        /^[\d.,]+\s*(reais?|dollars?|euros?|pounds?)$/i.test(str))
    
    if (isCurrency) {
      currencyCount++
      continue
    }

    // Check for date (mais conservador para não confundir códigos/nomes)
    let isDate = false
    
    if (!hasLetters) {
      // Primeiro tenta casar exatamente com padrões conhecidos
      if (datePatterns.some((pattern) => pattern.test(str))) {
        isDate = true
      } else if (/^[\d\s\/:\-T]+$/.test(str)) {
        // Fallback: apenas caracteres típicos de data
        const dateValue = new Date(str)
        if (!isNaN(dateValue.getTime())) {
          const year = dateValue.getFullYear()
          if (year >= 1900 && year <= 2100) {
            isDate = true
          }
        }
      }
    }

    if (isDate) {
      dateCount++
      continue
    }

    // Check for number (more strict)
    // Remove common formatting characters
    const cleanedStr = str.replace(/[,\s]/g, "")
    const numValue = Number.parseFloat(cleanedStr)
    
    if (!isNaN(numValue) && isFinite(numValue)) {
      // Additional validation: check if the string representation matches
      const numStr = numValue.toString()
      const cleanedNumStr = cleanedStr.replace(/^-/, "").replace(/\.\d+$/, "")
      
      // Allow for decimal points and negative signs
      if (/^-?\d+\.?\d*$/.test(cleanedStr) || cleanedNumStr === cleanedStr.replace(/\.\d+$/, "")) {
        numberCount++
        continue
      }
    }
  }

  const validCount = total - emptyCount
  if (validCount === 0) return "text"

  // Calculate percentages based on valid (non-empty) values
  const booleanRatio = booleanCount / validCount
  const currencyRatio = currencyCount / validCount
  const numberRatio = numberCount / validCount
  const dateRatio = dateCount / validCount

  // Use thresholds with priority order (datas exigem mais confiança)
  if (booleanRatio > 0.85) return "boolean"
  if (currencyRatio > 0.7) return "currency"
  if (dateRatio > 0.85) return "date"
  if (numberRatio > 0.7) return "number"

  return "text"
}
