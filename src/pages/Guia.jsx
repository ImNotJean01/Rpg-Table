import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpenText } from '@phosphor-icons/react';
import { GUIAS_DISPONIVEIS } from '../sistemas/guias/index.js';
import { renderMarkdown } from '../lib/markdown.js';
import { cn } from '../lib/cn.js';
import SeletorAtmosfera from '../components/SeletorAtmosfera.jsx';

export default function Guia({ sistemaAtual = null }) {
  const { guiaId } = useParams();

  if (sistemaAtual) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="container stack"
      >
        <div className="space-between" style={{ alignItems: 'flex-end' }}>
          <div>
            <span className="section-kicker">Compêndio de Regras</span>
            <h1 style={{ margin: '0.2rem 0 0' }}>Como funciona: {sistemaAtual.nome}</h1>
          </div>
          <Link to="../biblioteca" className="btn btn-sm">
            <BookOpenText size={14} weight="duotone" /> Ver links do livro
          </Link>
        </div>
        <div
          className="card prose dossie-papel"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(sistemaAtual.guia || '') }}
        />
      </motion.div>
    );
  }

  const ativo =
    GUIAS_DISPONIVEIS.find((g) => g.id === guiaId) || GUIAS_DISPONIVEIS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="container stack"
      style={{ gap: '1.25rem' }}
    >
      <div className="space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <Link
            to="/"
            className="muted"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}
          >
            <ArrowLeft size={14} weight="light" /> Voltar
          </Link>
          <h1 style={{ marginBottom: '0.2rem' }}>Guias dos Sistemas</h1>
          <p className="muted" style={{ margin: 0 }}>
            Resumo rápido em português para aprender como cada livro funciona antes da sessão.
          </p>
        </div>
        <SeletorAtmosfera />
      </div>

      <div className="row">
        {GUIAS_DISPONIVEIS.map((g) => (
          <Link
            key={g.id}
            to={`/guias/${g.id}`}
            className={cn('btn btn-sm', ativo.id === g.id && 'btn-primary')}
          >
            {g.nome}
          </Link>
        ))}
      </div>

      <div
        className="card prose dossie-papel"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(ativo.conteudo) }}
      />
    </motion.div>
  );
}
