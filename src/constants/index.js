/** Key used to persist the colour theme in localStorage (also read in index.html). */
export const THEME_STORAGE_KEY = 'csv-viewer-theme';

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

export const SEARCH_DEBOUNCE_MS = 300;

/** Files above this size are rejected to keep the browser responsive. */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Max number of values inspected per column when detecting its type. */
export const TYPE_DETECTION_SAMPLE_SIZE = 1000;

export const SAMPLE_FILE_NAME = 'sample_data.csv';
export const SAMPLE_DATA_URL = `${import.meta.env.BASE_URL}${SAMPLE_FILE_NAME}`;

export const PARSE_STATUS = {
  IDLE: 'idle',
  PARSING: 'parsing',
  READY: 'ready',
  ERROR: 'error',
};

export const COLUMN_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
};

export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
};

export const TEXT_OPERATORS = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
];

export const NUMBER_OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'between', label: 'between' },
];

/** Date columns compare by calendar day; "between" (first = default) is an inclusive range. */
export const DATE_OPERATORS = [
  { value: 'between', label: 'between' },
  { value: 'on', label: 'on' },
  { value: 'before', label: 'before' },
  { value: 'after', label: 'after' },
  { value: 'onOrBefore', label: 'on or before' },
  { value: 'onOrAfter', label: 'on or after' },
];

/** Cell values treated as "empty" when detecting a column's type. */
export const NULL_TOKENS = new Set(['', 'na', 'n/a', 'null', 'none', 'nil', '-', '—', 'nan']);
