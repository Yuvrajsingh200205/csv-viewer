import { Search, X } from 'lucide-react';
import { describeRule } from '../utils/filterHelpers';

/** A single removable pill. */
function Chip({ icon: Icon, label, onRemove }) {
  return (
    <li className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pl-3 pr-1 text-xs font-medium text-indigo-700 animate-fade-in dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span className="truncate" title={label}>
        {label}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="focus-ring rounded-full p-0.5 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
        aria-label={`Remove filter: ${label}`}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </li>
  );
}

/** Active search + rule chips with a "Clear all filters" action. Renders nothing when idle. */
export default function FilterChips({ searchTerm, activeRules, onClearSearch, onRemoveRule, onClearAll }) {
  if (!searchTerm && activeRules.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Active filters">
        {searchTerm && (
          <Chip icon={Search} label={`“${searchTerm}”`} onRemove={onClearSearch} />
        )}
        {activeRules.map((entry) => (
          <Chip key={entry.rule.id} label={describeRule(entry)} onRemove={() => onRemoveRule(entry.rule.id)} />
        ))}
      </ul>
      <button
        type="button"
        onClick={onClearAll}
        className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
      >
        Clear all filters
      </button>
    </div>
  );
}
