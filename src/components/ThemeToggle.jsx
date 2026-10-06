import { Moon, Sun } from 'lucide-react';
import { THEMES } from '../constants';

/** Icon button that switches between light and dark mode. */
export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === THEMES.DARK;
  const label = `Switch to ${isDark ? 'light' : 'dark'} mode`;

  return (
    <button type="button" onClick={onToggle} className="icon-btn" aria-label={label} title={label}>
      {isDark ? (
        <Sun className="h-5 w-5 animate-fade-in" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 animate-fade-in" aria-hidden="true" />
      )}
    </button>
  );
}
