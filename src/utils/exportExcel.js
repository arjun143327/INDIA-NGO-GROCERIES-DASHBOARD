import * as XLSX from 'xlsx'

/**
 * Converts an array of objects to an Excel file and triggers a download.
 * @param {Array} dataArray - The raw data array (e.g., filtered items or logs).
 * @param {string} sheetName - The name of the Excel sheet.
 * @param {string} fileName - The downloaded file name (without extension).
 * @param {object} [metadata] - Optional metadata { title: string, subtitle: string }
 */
export function downloadExcel(dataArray, sheetName, fileName, metadata = null) {
  if (!dataArray || dataArray.length === 0) return

  let worksheet
  if (metadata) {
    // Start data at row 4
    worksheet = XLSX.utils.json_to_sheet(dataArray, { origin: 'A4' })
    // Add headers
    XLSX.utils.sheet_add_aoa(worksheet, [
      [metadata.title || 'Export Report'],
      [metadata.subtitle || `Generated on: ${new Date().toLocaleString()}`],
      []
    ], { origin: 'A1' })
  } else {
    worksheet = XLSX.utils.json_to_sheet(dataArray)
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Create timestamp string like YYYYMMDD_HHMMSS
  const now = new Date()
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  
  XLSX.writeFile(workbook, `${fileName}_${ts}.xlsx`)
}

/**
 * Converts multiple arrays of objects to a multi-sheet Excel file.
 * @param {Array<{data: Array, sheetName: string}>} sheetsData - Array of sheet definitions.
 * @param {string} fileName - The downloaded file name (without extension).
 */
export function downloadMultiSheetExcel(sheetsData, fileName, metadata = null) {
  if (!sheetsData || sheetsData.length === 0) return

  const workbook = XLSX.utils.book_new()
  
  sheetsData.forEach(({ data, sheetName }) => {
    if (data && data.length > 0) {
      let worksheet
      if (metadata) {
        worksheet = XLSX.utils.json_to_sheet(data, { origin: 'A4' })
        XLSX.utils.sheet_add_aoa(worksheet, [
          [metadata.title || 'Export Report'],
          [metadata.subtitle || `Generated on: ${new Date().toLocaleString()}`],
          []
        ], { origin: 'A1' })
      } else {
        worksheet = XLSX.utils.json_to_sheet(data)
      }
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    }
  })

  // Create timestamp string
  const now = new Date()
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)

  XLSX.writeFile(workbook, `${fileName}_${ts}.xlsx`)
}
