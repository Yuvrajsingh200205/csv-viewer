import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { memo } from 'react';
import { COLUMN_TYPES, SORT_DIRECTIONS } from '../constants';

const ARIA_SORT = {
  [SORT_DIRECTIONS.ASC]: 'ascending',
  [SORT_DIRECTIONS.DESC]: 'descending',
};

const HEAD_CELL =
  'sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95';

function SortIndicator({ direction }) {
  if (direction === SORT_DIRECTIONS.ASC) {
    return <ArrowUp className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />;
  }
  if (direction === SORT_DIRECTIONS.DESC) {
    return <ArrowDown className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />;
  }
  return (
    <ChevronsUpDown
      className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60"
      aria-hidden="true"
    />
  );
}

/**
 * Scrollable table with sticky, sortable headers. Shows `emptyState` below the header
 * when there are no rows to render.
 */
function DataTable({ columns, rows, sort, onSort, emptyState }) {
  return (
    <div>
      <div
        role="region"
        aria-label="CSV data table"
        tabIndex={0}
        className="thin-scrollbar max-h-[65vh] overflow-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">
            Uploaded CSV data. Activate a column header to sort by that column.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className={`${HEAD_CELL} w-14 px-4 py-3 text-right text-xs font-medium text-slate-400`}
              >
                #
              </th>
              {columns.map((column) => {
                const direction = sort?.columnIndex === column.index ? sort.direction : null;
                const isNumber = column.type === COLUMN_TYPES.NUMBER;
                return (
                  <th
                    key={column.index}
                    scope="col"
                    aria-sort={ARIA_SORT[direction] ?? 'none'}
                    className={`${HEAD_CELL} p-0`}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(column.index)}
                      title={`Sort by ${column.label}`}
                      className={`group flex w-full items-center gap-1.5 whitespace-nowrap px-4 py-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                        isNumber ? 'justify-end' : 'justify-start'
                      } ${
                        direction
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      <span className="max-w-[16rem] truncate">{column.label}</span>
                      <SortIndicator direction={direction} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-800/30 dark:hover:bg-indigo-500/10"
              >
                <td className="border-b border-slate-100 px-4 py-2.5 text-right text-xs tabular-nums text-slate-400 dark:border-slate-800/70 dark:text-slate-500">
                  {row.id + 1}
                </td>
                {columns.map((column) => {
                  const value = row.cells[column.index];
                  const isNumber = column.type === COLUMN_TYPES.NUMBER;
                  return (
                    <td
                      key={column.index}
                      className={`whitespace-nowrap border-b border-slate-100 px-4 py-2.5 text-slate-700 dark:border-slate-800/70 dark:text-slate-300 ${
                        isNumber ? 'text-right tabular-nums' : ''
                      }`}
                    >
                      {value === '' ? (
                        <span className="text-slate-300 dark:text-slate-600">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">empty</span>
                        </span>
                      ) : (
                        <div className={`max-w-[18rem] truncate ${isNumber ? 'ml-auto' : ''}`} title={value}>
                          {value}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && emptyState}
    </div>
  );
}

export default memo(DataTable);
