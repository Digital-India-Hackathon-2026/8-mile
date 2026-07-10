import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth.jsx';

/**
 * Theme lives on <html data-theme data-type>. Switching swaps CSS custom
 * properties, so nothing re-renders and the change cannot leak into the
 * certificate — which pins its own colours precisely because a shared link
 * must look identical to everyone who opens it.
 *
 * Signed out, the choice lives in localStorage. Signed in, it follows the
 * account across devices.
 */
const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

const LS_THEME = 'crafttrail_theme';
const LS_TYPE = 'crafttrail_type';

export function ThemeProvider({ children }) {
  const auth = useAuth();
  const [theme, setThemeState] = useState(() => localStorage.getItem(LS_THEME) || 'clay');
  const [typeface, setTypeState] = useState(() => localStorage.getItem(LS_TYPE) || 'open');

  // account preference wins once it arrives
  useEffect(() => {
    const p = auth?.user?.prefs;
    if (!p) return;
    if (p.theme) setThemeState(p.theme);
    if (p.typeface) setTypeState(p.typeface);
  }, [auth?.user]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.type = typeface;
    localStorage.setItem(LS_TYPE, typeface);
  }, [typeface]);

  const setTheme = (t) => {
    setThemeState(t);
    auth?.updatePrefs?.({ prefs: { theme: t, typeface } }).catch(() => {});
  };
  const setTypeface = (t) => {
    setTypeState(t);
    auth?.updatePrefs?.({ prefs: { theme, typeface: t } }).catch(() => {});
  };

  const isDark = theme === 'night';
  return (
    <ThemeCtx.Provider value={{ theme, typeface, setTheme, setTypeface, isDark }}>
      {children}
    </ThemeCtx.Provider>
  );
}
