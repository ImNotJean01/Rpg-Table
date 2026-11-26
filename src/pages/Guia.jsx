import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpenText } from '@phosphor-icons/react';
import { GUIAS_DISPONIVEIS } from '../sistemas/guias/index.js';
import { renderMarkdown } from '../lib/markdown.js';
import { useRpgTheme } from '../context/ThemeContext.tsx';
import SeletorAtmosfera from '../components/SeletorAtmosfera.jsx';

export default function Guia({ sistemaAtual = null }) {
  const { guiaId } = useParams();
  const navigate = useNavigate();
  const { syncFromSystem } = useRpgTheme();

  const ativo =
    GUIAS_DISPONIVEIS.find((g) => g.id === guiaId) || GUIAS_DISPONIVEIS[0];

  useEffect(() => {
    if (!sistemaAtual && ativo?.id) {
      syncFromSystem(ativo.id);
    }
  }, [sistemaAtual, ativo?.id, syncFromSystem]);

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
            <BookOpenText size={15} weight="duotone" aria-hidden="true" /> Ver links do livro
          </Link>
        </div>
        <article className="card dossie-papel">
          <div
            className="prose prose-leitura"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(sistemaAtual.guia || '').replace(/<h1/g, '<h2').replace(/<\/h1>/g, '</h2>'),
            }}
          />
        </article>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="container stack"
      style={{ gap: '1.25rem' }}
    >
      <div className="space-between" style={{ alignItems: 'center' }}>
        <Link to="/" className="btn btn-sm btn-ghost" style={{ paddingLeft: '0.35rem' }}>
          <ArrowLeft size={15} weight="light" aria-hidden="true" /> Voltar
        </Link>
        <Link to="/biblioteca" className="btn btn-sm">
          <BookOpenText size={15} weight="duotone" aria-hidden="true" /> Biblioteca ({ativo.nome.split(' ')[0]})
        </Link>
      </div>

      <div className="space-between" style={{ alignItems: 'flex-end', gap: '1rem' }}>
        <div>
          <span className="section-kicker" style={{ display: 'block' }}>Compêndio de Regras</span>
          <h1 style={{ margin: '0.2rem 0 0.2rem' }}>{ativo.nome}</h1>
          <p className="muted" style={{ margin: 0 }}>
            Resumo rápido em português para aprender como o sistema funciona antes da sessão.
          </p>
        </div>
        <SeletorAtmosfera
          onSelect={(_theme, nextSistemaId) => navigate(`/guias/${nextSistemaId}`)}
        />
      </div>

      <article className="card dossie-papel stack" style={{ gap: '1.25rem' }}>
        <div
          className="prose prose-leitura"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(ativo.conteudo).replace(/<h1/g, '<h2').replace(/<\/h1>/g, '</h2>'),
          }}
        />
        <hr className="hairline" />
        <div className="space-between">
          <span className="muted">Quer ver livros oficiais, fichas e referências de {ativo.nome}?</span>
          <Link to="/biblioteca" className="btn btn-sm btn-primary">
            <BookOpenText size={15} weight="duotone" aria-hidden="true" /> Abrir Biblioteca
          </Link>
        </div>
      </article>
    </motion.div>
  );
}
