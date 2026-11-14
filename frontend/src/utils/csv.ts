export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (!data || !data.length) {
    alert('No data to export.');
    return;
  }

  const keys = columns ? columns.map((c) => c.key) : (Object.keys(data[0]) as (keyof T)[]);
  const headers = columns ? columns.map((c) => c.label) : (keys as string[]);

  const csvRows: string[] = [];
  csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  for (const row of data) {
    const values = keys.map((key) => {
      const rawVal: any = row[key];
      let strVal: string;
      if (rawVal === null || rawVal === undefined) {
        strVal = '';
      } else if (typeof rawVal === 'object') {
        strVal = JSON.stringify(rawVal);
      } else {
        strVal = String(rawVal);
      }
      return `"${strVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
