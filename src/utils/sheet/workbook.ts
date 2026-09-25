import readExcelFile from "read-excel-file/browser";

export type SheetRow = Record<string, unknown>;
export type Workbook = { sheetNames: string[]; sheets: Map<string, SheetRow[]> };

// Reads every sheet of an .xlsx file into rows keyed by the header row.
// Empty cells are left out and blank rows skipped, like SheetJS's sheet_to_json.
export async function readWorkbook(file: File): Promise<Workbook> {
  const sheets = await readExcelFile(file);
  const result: Workbook = { sheetNames: [], sheets: new Map() };

  for (const { sheet, data } of sheets) {
    const [header = [], ...rows] = data;
    const keys = header.map((cell) => (cell === null ? "" : String(cell).trim()));

    const parsedRows = rows
      .map((row) => {
        const entry: SheetRow = {};

        row.forEach((cell, index) => {
          if (cell !== null && cell !== "" && keys[index]) {
            entry[keys[index]] = cell;
          }
        });

        return entry;
      })
      .filter((entry) => Object.keys(entry).length > 0);

    result.sheetNames.push(sheet);
    result.sheets.set(sheet, parsedRows);
  }

  return result;
}

export function getSheetRows(workbook: Workbook, name: string): SheetRow[] {
  return workbook.sheets.get(name) ?? [];
}
