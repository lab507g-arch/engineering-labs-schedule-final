export type CsvRow = Record<string, string>;

/**
 * Minimal CSV parser that handles quoted fields, embedded commas,
 * embedded newlines, and doubled quote escapes ("").
 */
export function parseCSV(text: string): CsvRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\r') {
        // skip carriage return
      } else {
        currentField += char;
      }
    }
  }

  // Push the last field/row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());

  return rows.slice(1).map((row) => {
    const obj: CsvRow = {};
    headers.forEach((header, idx) => {
      obj[header] = (row[idx] ?? '').trim();
    });
    return obj;
  });
}

/**
 * Case-insensitive property lookup on a CSV row.
 * Returns the value for the first matching key, or ''.
 */
export function getField(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    const lowerKey = key.toLowerCase();
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase() === lowerKey) {
        return row[rowKey];
      }
    }
  }
  return '';
}
