import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Circle,
  CloudFog,
  Eraser,
  Hand,
  LineSegment,
  PenNib,
  PuzzlePiece,
  Ruler,
  Sparkle,
  Square,
  TextT,
  Wall,
} from '@phosphor-icons/react';
import { TERRENOS } from './texturas.js';
import { cn } from '../../lib/cn.js';

const CORES_DESENHO = ['#eceaf2', '#dc2626', '#7c3aed', '#4ea89e', '#2f9e44', '#c8a96a', '#d97706'];

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
    { id: 'ping', label: 'Ping (Alt+clique)', icone: Sparkle, todos: true },
  ];

  const botoesMestre = [
    { id: 'terreno', label: 'Terreno', icone: Wall },
    { id: 'borracha', label: 'Borracha', icone: Eraser },
    { id: 'caneta', label: 'Caneta', icone: PenNib },
    { id: 'linha', label: 'Linha', icone: LineSegment },
    { id: 'ret', label: 'Retângulo', icone: Square },
    { id: 'circulo', label: 'Círculo', icone: Circle },
    { id: 'texto', label: 'Texto', icone: TextT },
    { id: 'nevoa', label: 'Névoa', icone: CloudFog },
  ];

  const lista = isMestre ? [...botoesBase, ...botoesMestre] : botoesBase;

  return (
    <div
      className="stack"
      style={{
        gap: '0.45rem',
        padding: '0.5rem 1rem',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: '0.3rem' }}>
          {lista.map((b) => {
            const Icon = b.icone;
            const ativa = ferramenta === b.id;
            return (
              <button
                key={b.id}
                type="button"
                className={cn('btn btn-sm', ativa && 'btn-primary')}
                onClick={() => setFerramenta(b.id)}
                title={b.label}
              >
                <Icon size={14} weight={ativa ? 'duotone' : 'light'} /> {b.label}
              </button>
            );
          })}
        </div>

        {isMestre && (
          <div className="row" style={{ gap: '0.3rem' }}>
            <button
              type="button"
              className={cn('btn btn-sm', assistenteAberto && 'btn-primary')}
              onClick={onToggleAssistente}
            >
              <PuzzlePiece size={14} weight="duotone" /> Assistente de Mapa
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={!podeDesfazer}
              onClick={onDesfazer}
              title="Desfazer (Ctrl+Z)"
            >
              <ArrowCounterClockwise size={14} weight="light" />
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={!podeRefazer}
              onClick={onRefazer}
              title="Refazer (Ctrl+Y)"
            >
              <ArrowClockwise size={14} weight="light" />
            </button>
          </div>
        )}
      </div>

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
              className={cn('btn btn-sm mono', pincelTamanho === p.id && 'btn-primary')}
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
              className={cn('btn btn-sm', terrenoTipo === t.id && 'btn-primary')}
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
                border: corDesenho === c ? '3px solid #fff' : '1px solid var(--border-subtle)',
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
            className={cn('btn btn-sm', fogAtivo && 'btn-primary')}
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
