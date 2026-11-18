import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import { rolarNoServidor } from '../lib/dados.js';
import FichaDinamica from '../components/ficha/FichaDinamica.jsx';

export default function Personagens({ campanhaId, sistema, userId, isMestre }) {
  const { rows: personagens, loading } = useRealtimeTable('personagens', {
    filtroValor: campanhaId,
    orderBy: 'criado_em',
  });

  const [membros, setMembros] = useState([]);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [avisoRolagem, setAvisoRolagem] = useState('');

  useEffect(() => {
    if (!supabase || !campanhaId) return;
    supabase
      .from('membros')
      .select('user_id, papel, perfis(nome)')
      .eq('campanha_id', campanhaId)
      .then(({ data }) => {
        if (data) {
          setMembros(
            data.map((m) => ({
              user_id: m.user_id,
              papel: m.papel,
              nome: m.perfis?.nome || 'Jogador',
            }))
          );
        }
      });
  }, [campanhaId]);

  const selecionado = personagens.find((p) => p.id === selecionadoId) || null;

  async function criarPersonagem() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('personagens')
      .insert({
        campanha_id: campanhaId,
        dono_id: userId,
        nome: 'Novo Personagem',
        dados: {},
      })
      .select()
      .single();
    if (!error && data) setSelecionadoId(data.id);
  }

  async function salvarFicha(payload) {
    if (!supabase || !selecionado) return;
    await supabase.from('personagens').update(payload).eq('id', selecionado.id);
  }

  async function apagar(id) {
    if (!confirm('Apagar esta ficha?')) return;
    await supabase.from('personagens').delete().eq('id', id);
    if (selecionadoId === id) setSelecionadoId(null);
  }

  async function handleRolar(rotulo, params) {
    if (!supabase) return;
    const res = await rolarNoServidor(supabase, {
      campanhaId,
      ...params,
      rotulo,
    });
    setAvisoRolagem(`${rotulo}: ${res.total} [${res.dados.join(', ')}]`);
    setTimeout(() => setAvisoRolagem(''), 5000);
  }

  return (
    <div className="container stack" style={{ gap: '1.25rem' }}>
      <div className="space-between">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Personagens da Party</h1>
          <p className="muted" style={{ margin: 0 }}>
            Clique em um card para abrir a ficha completa e rolar testes.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={criarPersonagem}>
          <Plus size={16} /> Novo personagem
        </button>
      </div>

      {avisoRolagem && (
        <div className="badge badge-accent" style={{ padding: '0.5rem 0.85rem', fontSize: '0.9rem' }}>
          🎲 {avisoRolagem}
        </div>
      )}

      {loading ? (
        <span className="muted">Carregando fichas...</span>
      ) : personagens.length === 0 ? (
        <div className="card muted">Nenhum personagem criado ainda.</div>
      ) : (
        <div className="grid-cards">
          {personagens.map((p) => {
            const podeEditar = isMestre || p.dono_id === userId;
            return (
              <div
                key={p.id}
                className="card stack"
                style={{ cursor: 'pointer', gap: '0.65rem' }}
                onClick={() => setSelecionadoId(p.id)}
              >
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="row">
                    {p.retrato_url ? (
                      <img
                        src={p.retrato_url}
                        alt={p.nome}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--accent)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          background: 'var(--surface-2)',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {p.nome.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>{p.nome}</strong>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        {p.dados?.campos?.classe || p.dados?.campos?.classe_papel || 'Sem classe'}
                      </div>
                    </div>
                  </div>

                  {podeEditar && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        apagar(p.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {(sistema.recursos || []).map((rec) => {
                  const val = p.dados?.recursos?.[rec.id] || {
                    atual: rec.padrao ?? 10,
                    max: rec.padrao ?? 10,
                  };
                  const pct = val.max > 0 ? Math.min(100, Math.max(0, (val.atual / val.max) * 100)) : 0;
                  return (
                    <div key={rec.id} className="stack" style={{ gap: '0.2rem' }}>
                      <div className="space-between" style={{ fontSize: '0.78rem' }}>
                        <span className="muted">{rec.nome}</span>
                        <span>{val.atual}/{val.max}</span>
                      </div>
                      <div className="recurso-bar" style={{ height: 7 }}>
                        <div className="recurso-fill" style={{ width: `${pct}%`, background: rec.cor }} />
                      </div>
                    </div>
                  );
                })}

                {p.condicoes?.length > 0 && (
                  <div className="row" style={{ gap: '0.25rem' }}>
                    {p.condicoes.map((c) => (
                      <span key={c} className="badge badge-warn">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selecionado && (
        <div className="modal-backdrop" onClick={() => setSelecionadoId(null)}>
          <div
            className="modal-box stack"
            style={{ maxWidth: 860 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setSelecionadoId(null)}>
                <X size={16} /> Fechar
              </button>
            </div>
            <FichaDinamica
              key={selecionado.id}
              personagem={selecionado}
              sistema={sistema}
              campanhaId={campanhaId}
              membros={membros}
              isMestre={isMestre}
              podeEditar={isMestre || selecionado.dono_id === userId}
              onSalvar={salvarFicha}
              onRolar={handleRolar}
            />
          </div>
        </div>
      )}
    </div>
  );
}
