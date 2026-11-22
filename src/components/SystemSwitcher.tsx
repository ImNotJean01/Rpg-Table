import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Flame, Sword, type Icon } from '@phosphor-icons/react';
import { useRpgTheme, type RpgTheme } from '../context/ThemeContext';
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
}

export default function SystemSwitcher({ sistemaTema = null, className }: SystemSwitcherProps) {
  const { theme, setTheme, syncFromSystem } = useRpgTheme();

  useEffect(() => {
    if (sistemaTema) {
      syncFromSystem(sistemaTema);
    }
  }, [sistemaTema, syncFromSystem]);

  return (
    <div
      role="radiogroup"
      aria-label="Tema do sistema de RPG"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 transition-colors duration-300 ease-out',
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
            onClick={() => setTheme(id)}
            className={cn(
              'relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs transition-colors duration-300 ease-out',
              active
                ? 'text-[var(--text-primary)]'
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
            <Icon size={14} weight={active ? 'duotone' : 'light'} className="relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
