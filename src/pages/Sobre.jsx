import { useState } from 'react';
import { motion } from 'motion/react';
import { FloppyDisk, PencilSimple } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase.js';
import { renderMarkdown } from '../lib/markdown.js';
import EditorMarkdown from '../components/EditorMarkdown.jsx';

export default function Sobre({ campanha, setCampanha, isMestre }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(campanha?.sobre || '');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!supabase || !campanha) return;
    setSalvando(true);
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .update({ sobre: texto })
        .eq('id', campanha.id)
        .select()
        .single();
      if (!error && data) {
        setCampanha(data);
        setEditando(false);
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="container stack"
    >
      <div className="space-between" style={{ alignItems: 'flex-end' }}>
        <div>
          <span className="section-kicker">Prólogo &amp; Combinados</span>
          <h1 style={{ margin: '0.2rem 0 0.2rem' }}>Sobre a Campanha</h1>
          <p className="muted" style={{ margin: 0 }}>
            Premissa, regras da casa, criação de personagem e horários da mesa.
          </p>
        </div>

        {isMestre && !editando && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setTexto(campanha?.sobre || '');
              setEditando(true);
            }}
          >
            <PencilSimple size={14} weight="duotone" /> Editar apresentação
          </button>
        )}
      </div>

      {editando ? (
        <div className="card stack">
          <EditorMarkdown valor={texto} onChange={setTexto} rows={14} />
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => setEditando(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>
              <FloppyDisk size={15} weight="duotone" /> {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="card prose dossie-papel"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(
              campanha?.sobre || '*O mestre ainda não escreveu a apresentação desta campanha.*'
            ),
          }}
        />
      )}
    </motion.div>
  );
}
