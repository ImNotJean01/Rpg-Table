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
export type RpgSistemaId = 'ordem-paranormal' | 'dnd5e' | 'tormenta20';

export interface ThemeMeta {
  theme: RpgTheme;
  sistemaId: RpgSistemaId;
  nomeSistema: string;
  guiaPath: string;
  exemploCampanha: string;
}

export const THEME_META: Record<RpgTheme, ThemeMeta> = {
  ordem: {
    theme: 'ordem',
    sistemaId: 'ordem-paranormal',
    nomeSistema: 'Ordem Paranormal',
    guiaPath: '/guias/ordem-paranormal',
    exemploCampanha: 'Ex: O Caso da Mansão',
  },
  dnd: {
    theme: 'dnd',
    sistemaId: 'dnd5e',
    nomeSistema: 'D&D 5ª Edição',
    guiaPath: '/guias/dnd5e',
    exemploCampanha: 'Ex: A Maldição de Strahd',
  },
  tormenta: {
    theme: 'tormenta',
    sistemaId: 'tormenta20',
    nomeSistema: 'Tormenta 20',
    guiaPath: '/guias/tormenta20',
    exemploCampanha: 'Ex: Coração de Rubi',
  },
};

export function sistemaIdToTheme(sistemaId?: string | null): RpgTheme | null {
  if (!sistemaId) return null;
  if (sistemaId === 'ordem-paranormal' || sistemaId === 'ordem' || sistemaId === 'paranormal') {
    return 'ordem';
  }
  if (sistemaId === 'dnd5e' || sistemaId === 'dnd' || sistemaId === 'neutro') {
    return 'dnd';
  }
  if (sistemaId === 'tormenta20' || sistemaId === 'tormenta') {
    return 'tormenta';
  }
  return null;
}

interface ThemeContextValue {
  theme: RpgTheme;
  sistemaId: RpgSistemaId;
  nomeSistema: string;
  guiaPath: string;
  exemploCampanha: string;
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
      const mapped = sistemaIdToTheme(sistemaTema);
      if (mapped) applyTheme(mapped);
    },
    [applyTheme]
  );

  const meta = THEME_META[theme];

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      sistemaId: meta.sistemaId,
      nomeSistema: meta.nomeSistema,
      guiaPath: meta.guiaPath,
      exemploCampanha: meta.exemploCampanha,
      setTheme: applyTheme,
      syncFromSystem,
    }),
    [theme, meta, applyTheme, syncFromSystem]
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
