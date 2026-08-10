/** Serializes an array of flat objects to CSV. No external dependency — small and dependency-free by design. */
export class CsvUtil {
  static toCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const escape = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => escape(row[h])).join(','));
    }
    return lines.join('\n');
  }
}
