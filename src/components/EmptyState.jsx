import { Compass, Plus } from '@phosphor-icons/react';

export default function EmptyState({
  Icon = Compass,
  titulo,
  descricao,
  acaoLabel,
  onAcao,
}) {
  return (
    <div className="card dossie-papel empty-state" role="status">
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={24} weight="duotone" />
      </div>
      <div className="stack" style={{ gap: '0.25rem', alignItems: 'center' }}>
        <strong style={{ fontSize: '1rem', fontFamily: 'var(--font-display)' }}>
          {titulo}
        </strong>
        {descricao && (
          <p className="muted" style={{ margin: 0, maxWidth: 420 }}>
            {descricao}
          </p>
        )}
      </div>
      {acaoLabel && onAcao && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAcao}>
          <Plus size={15} weight="duotone" aria-hidden="true" />
          <span>{acaoLabel}</span>
        </button>
      )}
    </div>
  );
}
