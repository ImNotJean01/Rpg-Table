import { useState } from 'react';
import { DiceFive, EyeSlash, LockSimple } from '@phosphor-icons/react';
import { supabase } from '../../lib/supabase.js';
import { parseExpressaoDados, rolarNoServidor } from '../../lib/dados.js';

const DADOS_RAPIDOS = [4, 6, 8, 10, 12, 20, 100];

export default function RoladorDados({ campanhaId, rolagens = [], isMestre }) {
  const [expressao, setExpressao] = useState('1d20');
  const [secreta, setSecreta] = useState(false);
  const [erro, setErro] = useState('');
  const [rolando, setRolando] = useState(false);

  async function executar(params) {
    if (!supabase) return;
    setErro('');
    setRolando(true);
    try {
      await rolarNoServidor(supabase, {
        campanhaId,
        ...params,
        secreta: isMestre && secreta,
      });
    } catch (err) {
      setErro(err.message || 'Erro ao rolar dados.');
    } finally {
      setRolando(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = parseExpressaoDados(expressao);
    if (!parsed) {
      setErro('Use formato como 1d20, 2d6+3 ou 3d8-1.');
      return;
    }
    executar({ ...parsed, rotulo: 'Rolagem livre' });
  }

  return (
    <div className="stack" style={{ padding: '0.9rem', flex: 1 }}>
      <div className="space-between">
        <div>
          <span className="section-kicker" style={{ display: 'block', fontSize: '0.68rem' }}>Destino</span>
          <strong style={{ fontSize: '0.92rem' }}>Rolador de Dados</strong>
        </div>
        {isMestre && (
          <label className="row" style={{ gap: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            <input
              type="checkbox"
              checked={secreta}
              onChange={(e) => setSecreta(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <EyeSlash size={13} weight="light" /> Secreta
          </label>
        )}
      </div>

      <div className="row" style={{ gap: '0.3rem' }}>
        {DADOS_RAPIDOS.map((f) => (
          <button
            key={f}
            type="button"
            disabled={rolando}
            className="btn btn-sm mono"
            onClick={() => executar({ qtd: 1, faces: f, rotulo: `d${f}` })}
          >
            d{f}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="row" style={{ gap: '0.35rem' }}>
        <input
          className="mono"
          value={expressao}
          onChange={(e) => setExpressao(e.target.value)}
          placeholder="Ex: 2d6+3"
          style={{ flex: 1, padding: '0.35rem 0.55rem' }}
        />
        <button type="submit" className="btn btn-sm btn-primary" disabled={rolando}>
          <DiceFive size={15} weight="duotone" /> Rolar
        </button>
      </form>

      {erro && <span className="muted" style={{ color: '#ff8787' }}>{erro}</span>}

      <div className="stack" style={{ gap: '0.4rem', marginTop: '0.25rem' }}>
        {rolagens.slice(0, 20).map((r) => (
          <div
            key={r.id}
            style={{
              background: 'var(--bg-base)',
              border: `1px solid ${r.secreta ? 'var(--accent-secondary)' : 'var(--border-subtle)'}`,
              borderRadius: 8,
              padding: '0.48rem 0.65rem',
              fontSize: '0.84rem',
            }}
          >
            <div className="space-between">
              <strong className="row" style={{ gap: '0.3rem' }}>
                {r.autor_nome}
                {r.secreta && <LockSimple size={12} weight="duotone" />}
              </strong>
              <strong className="mono" style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                {r.total}
              </strong>
            </div>
            <div className="muted mono" style={{ fontSize: '0.75rem', marginTop: '0.12rem' }}>
              {r.rotulo ? `${r.rotulo} · ` : ''}
              <code>{r.expressao}</code> → [{(r.dados || []).join(', ')}]
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
