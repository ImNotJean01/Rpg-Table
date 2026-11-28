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
        <strong className="row" style={{ gap: '0.4rem', fontSize: '0.92rem' }}>
          <DiceFive size={16} weight="duotone" style={{ color: 'var(--accent-text)' }} aria-hidden="true" />
          Rolador de Dados
        </strong>
        {isMestre && (
          <label className="row" style={{ gap: '0.28rem', cursor: 'pointer', fontSize: '0.8rem', marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={secreta}
              onChange={(e) => setSecreta(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <EyeSlash size={13} weight="light" aria-hidden="true" /> Secreta
          </label>
        )}
      </div>

      <div className="row" style={{ gap: '0.3rem' }} role="group" aria-label="Rolagens rápidas">
        {DADOS_RAPIDOS.map((f) => (
          <button
            key={f}
            type="button"
            disabled={rolando}
            className="btn btn-sm mono"
            aria-label={`Rolar 1d${f}`}
            onClick={() => executar({ qtd: 1, faces: f, rotulo: `d${f}` })}
          >
            d{f}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="row" style={{ gap: '0.35rem' }}>
        <label htmlFor="rolador-expressao" className="sr-only">
          Fórmula de rolagem de dados
        </label>
        <input
          id="rolador-expressao"
          className="mono"
          value={expressao}
          onChange={(e) => setExpressao(e.target.value)}
          placeholder="Ex: 2d6+3"
          style={{ flex: 1, padding: '0.35rem 0.55rem' }}
        />
        <button type="submit" className="btn btn-sm btn-primary" disabled={rolando}>
          <DiceFive size={15} weight="duotone" aria-hidden="true" /> Rolar
        </button>
      </form>

      {erro && (
        <span role="alert" className="muted" style={{ color: 'var(--danger-text)' }}>
          {erro}
        </span>
      )}

      <div
        className="stack"
        style={{ gap: '0.4rem', marginTop: '0.25rem' }}
        aria-live="polite"
        aria-relevant="additions"
      >
        {rolagens.slice(0, 20).map((r) => {
          const isD20Unico =
            Array.isArray(r.dados) &&
            r.dados.length === 1 &&
            /^1?d20\b/i.test(String(r.expressao || '').trim());
          const critico20 = isD20Unico && r.dados[0] === 20;
          const falha1 = isD20Unico && r.dados[0] === 1;

          return (
            <div
              key={r.id}
              style={{
                background: critico20 ? 'var(--accent-soft)' : 'var(--bg-base)',
                border: `1px solid ${
                  critico20
                    ? 'var(--border-accent)'
                    : r.secreta
                      ? 'var(--accent-secondary)'
                      : 'var(--border-subtle)'
                }`,
                borderRadius: 8,
                padding: '0.48rem 0.65rem',
                fontSize: '0.84rem',
              }}
            >
              <div className="space-between">
                <strong className="row" style={{ gap: '0.35rem' }}>
                  {r.autor_nome}
                  {r.secreta && <LockSimple size={12} weight="duotone" title="Rolagem secreta" />}
                  {critico20 && <span className="badge badge-success">20 Natural</span>}
                  {falha1 && <span className="badge badge-warn">1 Natural</span>}
                </strong>
                <strong
                  className="mono"
                  style={{
                    fontSize: '1.12rem',
                    color: critico20
                      ? 'var(--success-text)'
                      : falha1
                        ? 'var(--danger-text)'
                        : 'var(--accent-text)',
                  }}
                >
                  {r.total}
                </strong>
              </div>
              <div className="muted mono" style={{ fontSize: '0.78rem', marginTop: '0.14rem' }}>
                {r.rotulo ? `${r.rotulo} · ` : ''}
                <code>{r.expressao}</code> → [{(r.dados || []).join(', ')}]
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
