import { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import UploadImagem from '../components/UploadImagem.jsx';

export default function Pistas({ campanhaId, isMestre }) {
  const { rows: pistas, loading } = useRealtimeTable('pistas', {
    filtroValor: campanhaId,
    orderBy: 'criado_em',
    ascending: false,
  });

  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [ampliada, setAmpliada] = useState(null);

  async function criar(e) {
    e.preventDefault();
    if (!supabase || !titulo.trim()) return;
    await supabase.from('pistas').insert({
      campanha_id: campanhaId,
      titulo: titulo.trim(),
      texto,
      imagem_url: imagemUrl.trim() || null,
      visivel,
      revelada_em: visivel ? new Date().toISOString() : null,
    });
    setTitulo('');
    setTexto('');
    setImagemUrl('');
    setVisivel(false);
    setAberto(false);
  }

  async function alternarVisivel(pista) {
    const prox = !pista.visivel;
    await supabase
      .from('pistas')
      .update({
        visivel: prox,
        revelada_em: prox ? new Date().toISOString() : null,
      })
      .eq('id', pista.id);
  }

  async function apagar(id) {
    if (!confirm('Apagar esta pista?')) return;
    await supabase.from('pistas').delete().eq('id', id);
  }

  return (
    <div className="container stack" style={{ gap: '1.25rem' }}>
      <div className="space-between">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Mural de Pistas & Documentos</h1>
          <p className="muted" style={{ margin: 0 }}>
            Cartas, fotos, recortes e evidências reveladas ao vivo durante a investigação.
          </p>
        </div>

        {isMestre && (
          <button type="button" className="btn btn-primary" onClick={() => setAberto((v) => !v)}>
            <Plus size={16} /> Nova pista
          </button>
        )}
      </div>

      {isMestre && aberto && (
        <form onSubmit={criar} className="card stack">
          <strong>Cadastrar pista / handout</strong>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título (ex: Bilhete ensanguentado)"
            required
          />
          <textarea
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Texto ou transcrição do documento..."
          />
          <UploadImagem
            pasta={`${campanhaId}/pistas`}
            valor={imagemUrl}
            onChange={setImagemUrl}
            label="Imagem do documento / foto (opcional)"
          />
          <div className="space-between">
            <label className="row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={visivel}
                onChange={(e) => setVisivel(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span>Já revelar para os jogadores</span>
            </label>
            <div className="row">
              <button type="button" className="btn" onClick={() => setAberto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar pista</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <span className="muted">Carregando pistas...</span>
      ) : pistas.length === 0 ? (
        <div className="card muted">Nenhuma pista revelada até o momento.</div>
      ) : (
        <div className="grid-cards">
          {pistas.map((p) => (
            <div key={p.id} className="card dossie-papel stack" style={{ justifyContent: 'space-between' }}>
              <div className="stack" style={{ gap: '0.5rem' }}>
                <div className="space-between">
                  <strong style={{ fontSize: '1.05rem' }}>{p.titulo}</strong>
                  {isMestre && !p.visivel && (
                    <span className="badge badge-warn">Oculta</span>
                  )}
                </div>
                {p.imagem_url && (
                  <img
                    src={p.imagem_url}
                    alt={p.titulo}
                    onClick={() => setAmpliada(p)}
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                    }}
                  />
                )}
                {p.texto && (
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.92rem' }}>
                    {p.texto}
                  </p>
                )}
              </div>

              {isMestre && (
                <div className="space-between">
                  <button
                    type="button"
                    className={`btn btn-sm ${p.visivel ? '' : 'btn-primary'}`}
                    onClick={() => alternarVisivel(p)}
                  >
                    {p.visivel ? <Eye size={14} /> : <EyeOff size={14} />}
                    {p.visivel ? 'Revelada' : 'Revelar para todos'}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => apagar(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {ampliada && (
        <div className="modal-backdrop" onClick={() => setAmpliada(null)}>
          <div className="modal-box stack" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>{ampliada.titulo}</h3>
            {ampliada.imagem_url && (
              <img
                src={ampliada.imagem_url}
                alt={ampliada.titulo}
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
              />
            )}
            {ampliada.texto && <p style={{ whiteSpace: 'pre-wrap' }}>{ampliada.texto}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
