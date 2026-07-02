import * as XLSX from 'xlsx-js-style'

function applyStylesToWorksheet(worksheet, hasMetadata) {
  if (!worksheet['!ref']) return
  
  const range = XLSX.utils.decode_range(worksheet['!ref'])
  const headerRowIndex = hasMetadata ? 3 : 0 // 0-indexed row for column headers (A4 = row index 3)
  
  const colWidths = []

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = {c: C, r: R}
      const cellRef = XLSX.utils.encode_cell(cellAddress)
      const cell = worksheet[cellRef]

      if (!cell) continue

      const cellTextLength = cell.v ? String(cell.v).length : 0
      colWidths[C] = Math.max(colWidths[C] || 10, cellTextLength + 2)

      if (!cell.s) cell.s = {}

      if (hasMetadata && R === 0 && C === 0) {
        // Title
        cell.s = { font: { bold: true, sz: 14, color: { rgb: "1F2937" } } }
      } else if (hasMetadata && R === 1 && C === 0) {
        // Subtitle
        cell.s = { font: { italic: true, sz: 11, color: { rgb: "6B7280" } } }
      } else if (R === headerRowIndex) {
        // Table Headers
        cell.s = {
          fill: { fgColor: { rgb: "1A6B3C" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { vertical: "center" }
        }
      } else if (R > headerRowIndex) {
        // Data cells styling
        let bgColor = (R - headerRowIndex) % 2 === 0 ? "F9FAFB" : "FFFFFF"
        let fontColor = "111827"
        let isBold = false

        // Check if this row is a TOTAL row
        const firstCellRef = XLSX.utils.encode_cell({c: 0, r: R})
        const firstCell = worksheet[firstCellRef]
        const isTotalRow = firstCell && firstCell.v && String(firstCell.v).toUpperCase().includes('TOTAL')

        if (isTotalRow) {
          bgColor = "E5E7EB"
          isBold = true
        }

        const val = String(cell.v).toUpperCase()
        if (val === 'CRITICAL') {
          bgColor = "FEE2E2"; fontColor = "DC2626"; isBold = true
        } else if (val === 'LOW' || val === 'LOW STOCK') {
          bgColor = "FEF3C7"; fontColor = "D97706"; isBold = true
        } else if (val === 'OK' || val === 'HEALTHY (OK)') {
          bgColor = "DCFCE7"; fontColor = "16A34A"; isBold = true
        } else if (val === 'INCOMING STOCK') {
          bgColor = "DBEAFE"; fontColor = "2563EB"; isBold = true
        } else if (val === 'DAILY USAGE') {
          bgColor = "F3F4F6"; fontColor = "4B5563"; isBold = true
        }

        cell.s = { fill: { fgColor: { rgb: bgColor } }, font: { color: { rgb: fontColor }, bold: isBold } }
      }
    }
  }

  worksheet['!cols'] = colWidths.map(w => ({ wch: Math.min(w, 50) }))
}

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

  applyStylesToWorksheet(worksheet, !!metadata)

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
    // Ensure we always have at least one row so the sheet is created
    const sheetData = data && data.length > 0 ? data : [{ 'No Data': 'No records found for this period' }]
    
    let worksheet
    if (metadata) {
      worksheet = XLSX.utils.json_to_sheet(sheetData, { origin: 'A4' })
      XLSX.utils.sheet_add_aoa(worksheet, [
        [metadata.title || 'Export Report'],
        [metadata.subtitle || `Generated on: ${new Date().toLocaleString()}`],
        []
      ], { origin: 'A1' })
    } else {
      worksheet = XLSX.utils.json_to_sheet(sheetData)
    }
    
    applyStylesToWorksheet(worksheet, !!metadata)
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  // Create timestamp string
  const now = new Date()
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)

  XLSX.writeFile(workbook, `${fileName}_${ts}.xlsx`)
}
