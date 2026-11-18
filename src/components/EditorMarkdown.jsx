import { useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { renderMarkdown } from '../lib/markdown.js';

export default function EditorMarkdown({ valor, onChange, rows = 10, placeholder = 'Escreva em Markdown...' }) {
  const [aba, setAba] = useState('editar');

  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="row">
        <button
          type="button"
          className={`btn btn-sm ${aba === 'editar' ? 'btn-primary' : ''}`}
          onClick={() => setAba('editar')}
        >
          <Pencil size={14} /> Editar
        </button>
        <button
          type="button"
          className={`btn btn-sm ${aba === 'preview' ? 'btn-primary' : ''}`}
          onClick={() => setAba('preview')}
        >
          <Eye size={14} /> Pré-visualizar
        </button>
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          Dica: use <code># Título</code>, <code>**negrito**</code>, <code>*itálico*</code>
        </span>
      </div>

      {aba === 'editar' ? (
        <textarea
          rows={rows}
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div
          className="card prose"
          style={{ minHeight: rows * 20 }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(valor || '*Nada escrito ainda.*') }}
        />
      )}
    </div>
  );
}
