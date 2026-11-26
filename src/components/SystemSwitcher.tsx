import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Flame, Sword, type Icon } from '@phosphor-icons/react';
import {
  THEME_META,
  useRpgTheme,
  type RpgSistemaId,
  type RpgTheme,
} from '../context/ThemeContext';
import { cn } from '../lib/cn';

interface SystemOption {
  id: RpgTheme;
  label: string;
  title: string;
  Icon: Icon;
}

const SYSTEM_OPTIONS: readonly SystemOption[] = [
  {
    id: 'ordem',
    label: 'Ordem',
    title: 'Ordem Paranormal — Investigação & Mistério',
    Icon: Fingerprint,
  },
  {
    id: 'dnd',
    label: 'D&D 5e',
    title: 'D&D 5ª Edição — Fantasia Épica Clássica',
    Icon: Sword,
  },
  {
    id: 'tormenta',
    label: 'T20',
    title: 'Tormenta 20 — Alta Fantasia & Ameaça Rubra',
    Icon: Flame,
  },
];

interface SystemSwitcherProps {
  sistemaTema?: string | null;
  className?: string;
  onSelect?: (theme: RpgTheme, sistemaId: RpgSistemaId) => void;
}

export default function SystemSwitcher({
  sistemaTema = null,
  className,
  onSelect,
}: SystemSwitcherProps) {
  const { theme, setTheme, syncFromSystem } = useRpgTheme();

  useEffect(() => {
    if (sistemaTema) {
      syncFromSystem(sistemaTema);
    }
  }, [sistemaTema, syncFromSystem]);

  return (
    <div
      role="radiogroup"
      aria-label="Sistema de RPG ativo"
      className={cn(
        'system-switcher inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 transition-colors duration-300 ease-out',
        className
      )}
    >
      {SYSTEM_OPTIONS.map(({ id, label, title, Icon }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={title}
            onClick={() => {
              setTheme(id);
              onSelect?.(id, THEME_META[id].sistemaId);
            }}
            className={cn(
              'seletor-atmosfera-btn relative inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-xs transition-colors duration-300 ease-out',
              active
                ? 'text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {active && (
              <motion.span
                layoutId="rpg-system-switcher-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="pointer-events-none absolute inset-0 rounded-full border border-[var(--border-accent)] bg-[var(--accent-soft)]"
                style={{ boxShadow: '0 0 18px var(--glow-color)' }}
              />
            )}
            <Icon
              size={14}
              weight={active ? 'duotone' : 'light'}
              className="relative z-10"
              aria-hidden="true"
            />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
