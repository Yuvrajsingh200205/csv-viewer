import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS, SORT_DIRECTIONS } from '../constants';
import { sortRows } from '../utils/csvHelpers';
import {
  buildRowPredicate,
  createRule,
  getActiveRules,
  getDefaultOperator,
  getOperatorsForType,
} from '../utils/filterHelpers';
import { useDebounce } from './useDebounce';

/**
 * Owns all table view state for a dataset: global search (debounced), filter rules,
 * sorting, pagination and column visibility. State resets whenever a new dataset loads.
 * @param {{index:number,label:string,type:string}[]} columns
 * @param {{id:number,cells:string[]}[]} rows
 */
export function useFilters(columns, rows) {
  const [trackedRows, setTrackedRows] = useState(rows);
  const [searchInput, setSearchInput] = useState('');
  const [rules, setRules] = useState([]);
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set());

  // Reset view state when a new dataset arrives (React's "adjust state on prop change" pattern).
  if (rows !== trackedRows) {
    setTrackedRows(rows);
    setSearchInput('');
    setRules([]);
    setSort(null);
    setPage(1);
    setHiddenColumns(new Set());
  }

  // Clearing the search applies instantly; typing is debounced.
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const searchTerm = searchInput.trim() === '' ? '' : debouncedSearch.trim();

  const [trackedSearch, setTrackedSearch] = useState(searchTerm);
  if (searchTerm !== trackedSearch) {
    setTrackedSearch(searchTerm);
    setPage(1);
  }

  // Pre-joined, lower-cased row text makes global search a single `includes` per row.
  const searchIndex = useMemo(
    () => rows.map((row) => row.cells.join('\u0001').toLowerCase()),
    [rows],
  );

  const activeRules = useMemo(() => getActiveRules(rules, columns), [rules, columns]);

  const filteredRows = useMemo(() => {
    const predicate = buildRowPredicate(activeRules, searchTerm);
    if (!predicate) return rows;
    return rows.filter((row, index) => predicate(row, searchIndex[index]));
  }, [rows, searchIndex, activeRules, searchTerm]);

  const sortedRows = useMemo(() => {
    const column = sort ? columns[sort.columnIndex] : null;
    if (!column) return filteredRows;
    return sortRows(filteredRows, column.index, column.type, sort.direction);
  }, [filteredRows, sort, columns]);

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageRows = useMemo(
    () => sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedRows, currentPage, pageSize],
  );

  const addRule = useCallback(() => {
    if (columns.length === 0) return;
    setRules((prev) => [...prev, createRule(columns[0])]);
  }, [columns]);

  const updateRule = useCallback(
    (id, patch) => {
      setRules((prev) =>
        prev.map((rule) => {
          if (rule.id !== id) return rule;
          const next = { ...rule, ...patch };
          const columnChanged =
            patch.columnIndex !== undefined && patch.columnIndex !== rule.columnIndex;
          if (columnChanged) {
            const prevType = columns[rule.columnIndex]?.type;
            const nextType = columns[patch.columnIndex]?.type;
            if (getOperatorsForType(prevType) !== getOperatorsForType(nextType)) {
              next.operator = getDefaultOperator(nextType);
              next.value = '';
              next.value2 = '';
            }
          }
          return next;
        }),
      );
      setPage(1);
    },
    [columns],
  );

  const removeRule = useCallback((id) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
    setPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setRules([]);
    setSearchInput('');
    setPage(1);
  }, []);

  const toggleSort = useCallback((columnIndex) => {
    setSort((prev) => {
      if (!prev || prev.columnIndex !== columnIndex) {
        return { columnIndex, direction: SORT_DIRECTIONS.ASC };
      }
      if (prev.direction === SORT_DIRECTIONS.ASC) {
        return { columnIndex, direction: SORT_DIRECTIONS.DESC };
      }
      return null;
    });
    setPage(1);
  }, []);

  const setPageSize = useCallback((size) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const toggleColumn = useCallback(
    (columnIndex) => {
      setHiddenColumns((prev) => {
        const next = new Set(prev);
        if (next.has(columnIndex)) next.delete(columnIndex);
        else if (columns.length - next.size > 1) next.add(columnIndex);
        return next;
      });
    },
    [columns.length],
  );

  const showAllColumns = useCallback(() => setHiddenColumns(new Set()), []);

  return {
    searchInput,
    setSearchInput,
    searchTerm,
    rules,
    activeRules,
    addRule,
    updateRule,
    removeRule,
    clearAllFilters,
    hasActiveFilters: activeRules.length > 0 || searchTerm !== '',
    sort,
    toggleSort,
    filteredCount: totalRows,
    sortedRows,
    pageRows,
    page: currentPage,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    hiddenColumns,
    toggleColumn,
    showAllColumns,
  };
}
