import { COLUMN_TYPES, NUMBER_OPERATORS, TEXT_OPERATORS } from '../constants';
import { parseNumber } from './csvHelpers';

let ruleCounter = 0;

const isNumberColumn = (column) => column?.type === COLUMN_TYPES.NUMBER;

/** Returns the operator list for a column type (dates and text share text operators). */
export function getOperatorsForType(type) {
  return type === COLUMN_TYPES.NUMBER ? NUMBER_OPERATORS : TEXT_OPERATORS;
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
 * A rule is active only when it has a valid column and enough input to evaluate.
 * Incomplete rules are ignored instead of hiding every row.
 */
export function isRuleActive(rule, column) {
  if (!column) return false;
  if (isNumberColumn(column)) {
    if (parseNumber(rule.value) === null) return false;
    return rule.operator !== 'between' || parseNumber(rule.value2) !== null;
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
  const tests = activeRules.map(({ rule, column }) =>
    isNumberColumn(column)
      ? compileNumberRule(rule, column.index)
      : compileTextRule(rule, column.index),
  );

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
  return `${column.label} ${operator} “${rule.value.trim()}”`;
}
