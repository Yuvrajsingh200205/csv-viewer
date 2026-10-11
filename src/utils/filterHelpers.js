import { COLUMN_TYPES, DATE_OPERATORS, DATE_PRESETS, NUMBER_OPERATORS, TEXT_OPERATORS } from '../constants';
import { formatDayNumber, parseNumber, toDateInputValue, toDayNumber } from './csvHelpers';

let ruleCounter = 0;

const isNumberColumn = (column) => column?.type === COLUMN_TYPES.NUMBER;
const isDateColumn = (column) => column?.type === COLUMN_TYPES.DATE;

/** Returns the operator list for a column type. */
export function getOperatorsForType(type) {
  if (type === COLUMN_TYPES.NUMBER) return NUMBER_OPERATORS;
  if (type === COLUMN_TYPES.DATE) return DATE_OPERATORS;
  return TEXT_OPERATORS;
}

/** Returns the first (default) operator for a column type. */
export function getDefaultOperator(type) {
  return getOperatorsForType(type)[0].value;
}

/** Returns the display label of an operator. */
export function getOperatorLabel(type, operator) {
  return getOperatorsForType(type).find((item) => item.value === operator)?.label ?? operator;
}

/**
 * Creates a new, empty filter rule for the given column.
 * @param {{index:number,type:string}} column
 */
export function createRule(column) {
  ruleCounter += 1;
  return {
    id: `rule-${ruleCounter}`,
    columnIndex: column.index,
    operator: getDefaultOperator(column.type),
    value: '',
    value2: '',
  };
}

/**
 * Resolves a quick-range preset into the inclusive bounds a date rule needs.
 * Ranges are built from local calendar parts, so they line up with the day numbers
 * date filters compare on. Out-of-range day arguments roll over by design
 * ("day 0" of this month is the last day of the previous one).
 * @param {string} preset One of DATE_PRESETS' values.
 * @param {Date} [today] Reference day, injectable for tests.
 * @returns {{value:string,value2:string}|null} Date-input values, or null when unknown.
 */
export function getDatePresetRange(preset, today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();
  const day = (y, m, d) => new Date(y, m, d);

  const resolve = {
    today: () => [day(year, month, date), day(year, month, date)],
    yesterday: () => [day(year, month, date - 1), day(year, month, date - 1)],
    last7: () => [day(year, month, date - 6), day(year, month, date)],
    last30: () => [day(year, month, date - 29), day(year, month, date)],
    mtd: () => [day(year, month, 1), day(year, month, date)],
    lastMonth: () => [day(year, month - 1, 1), day(year, month, 0)],
    qtd: () => [day(year, Math.floor(month / 3) * 3, 1), day(year, month, date)],
    ytd: () => [day(year, 0, 1), day(year, month, date)],
  }[preset];

  if (!resolve) return null;
  const [start, end] = resolve();
  return { value: toDateInputValue(start), value2: toDateInputValue(end) };
}

/** Returns the preset a date rule currently matches, or null when its range is custom. */
export function matchDatePreset(rule) {
  if (rule.operator !== 'between') return null;
  const match = DATE_PRESETS.find((preset) => {
    const range = getDatePresetRange(preset.value);
    return range.value === rule.value && range.value2 === rule.value2;
  });
  return match?.value ?? null;
}

/**
 * A rule is active only when it has a valid column and enough input to evaluate.
 * Incomplete rules are ignored instead of hiding every row.
 */
export function isRuleActive(rule, column) {
  if (!column) return false;
  if (isNumberColumn(column)) {
    if (parseNumber(rule.value) === null) return false;
    return rule.operator !== 'between' || parseNumber(rule.value2) !== null;
  }
  if (isDateColumn(column)) {
    if (toDayNumber(rule.value) === null) return false;
    return rule.operator !== 'between' || toDayNumber(rule.value2) !== null;
  }
  return rule.value.trim() !== '';
}

/**
 * Pairs each rule with its column and keeps only the active ones.
 * @returns {{rule: object, column: object}[]}
 */
