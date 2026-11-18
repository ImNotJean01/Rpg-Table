import { useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import UploadImagem from '../components/UploadImagem.jsx';

export default function Npcs({ campanhaId, isMestre }) {
  const { rows: npcs, loading } = useRealtimeTable('npcs', {
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

  async function apagar(id) {
    if (!confirm('Apagar este NPC?')) return;
    await supabase.from('npcs').delete().eq('id', id);
  }

  return (
    <div className="container stack" style={{ gap: '1.25rem' }}>
      <div className="space-between">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Elenco & NPCs</h1>
          <p className="muted" style={{ margin: 0 }}>
            Aliados, contatos, testemunhas e suspeitos que cruzaram o caminho do grupo.
          </p>
        </div>

        {isMestre && (
          <button type="button" className="btn btn-primary" onClick={() => setAberto((v) => !v)}>
            <Plus size={16} /> Novo NPC
          </button>
        )}
      </div>

      {isMestre && aberto && (
        <form onSubmit={criar} className="card stack">
          <strong>Cadastrar NPC</strong>
          <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome (ex: Veríssimo)"
              required
            />
            <input
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              placeholder="Papel (ex: Líder da Ordem, Delegado)"
            />
          </div>
          <UploadImagem
            pasta={`${campanhaId}/npcs`}
            valor={imagemUrl}
            onChange={setImagemUrl}
            label="Retrato do NPC"
          />
          <textarea
            rows={3}
            value={infoPublica}
            onChange={(e) => setInfoPublica(e.target.value)}
            placeholder="O que os jogadores já sabem sobre ele..."
          />
          <textarea
            rows={2}
            value={segredo}
            onChange={(e) => setSegredo(e.target.value)}
            placeholder="Segredo do mestre (jogadores nunca veem)"
          />
          <div className="space-between">
            <label className="row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={visivel}
                onChange={(e) => setVisivel(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span>Visível para jogadores</span>
            </label>
            <div className="row">
              <button type="button" className="btn" onClick={() => setAberto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar NPC</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <span className="muted">Carregando NPCs...</span>
      ) : npcs.length === 0 ? (
        <div className="card muted">Nenhum NPC conhecido ainda.</div>
      ) : (
        <div className="grid-cards">
          {npcs.map((n) => (
            <div key={n.id} className="card stack" style={{ justifyContent: 'space-between' }}>
              <div className="stack" style={{ gap: '0.5rem' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="row">
                    {n.imagem_url && (
                      <img
                        src={n.imagem_url}
                        alt={n.nome}
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>{n.nome}</strong>
                      {n.papel && <div className="muted" style={{ fontSize: '0.8rem' }}>{n.papel}</div>}
                    </div>
                  </div>
                  {isMestre && !n.visivel && <span className="badge badge-warn">Oculto</span>}
                </div>

                {n.info_publica && <p style={{ margin: 0, fontSize: '0.92rem' }}>{n.info_publica}</p>}

                {isMestre && segredos[n.id] && (
                  <div className="card" style={{ background: 'var(--bg)', padding: '0.5rem 0.65rem' }}>
                    <span className="muted" style={{ fontSize: '0.75rem' }}>🔒 Segredo do mestre:</span>
                    <div style={{ fontSize: '0.85rem' }}>{segredos[n.id]}</div>
                  </div>
                )}
              </div>

              {isMestre && (
                <div className="space-between">
                  <button type="button" className="btn btn-sm" onClick={() => alternarVisivel(n)}>
                    {n.visivel ? <Eye size={14} /> : <EyeOff size={14} />}
                    {n.visivel ? 'Visível' : 'Revelar'}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => apagar(n.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
