import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type RpgTheme = 'ordem' | 'dnd' | 'tormenta';

interface ThemeContextValue {
  theme: RpgTheme;
  setTheme: (next: RpgTheme) => void;
  syncFromSystem: (sistemaTema?: string | null) => void;
}

const STORAGE_KEY = 'mesa_rpg_theme';
const VALID_THEMES: ReadonlySet<RpgTheme> = new Set(['ordem', 'dnd', 'tormenta']);

function isValidTheme(value: unknown): value is RpgTheme {
  return typeof value === 'string' && VALID_THEMES.has(value as RpgTheme);
}

function readInitialTheme(): RpgTheme {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (isValidTheme(attr)) return attr;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(saved)) return saved;
  } catch {
    // ignore storage errors
  }
  return 'ordem';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<RpgTheme>(readInitialTheme);

  const applyTheme = useCallback((next: RpgTheme) => {
    setThemeState(next);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const syncFromSystem = useCallback(
    (sistemaTema?: string | null) => {
      if (!sistemaTema) return;
      if (sistemaTema === 'paranormal' || sistemaTema === 'ordem') {
        applyTheme('ordem');
      } else if (sistemaTema === 'neutro' || sistemaTema === 'dnd') {
        applyTheme('dnd');
      } else if (sistemaTema === 'tormenta') {
        applyTheme('tormenta');
      }
    },
    [applyTheme]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme: applyTheme, syncFromSystem }),
    [theme, applyTheme, syncFromSystem]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useRpgTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useRpgTheme must be used within a ThemeProvider.');
  }
  return ctx;
}
