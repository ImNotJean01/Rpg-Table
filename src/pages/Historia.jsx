import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import { renderMarkdown } from '../lib/markdown.js';
import EditorMarkdown from '../components/EditorMarkdown.jsx';

export default function Historia({ campanhaId, isMestre }) {
  const { rows: capitulos, loading } = useRealtimeTable('capitulos', {
    filtroValor: campanhaId,
    orderBy: 'ordem',
  });

  const [editando, setEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [publicado, setPublicado] = useState(false);

  function abrirNovo() {
    setEditando('novo');
    setTitulo('');
    setConteudo('');
    setPublicado(false);
  }

  function abrirEditar(cap) {
    setEditando(cap.id);
    setTitulo(cap.titulo);
    setConteudo(cap.conteudo);
    setPublicado(cap.publicado);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!supabase || !titulo.trim()) return;
    if (editando === 'novo') {
      await supabase.from('capitulos').insert({
        campanha_id: campanhaId,
        titulo: titulo.trim(),
        conteudo,
        publicado,
        ordem: capitulos.length + 1,
      });
    } else {
      await supabase
        .from('capitulos')
        .update({ titulo: titulo.trim(), conteudo, publicado })
        .eq('id', editando);
    }
    setEditando(null);
  }

  async function alternarPublicado(cap) {
    await supabase
      .from('capitulos')
      .update({ publicado: !cap.publicado })
      .eq('id', cap.id);
  }

  async function apagar(id) {
    if (!confirm('Apagar este capítulo?')) return;
    await supabase.from('capitulos').delete().eq('id', id);
  }

  return (
    <div className="container stack" style={{ gap: '1.25rem' }}>
      <div className="space-between">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>História da Campanha</h1>
          <p className="muted" style={{ margin: 0 }}>
            Diário dos acontecimentos, prólogos e capítulos da aventura.
          </p>
        </div>
        {isMestre && !editando && (
          <button type="button" className="btn btn-primary" onClick={abrirNovo}>
            <Plus size={16} /> Novo capítulo
          </button>
        )}
      </div>

      {editando && (
        <form onSubmit={salvar} className="card stack">
          <strong>{editando === 'novo' ? 'Novo capítulo' : 'Editar capítulo'}</strong>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do capítulo (ex: Capítulo 1 — A Carta)"
            required
          />
          <EditorMarkdown valor={conteudo} onChange={setConteudo} rows={12} />
          <div className="space-between">
            <label className="row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={publicado}
                onChange={(e) => setPublicado(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span>Publicado (jogadores podem ler)</span>
            </label>
            <div className="row">
              <button type="button" className="btn" onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={15} /> Salvar
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <span className="muted">Carregando capítulos...</span>
      ) : capitulos.length === 0 ? (
        <div className="card muted">Nenhum capítulo publicado ainda.</div>
      ) : (
        <div className="stack" style={{ gap: '1.1rem' }}>
          {capitulos.map((cap, idx) => (
            <article key={cap.id} className="card dossie-papel stack">
              <div className="space-between">
                <div className="row">
                  <span className="badge">#{idx + 1}</span>
                  <h2 style={{ margin: 0 }}>{cap.titulo}</h2>
                  {isMestre && !cap.publicado && (
                    <span className="badge badge-warn">Rascunho (oculto)</span>
                  )}
                </div>

                {isMestre && (
                  <div className="row">
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => alternarPublicado(cap)}
                      title={cap.publicado ? 'Esconder dos jogadores' : 'Publicar'}
                    >
                      {cap.publicado ? <Eye size={14} /> : <EyeOff size={14} />}
                      {cap.publicado ? 'Publicado' : 'Publicar'}
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => abrirEditar(cap)}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => apagar(cap.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(cap.conteudo) }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
