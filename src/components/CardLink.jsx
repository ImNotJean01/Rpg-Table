import { ExternalLink, Trash2 } from 'lucide-react';

const NOMES_CATEGORIA = {
  oficial: 'Oficial',
  loja: 'Loja oficial',
  referencia: 'Referência / Wiki',
  ferramenta: 'Ferramenta',
};

export default function CardLink({ item, podeRemover, onRemover }) {
  return (
    <div className="card stack" style={{ justifyContent: 'space-between' }}>
      <div className="stack" style={{ gap: '0.4rem' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: '0.35rem' }}>
            <span className="badge">{NOMES_CATEGORIA[item.categoria] || item.categoria}</span>
            <span className="badge">{item.idioma === 'pt' ? '🇧🇷 PT-BR' : '🇺🇸 EN'}</span>
            {item.gratis && <span className="badge badge-success">Grátis</span>}
          </div>
          {podeRemover && (
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => onRemover(item.id)}
              title="Remover link"
            >
              <Trash2 size={14} />
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
        <ExternalLink size={14} /> Abrir site
      </a>
    </div>
  );
}
