import { useState } from 'react';
import { ListPlus, Plus } from '@phosphor-icons/react';

export function parseLoteLinks(texto) {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linha) => {
      const [titulo, url, descricao = ''] = linha.split('|').map((p) => p.trim());
      return {
        titulo: titulo || 'Documento',
        url: url || '',
        descricao,
        categoria: 'referencia',
        idioma: 'pt',
        gratis: false,
      };
    })
    .filter((item) => item.url.startsWith('https://'));
}

export default function FormLink({ onAdicionar, onAdicionarLote }) {
  const [modoLote, setModoLote] = useState(false);
  const [lote, setLote] = useState('');
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('https://');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('referencia');
  const [idioma, setIdioma] = useState('pt');
  const [gratis, setGratis] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (!url.startsWith('https://')) {
      setErro('O link precisa começar com https://');
      return;
    }
    setSalvando(true);
    try {
      await onAdicionar({
        titulo: titulo.trim(),
        url: url.trim(),
        descricao: descricao.trim(),
        categoria,
        idioma,
        gratis,
      });
      setTitulo('');
      setUrl('https://');
      setDescricao('');
    } catch (err) {
      setErro(err.message || 'Erro ao adicionar link.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleLote(e) {
    e.preventDefault();
    setErro('');
    const itens = parseLoteLinks(lote);
    if (itens.length === 0) {
      setErro('Nenhum link válido encontrado. Use o formato: Título | https://...');
      return;
    }
    setSalvando(true);
    try {
      await onAdicionarLote(itens);
      setLote('');
      setModoLote(false);
    } catch (err) {
      setErro(err.message || 'Erro ao importar links.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card stack">
      <div className="space-between">
        <strong>Adicionar links privados da campanha</strong>
        {onAdicionarLote && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setModoLote((v) => !v);
              setErro('');
            }}
          >
            <ListPlus size={14} weight="duotone" />{' '}
            {modoLote ? 'Adicionar um por vez' : 'Importar vários de uma vez'}
          </button>
        )}
      </div>

      {modoLote ? (
        <form onSubmit={handleLote} className="stack">
          <span className="muted" style={{ fontSize: '0.84rem' }}>
            Cole um por linha no formato: <code>Título | https://... | Descrição (opcional)</code>
          </span>
          <textarea
            rows={6}
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            placeholder="Livro de Regras | https://drive.google.com/... | PDF da mesa"
            required
          />
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={salvando}>
              <ListPlus size={15} weight="duotone" /> {salvando ? 'Importando...' : 'Importar lista'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="stack">
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label className="muted">Título</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Playlist da Mansão"
                required
              />
            </div>
            <div>
              <label className="muted">URL (https://...)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="muted">Categoria</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="referencia">Referência / Wiki</option>
                <option value="ferramenta">Ferramenta / Playlist</option>
                <option value="oficial">Oficial</option>
                <option value="loja">Loja oficial</option>
              </select>
            </div>
            <div>
              <label className="muted">Idioma</label>
              <select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
                <option value="pt">Português (PT-BR)</option>
                <option value="en">Inglês (EN)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="muted">Descrição curta</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Para que serve este link..."
            />
          </div>

          <div className="space-between">
            <label className="row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={gratis}
                onChange={(e) => setGratis(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span className="muted">Acesso gratuito</span>
            </label>

            <button type="submit" className="btn btn-primary btn-sm" disabled={salvando}>
              <Plus size={15} weight="duotone" /> {salvando ? 'Salvando...' : 'Adicionar link'}
            </button>
          </div>
        </form>
      )}

      {erro && <span className="badge badge-accent">{erro}</span>}
    </div>
  );
}
