import { useState } from 'react';
import { Eye, PencilSimple } from '@phosphor-icons/react';
import { renderMarkdown } from '../lib/markdown.js';
import { cn } from '../lib/cn.js';

export default function EditorMarkdown({ valor, onChange, rows = 10, placeholder = 'Escreva em Markdown...' }) {
  const [aba, setAba] = useState('editar');

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div className="row">
        <button
          type="button"
          className={cn('btn btn-sm', aba === 'editar' && 'btn-primary')}
          onClick={() => setAba('editar')}
        >
          <PencilSimple size={14} weight="duotone" /> Editar
        </button>
        <button
          type="button"
          className={cn('btn btn-sm', aba === 'preview' && 'btn-primary')}
          onClick={() => setAba('preview')}
        >
          <Eye size={14} weight="duotone" /> Pré-visualizar
        </button>
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          Suporta <code># Título</code>, <code>**negrito**</code>, <code>*itálico*</code>
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
          className="card dossie-papel prose"
          style={{ minHeight: rows * 20 }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(valor || '*Nada escrito ainda.*') }}
        />
      )}
    </div>
  );
}
