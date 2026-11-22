import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DiceFive, Plus, Trash, X } from '@phosphor-icons/react';
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="container stack"
      style={{ gap: '1.25rem' }}
    >
      <div className="space-between" style={{ alignItems: 'flex-end' }}>
        <div>
          <span className="section-kicker">Fichas &amp; Agentes</span>
          <h1 style={{ margin: '0.2rem 0 0.2rem' }}>Personagens da Party</h1>
          <p className="muted" style={{ margin: 0 }}>
            Clique em um card para abrir a ficha completa e rolar testes.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={criarPersonagem}>
          <Plus size={16} weight="duotone" /> Novo personagem
        </button>
      </div>

      {avisoRolagem && (
        <div className="badge badge-accent mono" style={{ padding: '0.5rem 0.85rem', fontSize: '0.88rem' }}>
          <DiceFive size={16} weight="duotone" /> {avisoRolagem}
        </div>
      )}

      {loading ? (
        <span className="muted">Carregando fichas...</span>
      ) : personagens.length === 0 ? (
        <div className="card dossie-papel muted">Nenhum personagem criado ainda.</div>
      ) : (
        <div className="grid-cards">
          {personagens.map((p) => {
            const podeEditar = isMestre || p.dono_id === userId;
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16 }}
                className="card card-interactive stack"
                style={{ cursor: 'pointer', gap: '0.7rem' }}
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
                          border: '2px solid var(--accent-primary)',
                        }}
                      />
                    ) : (
                      <div
                        className="mono"
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {p.nome.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{p.nome}</h3>
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
                      <Trash size={14} weight="light" />
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
                    <div key={rec.id} className="stack" style={{ gap: '0.22rem' }}>
                      <div className="space-between" style={{ fontSize: '0.78rem' }}>
                        <span className="muted">{rec.nome}</span>
                        <span className="mono">{val.atual}/{val.max}</span>
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
              </motion.div>
            );
          })}
        </div>
      )}

      {selecionado && (
        <div className="modal-backdrop" onClick={() => setSelecionadoId(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="modal-box stack"
            style={{ maxWidth: 880 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelecionadoId(null)}>
                <X size={16} weight="light" /> Fechar
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
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
