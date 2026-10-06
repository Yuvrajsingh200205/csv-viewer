import { useCallback, useEffect, useState } from 'react';
import { THEME_STORAGE_KEY, THEMES } from '../constants';

/** Reads the saved theme, falling back to the OS preference. */
function getInitialTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === THEMES.LIGHT || stored === THEMES.DARK) return stored;
  } catch {
    // localStorage can be unavailable (private mode, blocked storage).
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
}

/**
 * Manages light/dark mode: toggles the `dark` class on <html> and persists the choice.
 * @returns {{theme: 'light'|'dark', toggleTheme: () => void}}
 */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === THEMES.DARK);
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore write failures — the theme still applies for this session.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK));
  }, []);

  return { theme, toggleTheme };
}
