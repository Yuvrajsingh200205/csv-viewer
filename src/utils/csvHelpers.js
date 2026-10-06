import Papa from 'papaparse';
import {
  COLUMN_TYPES,
  MAX_FILE_SIZE_BYTES,
  NULL_TOKENS,
  SORT_DIRECTIONS,
  TYPE_DETECTION_SAMPLE_SIZE,
} from '../constants';

const BOM_REGEX = /^﻿/;
const NUMBER_REGEX = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;
const CURRENCY_PREFIX_REGEX = /^[$€£¥₹]\s?/;
const DATE_HINT_REGEX =
  /^(?:\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(?:[T\s]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\.?,?\s+\d{4})$/;

const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const numberFormatter = new Intl.NumberFormat();

/** Error whose message is safe to show to the user as-is. */
export class CsvParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CsvParseError';
  }
}

/**
 * Parses a human-formatted number ("1,200", "$45.50", "12%", "(300)").
 * @param {unknown} value
 * @returns {number|null} The numeric value, or null when the value is not a number.
 */
export function parseNumber(value) {
  if (value === null || value === undefined) return null;
  let text = String(value).trim();
  if (!text) return null;

  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1).trim();
  }

  text = text.replace(CURRENCY_PREFIX_REGEX, '').replace(/,/g, '').replace(/%$/, '').trim();
  if (!NUMBER_REGEX.test(text)) return null;

  const number = Number(text);
  if (!Number.isFinite(number)) return null;
  return negative ? -number : number;
}

/**
 * Parses a date-like string ("2024-03-01", "03/01/2024", "Mar 1, 2024").
 * Plain numbers are deliberately not treated as dates.
 * @param {unknown} value
 * @returns {number|null} Epoch milliseconds, or null when not a date.
 */
export function parseDate(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text || !DATE_HINT_REGEX.test(text)) return null;
  const time = Date.parse(text);
  return Number.isNaN(time) ? null : time;
}

const isNullish = (value) => NULL_TOKENS.has(String(value).trim().toLowerCase());

/**
 * Detects whether a column holds numbers, dates or free text by sampling its values.
 * A column is numeric/date only if every non-empty sampled value matches.
 * @param {{cells: string[]}[]} rows
 * @param {number} columnIndex
 * @returns {'text'|'number'|'date'}
 */
export function detectColumnType(rows, columnIndex) {
  const step = Math.max(1, Math.floor(rows.length / TYPE_DETECTION_SAMPLE_SIZE));
  let filled = 0;
  let numbers = 0;
  let dates = 0;

  for (let i = 0; i < rows.length; i += step) {
    const value = rows[i].cells[columnIndex];
    if (isNullish(value)) continue;
    filled += 1;
    if (parseNumber(value) !== null) numbers += 1;
    else if (parseDate(value) !== null) dates += 1;
    else return COLUMN_TYPES.TEXT;
  }

  if (filled === 0) return COLUMN_TYPES.TEXT;
  if (numbers === filled) return COLUMN_TYPES.NUMBER;
  if (dates === filled) return COLUMN_TYPES.DATE;
  return COLUMN_TYPES.TEXT;
}

/**
 * Cleans header names: strips BOM, collapses whitespace, fills blanks
 * and de-duplicates ("Name", "Name (2)").
 * @param {unknown[]} rawHeaders
 * @returns {string[]}
 */
export function normalizeHeaders(rawHeaders) {
  const used = new Set();
  return rawHeaders.map((header, index) => {
    const cleaned = String(header ?? '')
      .replace(BOM_REGEX, '')
      .replace(/\s+/g, ' ')
      .trim();
    const base = cleaned || `Column ${index + 1}`;

    let label = base;
    let suffix = 2;
    while (used.has(label.toLowerCase())) {
      label = `${base} (${suffix})`;
      suffix += 1;
    }
    used.add(label.toLowerCase());
    return label;
  });
}

const cleanCell = (value) => String(value ?? '').replace(BOM_REGEX, '').trim();

/**
 * Turns raw PapaParse rows (arrays) into a normalised dataset.
 * Rows are padded / trimmed to the header width; such rows are counted as malformed.
 * @param {unknown[][]} rawRows
 * @returns {{columns: {index:number,label:string,type:string}[], rows: {id:number,cells:string[]}[], malformedCount:number}}
 */
