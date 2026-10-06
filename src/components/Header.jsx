import { Table2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

/** Sticky top bar with the app identity and theme toggle. */
export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <Table2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              CSV Viewer
            </p>
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
              Upload, explore and filter tabular data
            </p>
          </div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
