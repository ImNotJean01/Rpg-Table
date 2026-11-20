import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  aberto,
  titulo = 'Confirmar ação',
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigoso = true,
  carregando = false,
  onConfirmar,
  onCancelar,
}) {
  if (!aberto) return null;

  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div
        className="modal-box stack"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-between">
          <div className="row" style={{ gap: '0.5rem' }}>
            {perigoso && <AlertTriangle size={18} color="#ff8787" />}
            <h3 style={{ margin: 0 }}>{titulo}</h3>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onCancelar}
            disabled={carregando}
          >
            <X size={16} />
          </button>
        </div>

        <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
          {mensagem}
        </p>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: '0.35rem' }}>
          <button
            type="button"
            className="btn"
            onClick={onCancelar}
            disabled={carregando}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`btn ${perigoso ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirmar}
            disabled={carregando}
          >
            {carregando ? 'Apagando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
