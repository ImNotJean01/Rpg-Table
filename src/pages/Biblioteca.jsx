import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Compass, MagnifyingGlass, X } from '@phosphor-icons/react';
import { listarBibliotecaPorSistema, listarLinksDoSistema } from '../biblioteca/index.js';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import { cn } from '../lib/cn.js';
import { useRpgTheme } from '../context/ThemeContext.tsx';
import CardLink from '../components/CardLink.jsx';
import FormLink from '../components/FormLink.jsx';
import EmptyState from '../components/EmptyState.jsx';

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function Biblioteca({ campanhaId = null, sistema = null, isMestre = false }) {
  const { sistemaId, guiaPath, nomeSistema, syncFromSystem } = useRpgTheme();
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState(() => sistemaId || 'todos');

  const { rows: linksCampanha, setRows: setLinksCampanha } = useRealtimeTable('links', {
    filtroValor: campanhaId,
    orderBy: 'ordem',
    enabled: Boolean(campanhaId),
  });

  const dentroDeCampanha = Boolean(campanhaId);
  const grupos = listarBibliotecaPorSistema();
  const padraoSistema = sistema ? listarLinksDoSistema(sistema.id) : [];

  function filtrar(itens) {
    if (!busca.trim()) return itens;
    const q = normalizarTexto(busca.trim());
    return itens.filter((i) => {
      const tagsTxt = Array.isArray(i.tags) ? i.tags.join(' ') : '';
      return (
        normalizarTexto(i.titulo).includes(q) ||
        normalizarTexto(i.descricao).includes(q) ||
        normalizarTexto(tagsTxt).includes(q)
      );
    });
  }

  function selecionarAba(id) {
    setAba(id);
    if (id !== 'todos' && id !== 'geral') {
      syncFromSystem(id);
    }
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
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (!error) setLinksCampanha((prev) => prev.filter((l) => l.id !== id));
  }

  const gruposVisiveis = grupos
    .filter((g) => aba === 'todos' || aba === g.id)
    .map((g) => ({ ...g, itensFiltrados: filtrar(g.links) }))
    .filter((g) => g.itensFiltrados.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="container stack"
      style={{ gap: '1.35rem' }}
    >
      {!dentroDeCampanha && (
        <div className="space-between" style={{ alignItems: 'center' }}>
          <Link to="/" className="btn btn-sm btn-ghost" style={{ paddingLeft: '0.35rem' }}>
            <ArrowLeft size={15} weight="light" aria-hidden="true" /> Voltar
          </Link>
          <Link to={guiaPath} className="btn btn-sm">
            <Compass size={15} weight="duotone" aria-hidden="true" /> Guia ({nomeSistema.split(' ')[0]})
          </Link>
        </div>
      )}

      <div className="biblioteca-header">
        <div>
          <h1 style={{ margin: '0 0 0.2rem' }}>Biblioteca de Livros e Links</h1>
          <p className="muted" style={{ margin: 0 }}>
            Links oficiais, referências gratuitas em português e ferramentas úteis para jogar.
          </p>
        </div>

        <div className="biblioteca-busca input-with-icon has-left has-right">
          <MagnifyingGlass
            size={16}
            weight="light"
            className="input-icon-left"
            aria-hidden="true"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar livro, site ou tag (ex: gratis, jambo)..."
            aria-label="Buscar na biblioteca"
          />
          {busca && (
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              <X size={15} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {dentroDeCampanha ? (
        <>
          {isMestre && <FormLink onAdicionar={adicionarLink} onAdicionarLote={adicionarLote} />}

          <div className="stack">
            <h2 style={{ marginBottom: 0 }}>Links desta campanha</h2>
            {filtrar(linksCampanha).length === 0 ? (
              <div className="card dossie-papel muted">Nenhum link próprio adicionado ainda.</div>
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

          <hr className="hairline" />

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
          <div className="row" role="tablist" aria-label="Filtrar biblioteca por sistema">
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'todos'}
              className={cn('btn btn-sm', aba === 'todos' && 'btn-primary')}
              onClick={() => selecionarAba('todos')}
            >
              Todos
            </button>
            {grupos.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={aba === g.id}
                className={cn('btn btn-sm', aba === g.id && 'btn-primary')}
                onClick={() => selecionarAba(g.id)}
              >
                {g.nome}
              </button>
            ))}
          </div>

          {gruposVisiveis.length === 0 ? (
            <EmptyState
              Icon={MagnifyingGlass}
              titulo="Nenhum material encontrado"
              descricao={`Não encontramos links para "${busca}" nesta categoria. Tente limpar o filtro ou buscar em "Todos".`}
              acaoLabel="Limpar busca e ver todos"
              onAcao={() => {
                setBusca('');
                setAba('todos');
              }}
            />
          ) : (
            gruposVisiveis.map((g) => (
              <div key={g.id} className="stack">
                <h2 style={{ marginBottom: 0 }}>{g.nome}</h2>
                <div className="grid-cards">
                  {g.itensFiltrados.map((item, idx) => (
                    <CardLink key={idx} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </motion.div>
  );
}
