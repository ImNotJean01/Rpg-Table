import { motion } from 'motion/react';
import { ArrowSquareOut, Trash } from '@phosphor-icons/react';

const NOMES_CATEGORIA = {
  oficial: 'Oficial',
  loja: 'Loja oficial',
  referencia: 'Referência / Wiki',
  ferramenta: 'Ferramenta',
};

export default function CardLink({ item, podeRemover, onRemover }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.16 }}
      className="card card-interactive stack"
      style={{ justifyContent: 'space-between' }}
    >
      <div className="stack" style={{ gap: '0.45rem' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: '0.35rem' }}>
            <span className="badge">{NOMES_CATEGORIA[item.categoria] || item.categoria}</span>
            <span className="badge">{item.idioma === 'pt' ? 'PT-BR' : 'EN'}</span>
            {item.gratis && <span className="badge badge-success">Grátis</span>}
          </div>
          {podeRemover && (
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => onRemover(item.id)}
              title="Remover link"
            >
              <Trash size={14} weight="light" />
            </button>
          )}
        </div>
        <strong style={{ fontSize: '1.02rem' }}>{item.titulo}</strong>
        {item.descricao && <p className="muted" style={{ margin: 0 }}>{item.descricao}</p>}
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm"
        style={{ alignSelf: 'flex-start' }}
      >
        <ArrowSquareOut size={14} weight="duotone" /> Abrir site
      </a>
    </motion.div>
  );
}