export function buildDataset(rawRows) {
  const meaningful = rawRows.filter(
    (row) => Array.isArray(row) && row.some((cell) => cleanCell(cell) !== ''),
  );
  if (meaningful.length === 0) {
    throw new CsvParseError('This file is empty — no headers or rows were found.');
  }

  const [headerRow, ...body] = meaningful;
  if (headerRow.some((cell) => String(cell ?? '').includes('\u0000'))) {
    throw new CsvParseError("This file doesn't look like a valid text CSV. Please check its contents.");
  }

  const labels = normalizeHeaders(headerRow);
  const width = labels.length;
  let malformedCount = 0;

  const rows = body.map((raw, id) => {
    const hasExtraData = raw.length > width && raw.slice(width).some((cell) => cleanCell(cell) !== '');
    if (raw.length < width || hasExtraData) malformedCount += 1;

    const cells = new Array(width);
    for (let i = 0; i < width; i += 1) cells[i] = cleanCell(raw[i]);
    return { id, cells };
  });

  const columns = labels.map((label, index) => ({
    index,
    label,
    type: detectColumnType(rows, index),
  }));

  return { columns, rows, malformedCount };
}

/**
 * Parses a File or CSV string with PapaParse into raw row arrays.
 * @param {File|string} source
 * @returns {Promise<unknown[][]>}
 */
export function parseCsvSource(source) {
  return new Promise((resolve, reject) => {
    Papa.parse(source, {
      skipEmptyLines: 'greedy',
      complete: (results) => resolve(results.data),
      error: () =>
        reject(new CsvParseError('We could not read this file. Make sure it is a valid CSV file.')),
    });
  });
}

/**
 * Validates a user-selected file before parsing.
 * @param {File} file
 * @returns {string|null} A user-friendly error message, or null if valid.
 */
export function validateCsvFile(file) {
  if (!/\.csv$/i.test(file.name)) {
    return `“${file.name}” isn't a CSV file. Please choose a file ending in .csv.`;
  }
  if (file.size === 0) {
    return `“${file.name}” is empty. Please choose a CSV file that contains data.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)}. The maximum supported size is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`;
  }
  return null;
}

/**
 * Returns a sortable key for a cell based on the column type (null = empty / unparsable).
 * @param {string} value
 * @param {string} type
 */
function getSortKey(value, type) {
  if (value === '') return null;
  if (type === COLUMN_TYPES.NUMBER) return parseNumber(value);
  if (type === COLUMN_TYPES.DATE) return parseDate(value);
  return value;
}

/**
 * Smart, stable sort: numbers numerically, dates chronologically, text naturally.
 * Empty values always sink to the bottom.
 * @param {{id:number,cells:string[]}[]} rows
 * @param {number} columnIndex
 * @param {string} type
 * @param {'asc'|'desc'} direction
 */
export function sortRows(rows, columnIndex, type, direction) {
  const multiplier = direction === SORT_DIRECTIONS.DESC ? -1 : 1;
  const keyed = rows.map((row) => ({ row, key: getSortKey(row.cells[columnIndex], type) }));

  keyed.sort((a, b) => {
    if (a.key === null || b.key === null) {
      if (a.key === b.key) return a.row.id - b.row.id;
      return a.key === null ? 1 : -1;
    }
    const diff =
      typeof a.key === 'number' && typeof b.key === 'number'
        ? a.key - b.key
        : textCollator.compare(String(a.key), String(b.key));
    return diff !== 0 ? diff * multiplier : a.row.id - b.row.id;
  });

  return keyed.map(({ row }) => row);
}

/**
 * Downloads rows as a UTF-8 CSV file (with BOM for Excel, formula-escaped for safety).
 * @param {{index:number,label:string}[]} columns
 * @param {{cells:string[]}[]} rows
 * @param {string} fileName
 */
export function exportRowsToCsv(columns, rows, fileName) {
  const csv = Papa.unparse(
    {
      fields: columns.map((column) => column.label),
      data: rows.map((row) => columns.map((column) => row.cells[column.index])),
    },
    { escapeFormulae: true },
  );

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** "employees.csv" -> "employees-filtered.csv" */
export function getExportFileName(fileName) {
  const base = fileName.replace(/\.csv$/i, '') || 'data';
  return `${base}-filtered.csv`;
}

/** Formats a byte count as "1.2 MB". */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 || value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

/** Formats an integer with locale-aware thousands separators. */
export function formatNumber(value) {
  return numberFormatter.format(value);
}
