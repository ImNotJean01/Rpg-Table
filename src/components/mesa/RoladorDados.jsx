import { useState } from 'react';
import { Dices, EyeOff } from 'lucide-react';
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
    <div className="stack" style={{ padding: '0.85rem', flex: 1 }}>
      <div className="space-between">
        <strong>Rolador de Dados</strong>
        {isMestre && (
          <label className="row" style={{ gap: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            <input
              type="checkbox"
              checked={secreta}
              onChange={(e) => setSecreta(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <EyeOff size={13} /> Secreta
          </label>
        )}
      </div>

      <div className="row" style={{ gap: '0.3rem' }}>
        {DADOS_RAPIDOS.map((f) => (
          <button
            key={f}
            type="button"
            disabled={rolando}
            className="btn btn-sm"
            onClick={() => executar({ qtd: 1, faces: f, rotulo: `d${f}` })}
          >
            d{f}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="row" style={{ gap: '0.35rem' }}>
        <input
          value={expressao}
          onChange={(e) => setExpressao(e.target.value)}
          placeholder="Ex: 2d6+3"
          style={{ flex: 1, padding: '0.35rem 0.55rem' }}
        />
        <button type="submit" className="btn btn-sm btn-primary" disabled={rolando}>
          <Dices size={14} /> Rolar
        </button>
      </form>

      {erro && <span className="muted" style={{ color: '#ff8787' }}>{erro}</span>}

      <div className="stack" style={{ gap: '0.4rem', marginTop: '0.25rem' }}>
        {rolagens.slice(0, 20).map((r) => (
          <div
            key={r.id}
            style={{
              background: 'var(--bg)',
              border: `1px solid ${r.secreta ? 'var(--accent-2)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: '0.45rem 0.6rem',
              fontSize: '0.84rem',
            }}
          >
            <div className="space-between">
              <strong>
                {r.autor_nome} {r.secreta ? '🔒' : ''}
              </strong>
              <strong style={{ fontSize: '1.05rem', color: 'var(--accent)' }}>{r.total}</strong>
            </div>
            <div className="muted" style={{ fontSize: '0.76rem' }}>
              {r.rotulo ? `${r.rotulo} · ` : ''}
              <code>{r.expressao}</code> → [{(r.dados || []).join(', ')}]
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
