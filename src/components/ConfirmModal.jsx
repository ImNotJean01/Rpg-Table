import { AnimatePresence, motion } from 'motion/react';
import { Warning, X } from '@phosphor-icons/react';
import { cn } from '../lib/cn.js';

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
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="modal-backdrop"
          onClick={onCancelar}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="modal-box stack"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-between">
              <div className="row" style={{ gap: '0.5rem' }}>
                {perigoso && <Warning size={19} weight="duotone" color="#ff8787" />}
                <h3 style={{ margin: 0 }}>{titulo}</h3>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={onCancelar}
                disabled={carregando}
              >
                <X size={16} weight="light" />
              </button>
            </div>

            <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
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
                className={cn('btn', perigoso ? 'btn-danger' : 'btn-primary')}
                onClick={onConfirmar}
                disabled={carregando}
              >
                {carregando ? 'Apagando...' : textoConfirmar}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
