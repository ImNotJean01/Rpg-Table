import { useState } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { cn } from '../../lib/cn.js';

export default function Condicoes({ opcoes = [], ativas = [], podeEditar, onChange }) {
  const [nova, setNova] = useState('');

  // Junta as opções padrão do sistema com quaisquer condições personalizadas já ativas
  const todas = Array.from(new Set([...opcoes, ...ativas]));

  function toggle(cond) {
    if (!podeEditar) return;
    const existe = ativas.includes(cond);
    const prox = existe ? ativas.filter((c) => c !== cond) : [...ativas, cond];
    onChange(prox);
  }

  function adicionarPersonalizada(e) {
    e?.preventDefault();
    if (!podeEditar) return;
    const limpa = nova.trim();
    if (!limpa) return;
    if (!ativas.includes(limpa)) {
      onChange([...ativas, limpa]);
    }
    setNova('');
  }

  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="space-between">
        <span className="muted" style={{ fontSize: '0.82rem' }}>
          Condições &amp; Estados (clique para ativar/remover)
        </span>
        {podeEditar && (
          <div className="row" style={{ gap: '0.3rem' }}>
            <input
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  adicionarPersonalizada();
                }
              }}
              placeholder="Ex: Embriagado, Possuído..."
              style={{ width: 195, padding: '0.24rem 0.55rem', fontSize: '0.78rem' }}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={adicionarPersonalizada}
              title="Adicionar condição personalizada"
            >
              <Plus size={13} weight="duotone" /> Estado
            </button>
          </div>
        )}
      </div>

      <div className="row" style={{ gap: '0.35rem' }}>
        {todas.map((cond) => {
          const ativa = ativas.includes(cond);
          const personalizada = !opcoes.includes(cond);
          return (
            <button
              key={cond}
              type="button"
              disabled={!podeEditar}
              onClick={() => toggle(cond)}
              className={cn('badge', ativa && (personalizada ? 'badge-accent' : 'badge-warn'))}
              style={{
                cursor: podeEditar ? 'pointer' : 'default',
                padding: '0.25rem 0.62rem',
                opacity: !podeEditar && !ativa ? 0.5 : 1,
              }}
            >
              <span>{cond}</span>
              {ativa && podeEditar && <X size={11} weight="bold" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
