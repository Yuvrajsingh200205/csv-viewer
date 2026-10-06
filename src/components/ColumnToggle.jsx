import { Columns3 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** Dropdown with a checkbox per column to show or hide it. At least one column stays visible. */
export default function ColumnToggle({ columns, hiddenColumns, onToggle, onShowAll }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const hiddenCount = hiddenColumns.size;
  const visibleCount = columns.length - hiddenCount;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="column-toggle-menu"
        className="btn-secondary"
      >
        <Columns3 className="h-4 w-4" aria-hidden="true" />
        Columns
        {hiddenCount > 0 && (
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {visibleCount}/{columns.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="column-toggle-menu"
          role="group"
          aria-label="Visible columns"
          className="card absolute left-0 z-20 mt-2 w-64 overflow-hidden p-1.5 shadow-lg shadow-slate-900/10 animate-fade-in sm:left-auto sm:right-0 dark:shadow-black/40"
        >
          <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Columns</p>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={onShowAll}
                className="focus-ring rounded-md px-1.5 py-0.5 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Show all
              </button>
            )}
          </div>
          <ul className="thin-scrollbar max-h-72 overflow-y-auto">
            {columns.map((column) => {
              const isVisible = !hiddenColumns.has(column.index);
              const isLastVisible = isVisible && visibleCount === 1;
              return (
                <li key={column.index}>
                  <label
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition-colors dark:text-slate-200 ${
                      isLastVisible ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    title={isLastVisible ? 'At least one column must stay visible' : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      disabled={isLastVisible}
                      onChange={() => onToggle(column.index)}
                      className="h-4 w-4 shrink-0 rounded accent-indigo-600"
                    />
                    <span className="truncate">{column.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
