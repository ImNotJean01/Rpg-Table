import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { GUIAS_DISPONIVEIS } from '../sistemas/guias/index.js';
import { renderMarkdown } from '../lib/markdown.js';

export default function Guia({ sistemaAtual = null }) {
  const { guiaId } = useParams();

  if (sistemaAtual) {
    return (
      <div className="container stack">
        <div className="space-between">
          <h1 style={{ margin: 0 }}>Como funciona: {sistemaAtual.nome}</h1>
          <Link to="../biblioteca" className="btn btn-sm">
            <BookOpen size={14} /> Ver links do livro
          </Link>
        </div>
        <div
          className="card prose dossie-papel"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(sistemaAtual.guia || '') }}
        />
      </div>
    );
  }

  const ativo =
    GUIAS_DISPONIVEIS.find((g) => g.id === guiaId) || GUIAS_DISPONIVEIS[0];

  return (
    <div className="container stack" style={{ gap: '1.25rem' }}>
      <div>
        <Link to="/" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
          <ArrowLeft size={14} /> Voltar
        </Link>
        <h1 style={{ marginBottom: '0.2rem' }}>Guias dos Sistemas</h1>
        <p className="muted" style={{ margin: 0 }}>
          Resumo rápido em português para aprender como cada livro funciona antes da sessão.
        </p>
      </div>

      <div className="row">
        {GUIAS_DISPONIVEIS.map((g) => (
          <Link
            key={g.id}
            to={`/guias/${g.id}`}
            className={`btn btn-sm ${ativo.id === g.id ? 'btn-primary' : ''}`}
          >
            {g.nome}
          </Link>
        ))}
      </div>

      <div
        className="card prose dossie-papel"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(ativo.conteudo) }}
      />
    </div>
  );
}
