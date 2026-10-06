import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { PAGE_SIZE_OPTIONS } from '../constants';
import { formatNumber } from '../utils/csvHelpers';

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

/** Compact page list, e.g. [1, '…', 4, 5, 6, '…', 20]. Always 7 slots when there are many pages. */
function getPageItems(current, total) {
  if (total <= 7) return range(1, total);
  if (current <= 4) return [...range(1, 5), 'end-gap', total];
  if (current >= total - 3) return [1, 'start-gap', ...range(total - 4, total)];
  return [1, 'start-gap', current - 1, current, current + 1, 'end-gap', total];
}

/** Rows-per-page selector, "Showing X–Y of Z", and page navigation. */
export default function Pagination({ page, totalPages, pageSize, totalRows, onPageChange, onPageSizeChange }) {
  const items = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);
  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size">Rows per page</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="input py-1.5 pl-2.5 pr-8"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <p>
          Showing{' '}
          <span className="font-medium text-slate-900 dark:text-white">
            {formatNumber(start)}–{formatNumber(end)}
          </span>{' '}
          of <span className="font-medium text-slate-900 dark:text-white">{formatNumber(totalRows)}</span>
        </p>
      </div>

      <nav aria-label="Pagination" className="flex items-center justify-between gap-1 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="pager-btn"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="ml-1 sm:hidden">Prev</span>
        </button>

        <ul className="hidden items-center gap-1 sm:flex">
          {items.map((item) =>
            typeof item === 'number' ? (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  className={`pager-btn tabular-nums ${
                    item === page
                      ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-600 hover:text-white dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-500'
                      : ''
                  }`}
                >
                  {item}
                </button>
              </li>
            ) : (
              <li key={item} className="px-1 text-slate-400" aria-hidden="true">
                …
              </li>
            ),
          )}
        </ul>

        <span className="text-sm tabular-nums text-slate-500 sm:hidden dark:text-slate-400">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="pager-btn"
          aria-label="Next page"
        >
          <span className="mr-1 sm:hidden">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
