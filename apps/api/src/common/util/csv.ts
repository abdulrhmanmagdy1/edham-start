/** أدوات تصدير CSV بسيطة بلا اعتماديات خارجية. UTF-8 BOM لدعم العربية في Excel. */

const BOM = '﻿';

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** يبني نص CSV من عناوين + صفوف (كل صف مصفوفة قيم بنفس ترتيب العناوين). */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return BOM + lines.join('\r\n');
}
