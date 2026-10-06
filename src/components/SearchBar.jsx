import { Search, X } from 'lucide-react';

/** Global search input. Escape or the clear button empties it. */
export default function SearchBar({ value, onChange }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && value) {
      event.preventDefault();
      onChange('');
    }
  };

  return (
    <div className="relative">
      <label htmlFor="global-search" className="sr-only">
        Search across all columns
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        id="global-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search across all columns…"
        autoComplete="off"
        spellCheck={false}
        className="input w-full py-2.5 pl-10 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
