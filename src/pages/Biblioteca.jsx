import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { listarBibliotecaPorSistema, listarLinksDoSistema } from '../biblioteca/index.js';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import CardLink from '../components/CardLink.jsx';
import FormLink from '../components/FormLink.jsx';

export default function Biblioteca({ campanhaId = null, sistema = null, isMestre = false }) {
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState('todos');

  const { rows: linksCampanha } = useRealtimeTable('links', {
    filtroValor: campanhaId,
    orderBy: 'ordem',
    enabled: Boolean(campanhaId),
  });

  const dentroDeCampanha = Boolean(campanhaId);
  const grupos = listarBibliotecaPorSistema();
  const padraoSistema = sistema ? listarLinksDoSistema(sistema.id) : [];

  function filtrar(itens) {
    if (!busca.trim()) return itens;
    const q = busca.toLowerCase();
    return itens.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        (i.descricao || '').toLowerCase().includes(q)
    );
  }

  async function adicionarLink(dados) {
    const { error } = await supabase.from('links').insert({
      campanha_id: campanhaId,
      ...dados,
      ordem: linksCampanha.length,
    });
    if (error) throw error;
  }

  async function adicionarLote(itens) {
    const rows = itens.map((item, idx) => ({
      campanha_id: campanhaId,
      ...item,
      ordem: linksCampanha.length + idx,
    }));
    const { error } = await supabase.from('links').insert(rows);
    if (error) throw error;
  }

  async function removerLink(id) {
    await supabase.from('links').delete().eq('id', id);
  }

  return (
    <div className="container stack" style={{ gap: '1.25rem' }}>
      <div className="space-between">
        <div>
          {!dentroDeCampanha && (
            <Link to="/" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <ArrowLeft size={14} /> Voltar
            </Link>
          )}
          <h1 style={{ marginBottom: '0.2rem' }}>Biblioteca de Livros e Links</h1>
          <p className="muted" style={{ margin: 0 }}>
            Links oficiais, referências gratuitas em português e ferramentas úteis para jogar.
          </p>
        </div>

        <div className="row" style={{ minWidth: 240 }}>
          <Search size={16} className="muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar link..."
            style={{ width: 220 }}
          />
        </div>
      </div>

      {dentroDeCampanha ? (
        <>
          {isMestre && <FormLink onAdicionar={adicionarLink} onAdicionarLote={adicionarLote} />}

          <div className="stack">
            <h2 style={{ marginBottom: 0 }}>Links desta campanha</h2>
            {filtrar(linksCampanha).length === 0 ? (
              <div className="card muted">Nenhum link próprio adicionado ainda.</div>
            ) : (
              <div className="grid-cards">
                {filtrar(linksCampanha).map((item) => (
                  <CardLink
                    key={item.id}
                    item={item}
                    podeRemover={isMestre}
                    onRemover={removerLink}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="stack">
            <h2 style={{ marginBottom: 0 }}>Livros e referências ({sistema?.nome})</h2>
            <div className="grid-cards">
              {filtrar(padraoSistema).map((item, idx) => (
                <CardLink key={idx} item={item} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="row">
            <button
              type="button"
              className={`btn btn-sm ${aba === 'todos' ? 'btn-primary' : ''}`}
              onClick={() => setAba('todos')}
            >
              Todos
            </button>
            {grupos.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`btn btn-sm ${aba === g.id ? 'btn-primary' : ''}`}
                onClick={() => setAba(g.id)}
              >
                {g.nome}
              </button>
            ))}
          </div>

          {grupos
            .filter((g) => aba === 'todos' || aba === g.id)
            .map((g) => {
              const itens = filtrar(g.links);
              if (itens.length === 0) return null;
              return (
                <div key={g.id} className="stack">
                  <h2 style={{ marginBottom: 0 }}>{g.nome}</h2>
                  <div className="grid-cards">
                    {itens.map((item, idx) => (
                      <CardLink key={idx} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}
