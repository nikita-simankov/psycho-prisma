// One CSV line per row, quoted where needed, with a BOM so spreadsheet apps read UTF-8.
export function toCsv(rows: (string | number | null)[][]) {
  const cell = (value: string | number | null) => {
    const text = value === null ? "" : String(value);
    // Formula-looking text is prefixed so spreadsheets don't run it.
    const safe = /^[=+\-@\t\r]/.test(text) && typeof value === "string" ? `'${text}` : text;
    return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + rows.map((row) => row.map(cell).join(",")).join("\n");
}
