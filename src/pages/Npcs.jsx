import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeSlash, LockSimple, Plus, Trash, UserCircle } from '@phosphor-icons/react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import UploadImagem from '../components/UploadImagem.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SkeletonCards from '../components/SkeletonCards.jsx';

export default function Npcs({ campanhaId, isMestre }) {
  const { rows: npcs, setRows: setNpcs, loading } = useRealtimeTable('npcs', {
    filtroValor: campanhaId,
    orderBy: 'criado_em',
  });

  const [segredos, setSegredos] = useState({});
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [infoPublica, setInfoPublica] = useState('');
  const [segredo, setSegredo] = useState('');
  const [visivel, setVisivel] = useState(true);
  const [npcParaApagar, setNpcParaApagar] = useState(null);
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    if (!isMestre || !supabase || npcs.length === 0) return;
    supabase
      .from('npcs_notas')
      .select('npc_id, segredo')
      .in(
        'npc_id',
        npcs.map((n) => n.id)
      )
      .then(({ data }) => {
        if (data) {
          const map = {};
          for (const item of data) map[item.npc_id] = item.segredo;
          setSegredos(map);
        }
      });
  }, [isMestre, npcs]);

  async function criar(e) {
    e.preventDefault();
    if (!supabase || !nome.trim()) return;
    const { data, error } = await supabase
      .from('npcs')
      .insert({
        campanha_id: campanhaId,
        nome: nome.trim(),
        papel: papel.trim(),
        imagem_url: imagemUrl.trim() || null,
        info_publica: infoPublica,
        visivel,
      })
      .select()
      .single();

    if (!error && data && segredo.trim()) {
      await supabase.from('npcs_notas').upsert({ npc_id: data.id, segredo });
    }
    setNome('');
    setPapel('');
    setImagemUrl('');
    setInfoPublica('');
    setSegredo('');
    setAberto(false);
  }

  async function alternarVisivel(npc) {
    await supabase.from('npcs').update({ visivel: !npc.visivel }).eq('id', npc.id);
  }

  async function confirmarApagar() {
    if (!supabase || !npcParaApagar) return;
    setApagando(true);
    try {
      const id = npcParaApagar.id;
      const { error } = await supabase.from('npcs').delete().eq('id', id);
      if (!error) {
        setNpcs((prev) => prev.filter((n) => n.id !== id));
        setNpcParaApagar(null);
      }
    } finally {
      setApagando(false);
    }
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
          <h1 style={{ margin: '0 0 0.2rem' }}>Elenco &amp; NPCs</h1>
          <p className="muted" style={{ margin: 0 }}>
            Aliados, contatos, testemunhas e suspeitos que cruzaram o caminho do grupo.
          </p>
        </div>

        {isMestre && (
          <button type="button" className="btn btn-primary" onClick={() => setAberto((v) => !v)}>
            <Plus size={16} weight="duotone" aria-hidden="true" /> Novo NPC
          </button>
        )}
      </div>

      {isMestre && aberto && (
        <form onSubmit={criar} className="card stack">
          <strong>Cadastrar NPC</strong>
          <div
            className="grid-cards"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}
          >
            <div>
              <label htmlFor="npc-nome">Nome</label>
              <input
                id="npc-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Veríssimo"
                required
              />
            </div>
            <div>
              <label htmlFor="npc-papel">Papel / Ocupação</label>
              <input
                id="npc-papel"
                value={papel}
                onChange={(e) => setPapel(e.target.value)}
                placeholder="Ex: Líder da Ordem, Delegado"
              />
            </div>
          </div>
          <UploadImagem
            pasta={`${campanhaId}/npcs`}
            valor={imagemUrl}
            onChange={setImagemUrl}
            label="Retrato do NPC"
          />
          <div>
            <label htmlFor="npc-info">Informações públicas</label>
            <textarea
              id="npc-info"
              rows={3}
              value={infoPublica}
              onChange={(e) => setInfoPublica(e.target.value)}
              placeholder="O que os jogadores já sabem sobre ele..."
            />
          </div>
          <div>
            <label htmlFor="npc-segredo">Segredo do Mestre (privado)</label>
            <textarea
              id="npc-segredo"
              rows={2}
              value={segredo}
              onChange={(e) => setSegredo(e.target.value)}
              placeholder="Segredo do mestre (jogadores nunca veem)"
            />
          </div>
          <div className="space-between">
            <label className="row" style={{ cursor: 'pointer', marginBottom: 0 }}>
              <input
                type="checkbox"
                checked={visivel}
                onChange={(e) => setVisivel(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span>Visível para jogadores</span>
            </label>
            <div className="row">
              <button type="button" className="btn" onClick={() => setAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar NPC
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <SkeletonCards quantidade={3} altura={150} />
      ) : npcs.length === 0 ? (
        <EmptyState
          Icon={UserCircle}
          titulo="Nenhum NPC conhecido ainda"
          descricao={
            isMestre
              ? 'Clique em "Novo NPC" no topo para adicionar aliados, suspeitos ou figuras importantes da história.'
              : 'Os personagens importantes que o grupo encontrar na aventura aparecerão aqui.'
          }
        />
      ) : (
        <div className="grid-cards">
          {npcs.map((n) => (
            <motion.div
              key={n.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="card card-interactive stack"
              style={{ justifyContent: 'space-between' }}
            >
              <div className="stack" style={{ gap: '0.55rem' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="row">
                    {n.imagem_url && (
                      <img
                        src={n.imagem_url}
                        alt={n.nome}
                        loading="lazy"
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--border-strong)',
                        }}
                      />
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{n.nome}</h3>
                      {n.papel && (
                        <div className="muted" style={{ fontSize: '0.8rem' }}>
                          {n.papel}
                        </div>
                      )}
                    </div>
                  </div>
                  {isMestre && !n.visivel && <span className="badge badge-warn">Oculto</span>}
                </div>

                {n.info_publica && (
                  <p style={{ margin: 0, fontSize: '0.92rem' }}>{n.info_publica}</p>
                )}

                {isMestre && segredos[n.id] && (
                  <div
                    className="card"
                    style={{
                      background: 'var(--bg-base)',
                      padding: '0.55rem 0.7rem',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span className="muted row" style={{ fontSize: '0.75rem', gap: '0.3rem' }}>
                      <LockSimple size={12} weight="duotone" aria-hidden="true" /> Segredo do mestre
                    </span>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{segredos[n.id]}</div>
                  </div>
                )}
              </div>

              {isMestre && (
                <div
                  className="space-between"
                  style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}
                >
                  <button type="button" className="btn btn-sm" onClick={() => alternarVisivel(n)}>
                    {n.visivel ? (
                      <Eye size={14} weight="duotone" aria-hidden="true" />
                    ) : (
                      <EyeSlash size={14} weight="light" aria-hidden="true" />
                    )}
                    {n.visivel ? 'Visível' : 'Revelar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => setNpcParaApagar(n)}
                    aria-label={`Apagar NPC ${n.nome}`}
                    title="Apagar NPC"
                  >
                    <Trash size={14} weight="light" aria-hidden="true" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmModal
        aberto={Boolean(npcParaApagar)}
        titulo="Apagar NPC"
        mensagem={`Deseja apagar "${npcParaApagar?.nome}" da lista de NPCs?`}
        textoConfirmar="Sim, apagar"
        carregando={apagando}
        onConfirmar={confirmarApagar}
        onCancelar={() => setNpcParaApagar(null)}
      />
    </motion.div>
  );
}
