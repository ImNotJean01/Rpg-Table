import { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import UploadImagem from '../components/UploadImagem.jsx';
import Condicoes from '../components/ficha/Condicoes.jsx';

export default function Criaturas({ campanhaId, sistema, isMestre }) {
  const { rows: criaturas, setRows: setCriaturas, loading } = useRealtimeTable('criaturas', {
    filtroValor: campanhaId,
    orderBy: 'criado_em',
  });

  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [campos, setCampos] = useState({});
  const [pvMax, setPvMax] = useState(40);
  const [acoes, setAcoes] = useState('');
  const [visivel, setVisivel] = useState(false);

  async function criar(e) {
    e.preventDefault();
    if (!supabase || !nome.trim()) return;
    await supabase.from('criaturas').insert({
      campanha_id: campanhaId,
      nome: nome.trim(),
      imagem_url: imagemUrl.trim() || null,
      visivel,
      dados: {
        campos,
        recursos: { pv: { atual: Number(pvMax) || 40, max: Number(pvMax) || 40 } },
        acoes,
      },
    });
    setNome('');
    setImagemUrl('');
    setCampos({});
    setAcoes('');
    setVisivel(false);
    setAberto(false);
  }

  async function alternarVisivel(c) {
    await supabase.from('criaturas').update({ visivel: !c.visivel }).eq('id', c.id);
  }

  async function ajustarPv(c, delta) {
    const pv = c.dados?.recursos?.pv || { atual: 40, max: 40 };
    const prox = Math.max(0, (Number(pv.atual) || 0) + delta);
    await supabase
      .from('criaturas')
      .update({
        dados: {
          ...c.dados,
          recursos: { ...c.dados?.recursos, pv: { ...pv, atual: prox } },
        },
      })
      .eq('id', c.id);
  }

  async function atualizarCondicoes(c, condicoes) {
    await supabase.from('criaturas').update({ condicoes }).eq('id', c.id);
  }

  async function apagar(id) {
    if (!confirm('Apagar esta criatura?')) return;
    const { error } = await supabase.from('criaturas').delete().eq('id', id);
    if (!error) setCriaturas((prev) => prev.filter((c) => c.id !== id));
  }

  const camposCriatura = sistema.criatura?.campos || [];

  return (
    <div className="container stack" style={{ gap: '1.25rem' }}>
      <div className="space-between">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Bestiário & Criaturas</h1>
          <p className="muted" style={{ margin: 0 }}>
            Monstros ocultos ficam invisíveis até o mestre revelar na hora do encontro.
          </p>
        </div>

        {isMestre && (
          <button type="button" className="btn btn-primary" onClick={() => setAberto((v) => !v)}>
            <Plus size={16} /> Nova criatura
          </button>
        )}
      </div>

      {isMestre && aberto && (
        <form onSubmit={criar} className="card stack">
          <strong>Cadastrar criatura</strong>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div>
              <label className="muted">Nome</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Zumbi de Sangue"
                required
              />
            </div>
            <div>
              <label className="muted">Vida máxima (PV)</label>
              <input
                type="number"
                value={pvMax}
                onChange={(e) => setPvMax(e.target.value)}
              />
            </div>
            {camposCriatura.map((c) => (
              <div key={c.id}>
                <label className="muted">{c.nome}</label>
                {c.tipo === 'select' ? (
                  <select
                    value={campos[c.id] || ''}
                    onChange={(e) => setCampos((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  >
                    <option value="">—</option>
                    {c.opcoes.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={c.tipo === 'numero' ? 'number' : 'text'}
                    value={campos[c.id] || ''}
                    onChange={(e) => setCampos((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          <UploadImagem
            pasta={`${campanhaId}/criaturas`}
            valor={imagemUrl}
            onChange={setImagemUrl}
            label="Imagem da criatura"
          />

          <div>
            <label className="muted">Ações, ataques e habilidades</label>
            <textarea
              rows={4}
              value={acoes}
              onChange={(e) => setAcoes(e.target.value)}
              placeholder="Garras (2d20+5, 1d6+3 corte), Imunidade..."
            />
          </div>

          <div className="space-between">
            <label className="row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={visivel}
                onChange={(e) => setVisivel(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span>Já revelada no bestiário</span>
            </label>
            <div className="row">
              <button type="button" className="btn" onClick={() => setAberto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar criatura</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <span className="muted">Carregando bestiário...</span>
      ) : criaturas.length === 0 ? (
        <div className="card muted">Nenhuma criatura encontrada ou revelada ainda.</div>
      ) : (
        <div className="grid-cards">
          {criaturas.map((c) => {
            const pv = c.dados?.recursos?.pv || { atual: 0, max: 1 };
            const pct = pv.max > 0 ? Math.min(100, Math.max(0, (pv.atual / pv.max) * 100)) : 0;
            return (
              <div key={c.id} className="card stack" style={{ justifyContent: 'space-between' }}>
                <div className="stack" style={{ gap: '0.55rem' }}>
                  <div className="space-between">
                    <strong style={{ fontSize: '1.1rem' }}>{c.nome}</strong>
                    {isMestre && !c.visivel && <span className="badge badge-warn">Oculta</span>}
                  </div>

                  {c.imagem_url && (
                    <img
                      src={c.imagem_url}
                      alt={c.nome}
                      style={{
                        width: '100%',
                        maxHeight: 180,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                      }}
                    />
                  )}

                  <div className="row" style={{ gap: '0.35rem' }}>
                    {camposCriatura.map((f) =>
                      c.dados?.campos?.[f.id] ? (
                        <span key={f.id} className="badge">
                          {f.nome}: {c.dados.campos[f.id]}
                        </span>
                      ) : null
                    )}
                  </div>

                  <div className="stack" style={{ gap: '0.25rem' }}>
                    <div className="space-between" style={{ fontSize: '0.84rem' }}>
                      <span className="muted">PV</span>
                      <span>{pv.atual} / {pv.max}</span>
                    </div>
                    <div className="recurso-bar">
                      <div className="recurso-fill" style={{ width: `${pct}%`, background: '#c92a42' }} />
                    </div>
                    {isMestre && (
                      <div className="row" style={{ gap: '0.3rem', marginTop: '0.2rem' }}>
                        <button type="button" className="btn btn-sm" onClick={() => ajustarPv(c, -5)}>−5</button>
                        <button type="button" className="btn btn-sm" onClick={() => ajustarPv(c, -1)}>−1</button>
                        <button type="button" className="btn btn-sm" onClick={() => ajustarPv(c, +1)}>+1</button>
                        <button type="button" className="btn btn-sm" onClick={() => ajustarPv(c, +5)}>+5</button>
                      </div>
                    )}
                  </div>

                  <Condicoes
                    opcoes={sistema.condicoes || []}
                    ativas={c.condicoes || []}
                    podeEditar={isMestre}
                    onChange={(prox) => atualizarCondicoes(c, prox)}
                  />

                  {c.dados?.acoes && (
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.88rem' }}>
                      {c.dados.acoes}
                    </p>
                  )}
                </div>

                {isMestre && (
                  <div className="space-between">
                    <button
                      type="button"
                      className={`btn btn-sm ${c.visivel ? '' : 'btn-primary'}`}
                      onClick={() => alternarVisivel(c)}
                    >
                      {c.visivel ? <Eye size={14} /> : <EyeOff size={14} />}
                      {c.visivel ? 'Revelada' : 'Revelar'}
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => apagar(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
