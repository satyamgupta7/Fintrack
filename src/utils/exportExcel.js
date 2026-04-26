import * as XLSX from 'xlsx'

export function exportToExcel(data, filename = 'fintrack_export') {
  const wb = XLSX.utils.book_new()

  Object.entries(data).forEach(([sheetName, rows]) => {
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, sheetName.charAt(0).toUpperCase() + sheetName.slice(1))
  })

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportSheetToExcel(rows, sheetName) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${sheetName.toLowerCase()}_export.xlsx`)
}
