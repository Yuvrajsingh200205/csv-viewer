const SKELETON_WIDTHS = ['w-10', 'w-24', 'w-20', 'w-28', 'w-16'];

/** Centered message with optional icon and action, used for "no data" / "no results". */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in" role="status">
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Decorative table placeholder shown before any file is loaded. */
export function TableSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="flex gap-6 border-b border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        {SKELETON_WIDTHS.map((width, index) => (
          <span
            key={width}
            className={`h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 ${width} ${index > 2 ? 'hidden sm:block' : ''}`}
          />
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="flex gap-6 border-b border-slate-100 px-5 py-3.5 last:border-0 dark:border-slate-800/70"
          style={{ opacity: 1 - row * 0.18 }}
        >
          {SKELETON_WIDTHS.map((width, index) => (
            <span
              key={width}
              className={`h-2.5 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800 ${width} ${index > 2 ? 'hidden sm:block' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
