import { Download, FileX, SearchX, ShieldCheck } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import ColumnToggle from './components/ColumnToggle';
import DataTable from './components/DataTable';
import EmptyState, { TableSkeleton } from './components/EmptyState';
import FileInfo from './components/FileInfo';
import FileUpload from './components/FileUpload';
import FilterChips from './components/FilterChips';
import FilterPanel from './components/FilterPanel';
import Header from './components/Header';
import Pagination from './components/Pagination';
import SearchBar from './components/SearchBar';
import { PARSE_STATUS } from './constants';
import { useCsvParser } from './hooks/useCsvParser';
import { useFilters } from './hooks/useFilters';
import { useTheme } from './hooks/useTheme';
import { exportRowsToCsv, formatNumber, getExportFileName } from './utils/csvHelpers';

const EMPTY_LIST = [];

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { status, dataset, error, parseFile, loadSample, reset, clearError } = useCsvParser();
  const [focusUploadOnMount, setFocusUploadOnMount] = useState(false);

  const columns = dataset?.columns ?? EMPTY_LIST;
  const rows = dataset?.rows ?? EMPTY_LIST;
  const view = useFilters(columns, rows);
  const { hiddenColumns, sortedRows, setSearchInput, clearAllFilters } = view;

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.has(column.index)),
    [columns, hiddenColumns],
  );

  const handleExport = useCallback(() => {
    if (!dataset || sortedRows.length === 0) return;
    exportRowsToCsv(visibleColumns, sortedRows, getExportFileName(dataset.fileName));
  }, [dataset, visibleColumns, sortedRows]);

  const handleRemoveFile = useCallback(() => {
    setFocusUploadOnMount(true);
    reset();
  }, [reset]);

  const clearSearch = useCallback(() => setSearchInput(''), [setSearchInput]);

  const hasNoDataRows = rows.length === 0;
  const emptyState = useMemo(() => {
    if (hasNoDataRows) {
      return (
        <EmptyState
          icon={FileX}
          title="No data rows"
          description="This file only contains a header row. Add some rows to the CSV and upload it again."
        />
      );
    }
    return (
      <EmptyState
        icon={SearchX}
        title="No matching rows"
        description="Try a different search term or relax one of your filter rules."
        action={
          <button type="button" onClick={clearAllFilters} className="btn-secondary">
            Clear all filters
          </button>
        }
      />
    );
  }, [hasNoDataRows, clearAllFilters]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {!dataset ? (
          <div className="mx-auto max-w-3xl space-y-10 animate-fade-in">
            <div className="text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Explore your CSV data in seconds
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-slate-500 dark:text-slate-400">
                Upload a file to view, sort, search and filter it — then export exactly the rows you need.
              </p>
            </div>

            <FileUpload
              onFileSelect={parseFile}
              onLoadSample={loadSample}
              isParsing={status === PARSE_STATUS.PARSING}
              error={error}
              onDismissError={clearError}
              autoFocus={focusUploadOnMount}
            />

            <TableSkeleton />
          </div>
        ) : (
          <div key={dataset.id} className="space-y-5 animate-fade-in">
            <h1 className="sr-only">Viewing {dataset.fileName}</h1>

            <FileInfo
              fileName={dataset.fileName}
              fileSize={dataset.fileSize}
              rowCount={rows.length}
              columnCount={columns.length}
              malformedCount={dataset.malformedCount}
              onRemove={handleRemoveFile}
            />

            <section aria-label="Search and filter controls" className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <SearchBar value={view.searchInput} onChange={setSearchInput} />
                </div>
                <div className="flex items-center gap-2">
                  <ColumnToggle
                    columns={columns}
                    hiddenColumns={hiddenColumns}
                    onToggle={view.toggleColumn}
                    onShowAll={view.showAllColumns}
                  />
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={sortedRows.length === 0}
                    className="btn-primary flex-1 md:flex-none"
                    title="Download the filtered rows and visible columns as CSV"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Export CSV
                  </button>
                </div>
              </div>

              <FilterPanel
                columns={columns}
                rules={view.rules}
                activeCount={view.activeRules.length}
                onAddRule={view.addRule}
                onUpdateRule={view.updateRule}
                onRemoveRule={view.removeRule}
              />

              <FilterChips
                searchTerm={view.searchTerm}
                activeRules={view.activeRules}
                onClearSearch={clearSearch}
                onRemoveRule={view.removeRule}
                onClearAll={clearAllFilters}
              />
            </section>

            <section aria-label="Data" className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
                  Showing{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatNumber(view.filteredCount)}
                  </span>{' '}
                  of {formatNumber(rows.length)} rows
                </p>
                {view.hasActiveFilters && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    Filtered
                  </span>
                )}
              </div>

              <DataTable
                columns={visibleColumns}
                rows={view.pageRows}
                sort={view.sort}
                onSort={view.toggleSort}
                emptyState={emptyState}
              />

              {view.filteredCount > 0 && (
                <Pagination
                  page={view.page}
                  totalPages={view.totalPages}
                  pageSize={view.pageSize}
                  totalRows={view.filteredCount}
                  onPageChange={view.setPage}
                  onPageSizeChange={view.setPageSize}
                />
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/70 py-6 dark:border-slate-800/70">
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-1.5 px-4 text-xs text-slate-400 sm:px-6 lg:px-8">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Your data never leaves your browser.
        </p>
      </footer>
    </div>
  );
}
