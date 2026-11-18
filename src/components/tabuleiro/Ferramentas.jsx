import {
  BrickWall,
  Circle,
  CloudFog,
  Eraser,
  Hand,
  Minus,
  Pen,
  Puzzle,
  Redo2,
  Ruler,
  Sparkles,
  Square,
  Type,
  Undo2,
} from 'lucide-react';
import { TERRENOS } from './texturas.js';

const CORES_DESENHO = ['#eceaf2', '#c92a42', '#7c4dff', '#1c7ed6', '#2b8a3e', '#d4a017', '#e67700'];

export default function Ferramentas({
  isMestre,
  ferramenta,
  setFerramenta,
  terrenoTipo,
  setTerrenoTipo,
  pincelTamanho,
  setPincelTamanho,
  corDesenho,
  setCorDesenho,
  fogAtivo,
  onToggleFog,
  assistenteAberto,
  onToggleAssistente,
  podeDesfazer,
  podeRefazer,
  onDesfazer,
  onRefazer,
}) {
  const botoesBase = [
    { id: 'mao', label: 'Mover / Pins', icone: Hand, todos: true },
    { id: 'regua', label: 'Régua', icone: Ruler, todos: true },
    { id: 'ping', label: 'Ping (Alt+clique)', icone: Sparkles, todos: true },
  ];

  const botoesMestre = [
    { id: 'terreno', label: 'Terreno', icone: BrickWall },
    { id: 'borracha', label: 'Borracha', icone: Eraser },
    { id: 'caneta', label: 'Caneta', icone: Pen },
    { id: 'linha', label: 'Linha', icone: Minus },
    { id: 'ret', label: 'Retângulo', icone: Square },
    { id: 'circulo', label: 'Círculo', icone: Circle },
    { id: 'texto', label: 'Texto', icone: Type },
    { id: 'nevoa', label: 'Névoa', icone: CloudFog },
  ];

  const lista = isMestre ? [...botoesBase, ...botoesMestre] : botoesBase;

  return (
    <div
      className="stack"
      style={{
        gap: '0.45rem',
        padding: '0.5rem 1rem',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: '0.3rem' }}>
          {lista.map((b) => {
            const Icon = b.icone;
            return (
              <button
                key={b.id}
                type="button"
                className={`btn btn-sm ${ferramenta === b.id ? 'btn-primary' : ''}`}
                onClick={() => setFerramenta(b.id)}
                title={b.label}
              >
                <Icon size={14} /> {b.label}
              </button>
            );
          })}
        </div>

        {isMestre && (
          <div className="row" style={{ gap: '0.3rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${assistenteAberto ? 'btn-primary' : ''}`}
              onClick={onToggleAssistente}
            >
              <Puzzle size={14} /> Assistente de Mapa
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={!podeDesfazer}
              onClick={onDesfazer}
              title="Desfazer (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={!podeRefazer}
              onClick={onRefazer}
              title="Refazer (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Sub-barra contextual da ferramenta */}
      {isMestre && ferramenta === 'terreno' && (
        <div className="row" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>Pincel:</span>
          {[
            { id: 1, label: '1×1' },
            { id: 3, label: '3×3' },
            { id: 'rect', label: 'Retângulo' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn btn-sm ${pincelTamanho === p.id ? 'btn-primary' : ''}`}
              onClick={() => setPincelTamanho(p.id)}
            >
              {p.label}
            </button>
          ))}
          <span className="muted" style={{ fontSize: '0.8rem', marginLeft: '0.4rem' }}>Material:</span>
          {TERRENOS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`btn btn-sm ${terrenoTipo === t.id ? 'btn-primary' : ''}`}
              onClick={() => setTerrenoTipo(t.id)}
              style={{ gap: '0.35rem' }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  background: t.cor,
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              />
              {t.nome}
            </button>
          ))}
        </div>
      )}

      {isMestre && ['caneta', 'linha', 'ret', 'circulo', 'texto'].includes(ferramenta) && (
        <div className="row" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>Cor do traço:</span>
          {CORES_DESENHO.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCorDesenho(c)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: c,
                border: corDesenho === c ? '3px solid #fff' : '1px solid var(--border)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {isMestre && ferramenta === 'nevoa' && (
        <div className="row" style={{ gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${fogAtivo ? 'btn-primary' : ''}`}
            onClick={onToggleFog}
          >
            {fogAtivo ? 'Névoa LIGADA (jogadores só veem área revelada)' : 'Névoa DESLIGADA'}
          </button>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            Arraste para <strong>revelar</strong> · Segure <code>Shift</code> + arraste para <strong>esconder</strong>.
          </span>
        </div>
      )}
    </div>
  );
}
