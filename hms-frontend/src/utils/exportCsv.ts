/**
 * Generic CSV exporter for table data
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columns: { key: keyof T | string; label: string; format?: (row: T) => string | number }[]
) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  // Header row
  const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const csvRows = rows.map(row => {
    return columns
      .map(col => {
        let val: any;
        if (col.format) {
          val = col.format(row);
        } else {
          val = row[col.key as keyof T];
        }
        if (val === undefined || val === null) val = '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header, ...csvRows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
