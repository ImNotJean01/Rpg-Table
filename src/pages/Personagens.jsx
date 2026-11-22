import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Crown,
  DiceFive,
  LockKey,
  LockKeyOpen,
  Plus,
  Trash,
  Users,
  X,
} from '@phosphor-icons/react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import { rolarNoServidor } from '../lib/dados.js';
import { cn } from '../lib/cn.js';
import FichaDinamica from '../components/ficha/FichaDinamica.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SkeletonCards from '../components/SkeletonCards.jsx';

export default function Personagens({ campanhaId, sistema, userId, isMestre }) {
  const { rows: personagens, setRows: setPersonagens, loading } = useRealtimeTable('personagens', {
    filtroValor: campanhaId,
    orderBy: 'criado_em',
  });

  const [membros, setMembros] = useState([]);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [criandoNovo, setCriandoNovo] = useState(false);
  const [avisoRolagem, setAvisoRolagem] = useState('');
  const [personagemParaApagar, setPersonagemParaApagar] = useState(null);
  const [apagando, setApagando] = useState(false);

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

  const selecionado = criandoNovo
    ? { id: 'novo', nome: '', dono_id: userId, condicoes: [], dados: {} }
    : personagens.find((p) => p.id === selecionadoId) || null;

  function abrirNovoPersonagem() {
    setSelecionadoId(null);
    setCriandoNovo(true);
  }

  function fecharModal() {
    setCriandoNovo(false);
    setSelecionadoId(null);
  }

  async function salvarFicha(payload) {
    if (!supabase || !selecionado) return;
    if (criandoNovo) {
      const { data, error } = await supabase
        .from('personagens')
        .insert({
          campanha_id: campanhaId,
          ...payload,
          dono_id: isMestre ? payload.dono_id : userId,
        })
        .select()
        .single();
      if (!error && data) {
        setPersonagens((prev) =>
          prev.some((p) => p.id === data.id) ? prev : [...prev, data]
        );
        setCriandoNovo(false);
        setSelecionadoId(data.id);
      }
      return;
    }

    const { data, error } = await supabase
      .from('personagens')
      .update(payload)
      .eq('id', selecionado.id)
      .select()
      .single();
    if (!error && data) {
      setPersonagens((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    }
  }

  async function ajustarRecursoRapido(e, p, rec, delta) {
    e.stopPropagation();
    if (!supabase) return;
    const atualObj = p.dados?.recursos?.[rec.id] || {
      atual: rec.padrao ?? 10,
      max: rec.padrao ?? 10,
    };
    const proxAtual = Math.max(0, (Number(atualObj.atual) || 0) + delta);
    const proxDados = {
      ...(p.dados || {}),
      recursos: {
        ...(p.dados?.recursos || {}),
        [rec.id]: { ...atualObj, atual: proxAtual },
      },
    };
    setPersonagens((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, dados: proxDados } : x))
    );
    await supabase.from('personagens').update({ dados: proxDados }).eq('id', p.id);
  }

  async function alternarControleMestreRapido(e, p) {
    e.stopPropagation();
    if (!supabase || !isMestre) return;
    const controlado = Boolean(p.dados?.controlado_pelo_mestre);
    const proxDados = {
      ...(p.dados || {}),
      controlado_pelo_mestre: !controlado,
    };
    setPersonagens((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, dados: proxDados } : x))
    );
    await supabase.from('personagens').update({ dados: proxDados }).eq('id', p.id);
  }

  async function confirmarApagar() {
    if (!supabase || !personagemParaApagar) return;
    setApagando(true);
    try {
      const id = personagemParaApagar.id;
      const { error } = await supabase.from('personagens').delete().eq('id', id);
      if (!error) {
        setPersonagens((prev) => prev.filter((p) => p.id !== id));
        if (selecionadoId === id) setSelecionadoId(null);
        setPersonagemParaApagar(null);
      }
    } finally {
      setApagando(false);
    }
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
            {isMestre
              ? 'Como mestre, você pode editar qualquer ficha, adicionar estados (ex: Embriagado) ou assumir o controle exclusivo.'
              : 'Clique em um card para abrir a ficha completa e rolar testes.'}
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={abrirNovoPersonagem}>
          <Plus size={16} weight="duotone" /> Novo personagem
        </button>
      </div>

      {avisoRolagem && (
        <div className="badge badge-accent mono" style={{ padding: '0.5rem 0.85rem', fontSize: '0.88rem' }}>
          <DiceFive size={16} weight="duotone" /> {avisoRolagem}
        </div>
      )}

      {loading ? (
        <SkeletonCards quantidade={3} altura={170} />
      ) : personagens.length === 0 ? (
        <EmptyState
          Icon={Users}
          titulo="Nenhum personagem na party ainda"
          descricao='Clique em "Novo personagem" no topo para criar a ficha do seu aventureiro e acompanhar vida, atributos, perícias e rolagens ao vivo.'
        />
      ) : (
        <div className="grid-cards">
          {personagens.map((p) => {
            const controlado = Boolean(p.dados?.controlado_pelo_mestre);
            const podeEditar = isMestre || (p.dono_id === userId && !controlado);
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16 }}
                className="card card-interactive stack"
                style={{
                  cursor: 'pointer',
                  gap: '0.7rem',
                  borderColor: controlado ? 'var(--border-accent)' : undefined,
                }}
                onClick={() => {
                  setCriandoNovo(false);
                  setSelecionadoId(p.id);
                }}
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

                  <div className="row" style={{ gap: '0.25rem' }}>
                    {isMestre && (
                      <button
                        type="button"
                        className={cn('btn btn-sm', controlado && 'btn-primary')}
                        onClick={(e) => alternarControleMestreRapido(e, p)}
                        title={
                          controlado
                            ? 'Sob seu controle (clique para devolver ao player)'
                            : 'Assumir controle exclusivo da ficha'
                        }
                      >
                        {controlado ? (
                          <LockKeyOpen size={14} weight="duotone" />
                        ) : (
                          <LockKey size={14} weight="light" />
                        )}
                      </button>
                    )}
                    {podeEditar && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPersonagemParaApagar(p);
                        }}
                        title="Apagar ficha"
                      >
                        <Trash size={14} weight="light" />
                      </button>
                    )}
                  </div>
                </div>

                {controlado && (
                  <div className="badge badge-accent" style={{ alignSelf: 'flex-start' }}>
                    <Crown size={12} weight="duotone" /> Sob controle do Mestre
                  </div>
                )}

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
                        <div className="row" style={{ gap: '0.25rem' }}>
                          {isMestre && (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost mono"
                              style={{ padding: '0 0.35rem', fontSize: '0.75rem' }}
                              onClick={(e) => ajustarRecursoRapido(e, p, rec, -1)}
                              title="−1"
                            >
                              −
                            </button>
                          )}
                          <span className="mono">{val.atual}/{val.max}</span>
                          {isMestre && (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost mono"
                              style={{ padding: '0 0.35rem', fontSize: '0.75rem' }}
                              onClick={(e) => ajustarRecursoRapido(e, p, rec, +1)}
                              title="+1"
                            >
                              +
                            </button>
                          )}
                        </div>
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
        <div className="modal-backdrop" onClick={fecharModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="modal-box stack"
            style={{ maxWidth: 880 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-between">
              <span className="section-kicker">
                {criandoNovo ? 'Novo Personagem (salve para criar)' : 'Ficha do Personagem'}
              </span>
              <button type="button" className="btn btn-sm btn-ghost" onClick={fecharModal}>
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
              podeEditar={criandoNovo || isMestre || selecionado.dono_id === userId}
              onSalvar={salvarFicha}
              onRolar={criandoNovo ? null : handleRolar}
            />
          </motion.div>
        </div>
      )}

      <ConfirmModal
        aberto={Boolean(personagemParaApagar)}
        titulo="Apagar personagem"
        mensagem={`Deseja apagar a ficha de "${personagemParaApagar?.nome}"?`}
        textoConfirmar="Sim, apagar"
        carregando={apagando}
        onConfirmar={confirmarApagar}
        onCancelar={() => setPersonagemParaApagar(null)}
      />
    </motion.div>
  );
}