export function getActiveRules(rules, columns) {
  return rules
    .map((rule) => ({ rule, column: columns[rule.columnIndex] }))
    .filter(({ rule, column }) => isRuleActive(rule, column));
}

/** Compiles a numeric rule into a fast predicate over a row's cells. */
function compileNumberRule(rule, columnIndex) {
  const a = parseNumber(rule.value);
  const b = parseNumber(rule.value2);
  const low = Math.min(a, b);
  const high = Math.max(a, b);

  const compare = {
    eq: (n) => n === a,
    gt: (n) => n > a,
    lt: (n) => n < a,
    gte: (n) => n >= a,
    lte: (n) => n <= a,
    between: (n) => n >= low && n <= high,
  }[rule.operator];

  if (!compare) return () => true;
  return (cells) => {
    const number = parseNumber(cells[columnIndex]);
    return number !== null && compare(number);
  };
}

/**
 * Compiles a date rule into a fast predicate over a row's cells.
 * Comparisons run on calendar day numbers, so "between" is an inclusive range of whole
 * days and the two bounds may be entered in either order.
 */
function compileDateRule(rule, columnIndex) {
  const a = toDayNumber(rule.value);
  const b = toDayNumber(rule.value2);
  const low = Math.min(a, b);
  const high = Math.max(a, b);

  const compare = {
    on: (day) => day === a,
    before: (day) => day < a,
    after: (day) => day > a,
    onOrBefore: (day) => day <= a,
    onOrAfter: (day) => day >= a,
    between: (day) => day >= low && day <= high,
  }[rule.operator];

  if (!compare) return () => true;
  return (cells) => {
    const day = toDayNumber(cells[columnIndex]);
    return day !== null && compare(day);
  };
}

/** Compiles a text rule (case-insensitive) into a fast predicate over a row's cells. */
function compileTextRule(rule, columnIndex) {
  const query = rule.value.trim().toLowerCase();

  const compare = {
    contains: (text) => text.includes(query),
    equals: (text) => text === query,
    startsWith: (text) => text.startsWith(query),
    endsWith: (text) => text.endsWith(query),
  }[rule.operator];

  if (!compare) return () => true;
  return (cells) => compare((cells[columnIndex] ?? '').toLowerCase());
}

/**
 * Builds one predicate combining the global search and all active rules (AND).
 * @param {{rule:object,column:object}[]} activeRules
 * @param {string} searchTerm
 * @returns {((row: {cells:string[]}, searchText: string) => boolean)|null} null when nothing filters.
 */
export function buildRowPredicate(activeRules, searchTerm) {
  const term = searchTerm.trim().toLowerCase();
  const tests = activeRules.map(({ rule, column }) => {
    if (isNumberColumn(column)) return compileNumberRule(rule, column.index);
    if (isDateColumn(column)) return compileDateRule(rule, column.index);
    return compileTextRule(rule, column.index);
  });

  if (!term && tests.length === 0) return null;

  return (row, searchText) =>
    (!term || searchText.includes(term)) && tests.every((test) => test(row.cells));
}

/** Human-readable description of a rule, used for chips and aria labels. */
export function describeRule({ rule, column }) {
  const operator = getOperatorLabel(column.type, rule.operator);
  if (isNumberColumn(column)) {
    if (rule.operator === 'between') {
      return `${column.label} between ${rule.value.trim()} and ${rule.value2.trim()}`;
    }
    return `${column.label} ${operator} ${rule.value.trim()}`;
  }
  if (isDateColumn(column)) {
    const from = toDayNumber(rule.value);
    if (rule.operator !== 'between') return `${column.label} ${operator} ${formatDayNumber(from)}`;
    // Bounds read in chronological order even when they were entered the other way round.
    const to = toDayNumber(rule.value2);
    const [start, end] = from <= to ? [from, to] : [to, from];
    return `${column.label} between ${formatDayNumber(start)} and ${formatDayNumber(end)}`;
  }
  return `${column.label} ${operator} “${rule.value.trim()}”`;
}
