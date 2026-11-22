import { useEffect, useId, useRef } from 'react';
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
  const tituloId = useId();
  const descId = useId();
  const cancelarBtnRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    cancelarBtnRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !carregando) {
        e.stopPropagation();
        onCancelar?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto, carregando, onCancelar]);

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="modal-backdrop"
          onClick={carregando ? undefined : onCancelar}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            aria-describedby={descId}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18 }}
            className="modal-box stack"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-between">
              <div className="row" style={{ gap: '0.5rem' }}>
                {perigoso && (
                  <Warning size={19} weight="duotone" color="#ff8787" aria-hidden="true" />
                )}
                <h3 id={tituloId} style={{ margin: 0 }}>
                  {titulo}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={onCancelar}
                disabled={carregando}
                aria-label="Fechar janela de confirmação"
              >
                <X size={16} weight="light" aria-hidden="true" />
              </button>
            </div>

            <p id={descId} className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
              {mensagem}
            </p>

            <div className="row" style={{ justifyContent: 'flex-end', marginTop: '0.35rem' }}>
              <button
                ref={cancelarBtnRef}
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
