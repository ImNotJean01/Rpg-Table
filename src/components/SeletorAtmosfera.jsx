import { useEffect, useState } from 'react';
import { Fingerprint, Flame, Sword } from '@phosphor-icons/react';
import { cn } from '../lib/cn.js';

const ATMOSFERAS = [
  { id: 'ordem', label: 'Ordem', Icon: Fingerprint },
  { id: 'dnd', label: 'D&D', Icon: Sword },
  { id: 'tormenta', label: 'T20', Icon: Flame },
];

const STORAGE_KEY = 'mesa_rpg_theme';

export default function SeletorAtmosfera({ sistemaTema = null }) {
  const [tema, setTema] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo && ATMOSFERAS.some((a) => a.id === salvo)) return salvo;
    } catch {
      // ignora
    }
    return 'ordem';
  });

  // Sincroniza quando o sistema da campanha muda
  useEffect(() => {
    if (!sistemaTema) return;
    if (sistemaTema === 'paranormal') setTema('ordem');
    else if (sistemaTema === 'neutro') setTema('dnd');
    else if (ATMOSFERAS.some((a) => a.id === sistemaTema)) setTema(sistemaTema);
  }, [sistemaTema]);

  useEffect(() => {
    document.body.dataset.theme = tema;
    try {
      localStorage.setItem(STORAGE_KEY, tema);
    } catch {
      // ignora
    }
  }, [tema]);

  return (
    <div className="seletor-atmosfera" role="group" aria-label="Atmosfera visual">
      {ATMOSFERAS.map(({ id, label, Icon }) => {
        const ativo = tema === id;
        return (
          <button
            key={id}
            type="button"
            className={cn('seletor-atmosfera-btn', ativo && 'ativo')}
            onClick={() => setTema(id)}
            title={`Atmosfera: ${label}`}
          >
            <Icon size={13} weight={ativo ? 'duotone' : 'light'} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
