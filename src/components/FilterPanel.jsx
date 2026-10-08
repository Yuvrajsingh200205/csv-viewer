import { ChevronDown, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { COLUMN_TYPES } from '../constants';
import { getOperatorsForType } from '../utils/filterHelpers';

const DESKTOP_QUERY = '(min-width: 1024px)';

const columnOptionLabel = (column) =>
  column.type === COLUMN_TYPES.TEXT ? column.label : `${column.label} · ${column.type}`;

/** One editable rule: column + operator + value(s). */
function FilterRule({ rule, position, columns, onUpdate, onRemove }) {
  const column = columns[rule.columnIndex] ?? columns[0];
  const operators = getOperatorsForType(column.type);
  const isNumber = column.type === COLUMN_TYPES.NUMBER;
  const isDate = column.type === COLUMN_TYPES.DATE;
  const isBetween = (isNumber || isDate) && rule.operator === 'between';
  const isDateRange = isDate && isBetween;
  const idPrefix = `filter-${rule.id}`;

  let valueInputProps = { type: 'text', autoComplete: 'off', spellCheck: false };
  if (isNumber) valueInputProps = { type: 'number', inputMode: 'decimal', step: 'any' };
  else if (isDate) valueInputProps = { type: 'date' };

  // Date pickers are self-describing, so they rely on their label instead of a placeholder.
  const firstLabel = isDate ? 'Start date' : isBetween ? 'Minimum value' : 'Value';
  const secondLabel = isDate ? 'End date' : 'Maximum value';

  return (
    <li className="animate-fade-in">
      {position > 0 && (
        <div className="my-2.5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">and</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
      )}
      <div
        role="group"
        aria-label={`Filter rule ${position + 1}`}
        className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 ${
          isDateRange
            ? 'sm:grid-cols-[minmax(0,1fr)_9rem_auto]'
            : 'sm:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1.3fr)_auto]'
        }`}
      >
        <label htmlFor={`${idPrefix}-column`} className="sr-only">
          Column
        </label>
        <select
          id={`${idPrefix}-column`}
          value={column.index}
          onChange={(event) => onUpdate(rule.id, { columnIndex: Number(event.target.value) })}
          className="input w-full"
        >
          {columns.map((item) => (
            <option key={item.index} value={item.index}>
              {columnOptionLabel(item)}
            </option>
          ))}
        </select>

        <label htmlFor={`${idPrefix}-operator`} className="sr-only">
          Operator
        </label>
        <select
          id={`${idPrefix}-operator`}
          value={rule.operator}
          onChange={(event) => onUpdate(rule.id, { operator: event.target.value })}
          className="input w-full"
        >
          {operators.map((operator) => (
            <option key={operator.value} value={operator.value}>
              {operator.label}
            </option>
          ))}
        </select>

        <div
          className={`order-last col-span-3 flex items-center gap-2 ${
            isDateRange ? '' : 'sm:order-none sm:col-span-1'
          }`}
        >
          <label htmlFor={`${idPrefix}-value`} className="sr-only">
            {firstLabel}
          </label>
          <input
            id={`${idPrefix}-value`}
            {...valueInputProps}
            value={rule.value}
            onChange={(event) => onUpdate(rule.id, { value: event.target.value })}
            placeholder={isDate ? undefined : isBetween ? 'Min' : 'Value'}
            className="input w-full min-w-0"
          />
          {isBetween && (
            <>
              <span className="text-xs text-slate-400" aria-hidden="true">
                to
              </span>
              <label htmlFor={`${idPrefix}-value2`} className="sr-only">
                {secondLabel}
              </label>
              <input
                id={`${idPrefix}-value2`}
                {...valueInputProps}
                value={rule.value2}
                onChange={(event) => onUpdate(rule.id, { value2: event.target.value })}
                placeholder={isDate ? undefined : 'Max'}
                className="input w-full min-w-0"
              />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(rule.id)}
          className="icon-btn hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          aria-label={`Remove filter rule ${position + 1}`}
          title="Remove rule"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

/**
 * Collapsible panel for building per-column filter rules (combined with AND).
 * Open by default on desktop, collapsed on smaller screens.
 */
export default function FilterPanel({ columns, rules, activeCount, onAddRule, onUpdateRule, onRemoveRule }) {
  const [isOpen, setIsOpen] = useState(() => window.matchMedia?.(DESKTOP_QUERY).matches ?? true);

  return (
    <section className="card" aria-label="Column filters">
      <h2>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="filter-panel-body"
          className="focus-ring flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left sm:px-5"
        >
          <span className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Filters</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                {activeCount}
                <span className="sr-only"> active</span>
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h2>

      <div
        id="filter-panel-body"
        hidden={!isOpen}
        className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-5 dark:border-slate-800"
      >
        {rules.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No filters yet. Add a rule to narrow rows down by a specific column.
          </p>
        ) : (
          <ul>
            {rules.map((rule, position) => (
              <FilterRule
                key={rule.id}
                rule={rule}
                position={position}
                columns={columns}
                onUpdate={onUpdateRule}
                onRemove={onRemoveRule}
              />
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onAddRule} className="btn-ghost -ml-2 text-indigo-600 dark:text-indigo-400">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add filter
          </button>
          {rules.length > 1 && (
            <p className="text-xs text-slate-400">Rows must match all rules.</p>
          )}
        </div>
      </div>
    </section>
  );
}
