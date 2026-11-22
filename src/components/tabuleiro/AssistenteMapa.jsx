import { useState } from 'react';
import { Lightbulb, MagicWand, MapPin, Stamp, X } from '@phosphor-icons/react';
import { CARIMBOS } from './assistente/carimbos.js';
import { gerarMasmorra } from './assistente/geradorMasmorra.js';
import { AMBIENTES, RECOMENDACOES_POR_AMBIENTE } from './assistente/recomendacoes.js';
import { cn } from '../../lib/cn.js';

export default function AssistenteMapa({
  cena,
  carimboAtivo,
  onSelecionarCarimbo,
  onAplicarTerreno,
  onAlterarAmbiente,
  onCriarPinSugerido,
  onFechar,
}) {
  const [aba, setAba] = useState('recomendacoes');
  const [estilo, setEstilo] = useState('masmorra');
  const [porte, setPorte] = useState('medio');

  const ambienteAtual = cena?.ambiente || 'masmorra';
  const grupos = RECOMENDACOES_POR_AMBIENTE[ambienteAtual] || [];

  function handleGerarPlanta() {
    const { patch } = gerarMasmorra({ estilo, porte });
    onAplicarTerreno(patch);
  }

  return (
    <div
      className="card stack"
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 25,
        width: 340,
        maxWidth: 'calc(100% - 24px)',
        maxHeight: 'calc(100% - 24px)',
        overflowY: 'auto',
        boxShadow: '0 14px 36px rgba(0,0,0,0.65)',
      }}
    >
      <div className="space-between">
        <strong>Assistente de Mapa</strong>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onFechar}>
          <X size={15} weight="light" />
        </button>
      </div>

      <div className="row" style={{ gap: '0.3rem' }}>
        <button
          type="button"
          className={cn('btn btn-sm', aba === 'recomendacoes' && 'btn-primary')}
          onClick={() => setAba('recomendacoes')}
        >
          <Lightbulb size={13} weight="duotone" /> Sugestões
        </button>
        <button
          type="button"
          className={cn('btn btn-sm', aba === 'carimbos' && 'btn-primary')}
          onClick={() => setAba('carimbos')}
        >
          <Stamp size={13} weight="duotone" /> Carimbos
        </button>
        <button
          type="button"
          className={cn('btn btn-sm', aba === 'gerar' && 'btn-primary')}
          onClick={() => setAba('gerar')}
        >
          <MagicWand size={13} weight="duotone" /> Planta
        </button>
      </div>

      {aba === 'recomendacoes' && (
        <div className="stack" style={{ gap: '0.65rem' }}>
          <div>
            <label className="muted" style={{ fontSize: '0.8rem' }}>Ambiente desta cena</label>
            <select
              value={ambienteAtual}
              onChange={(e) => onAlterarAmbiente(e.target.value)}
            >
              {AMBIENTES.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>

          {grupos.map((g) => (
            <div key={g.espaco} className="stack" style={{ gap: '0.35rem' }}>
              <strong style={{ fontSize: '0.86rem', color: 'var(--accent-primary)' }}>{g.espaco}</strong>
              {g.itens.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '0.5rem',
                  }}
                >
                  <div className="space-between">
                    <strong style={{ fontSize: '0.86rem' }}>{item.nome}</strong>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => onCriarPinSugerido(item)}
                    >
                      <MapPin size={12} weight="duotone" /> + Pin
                    </button>
                  </div>
                  <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.78rem' }}>
                    {item.notas}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {aba === 'carimbos' && (
        <div className="stack" style={{ gap: '0.45rem' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            Escolha um carimbo e clique em qualquer ponto do mapa para colocar a sala inteira:
          </span>
          {CARIMBOS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn('btn', carimboAtivo === c.id && 'btn-primary')}
              style={{ justifyContent: 'flex-start', textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start' }}
              onClick={() => onSelecionarCarimbo(carimboAtivo === c.id ? null : c.id)}
            >
              <strong>{c.nome}</strong>
              <span className="muted" style={{ fontSize: '0.76rem' }}>{c.descricao}</span>
            </button>
          ))}
        </div>
      )}

      {aba === 'gerar' && (
        <div className="stack" style={{ gap: '0.6rem' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            Gera um rascunho automático de salas, corredores e portas no terreno para você editar por cima:
          </span>
          <div>
            <label className="muted" style={{ fontSize: '0.8rem' }}>Estilo</label>
            <select value={estilo} onChange={(e) => setEstilo(e.target.value)}>
              <option value="masmorra">Masmorra (pedra e paredes)</option>
              <option value="mansao">Mansão / Base (madeira e paredes)</option>
              <option value="caverna">Caverna (terra e rocha)</option>
            </select>
          </div>
          <div>
            <label className="muted" style={{ fontSize: '0.8rem' }}>Porte</label>
            <select value={porte} onChange={(e) => setPorte(e.target.value)}>
              <option value="pequeno">Pequeno (4 salas)</option>
              <option value="medio">Médio (7 salas)</option>
              <option value="grande">Grande (10 salas)</option>
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleGerarPlanta}>
            <MagicWand size={15} weight="duotone" /> Gerar rascunho no mapa
          </button>
        </div>
      )}
    </div>
  );
}
