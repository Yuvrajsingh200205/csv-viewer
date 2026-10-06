import { FileSpreadsheet, TriangleAlert, Upload } from 'lucide-react';
import { formatBytes, formatNumber } from '../utils/csvHelpers';

/** Summary card for the loaded file with a reset action. */
export default function FileInfo({ fileName, fileSize, rowCount, columnCount, malformedCount, onRemove }) {
  const stats = [
    { label: 'Size', value: formatBytes(fileSize) },
    { label: 'Rows', value: formatNumber(rowCount) },
    { label: 'Columns', value: formatNumber(columnCount) },
  ];

  return (
    <section
      aria-label="File details"
      className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-white" title={fileName}>
            {fileName}
          </p>
          <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-1.5">
                <dt>{label}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
          {malformedCount > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {formatNumber(malformedCount)} {malformedCount === 1 ? 'row had' : 'rows had'} a different
              number of fields than the header and {malformedCount === 1 ? 'was' : 'were'} adjusted to fit.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="btn-secondary w-full sm:w-auto"
        aria-label={`Remove ${fileName} and upload a new file`}
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        Upload new file
      </button>
    </section>
  );
}
