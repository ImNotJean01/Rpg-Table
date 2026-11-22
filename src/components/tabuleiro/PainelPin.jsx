import { useEffect, useState } from 'react';
import { Trash, X } from '@phosphor-icons/react';
import { supabase } from '../../lib/supabase.js';
import { ICONES_PIN } from './utils.js';

const CORES = ['#c92a42', '#7c4dff', '#1c7ed6', '#2b8a3e', '#d4a017', '#e67700', '#868e96'];

export default function PainelPin({
  pin,
  personagens = [],
  criaturas = [],
  tamanhos = [],
  isMestre,
  onFechar,
  onSalvar,
  onApagar,
}) {
  const [nome, setNome] = useState(pin.nome || '');
  const [icone, setIcone] = useState(pin.icone || 'guerreiro');
  const [cor, setCor] = useState(pin.cor || '#c92a42');
  const [tamanho, setTamanho] = useState(pin.tamanho || 'medio');
  const [personagemId, setPersonagemId] = useState(pin.personagem_id || '');
  const [criaturaId, setCriaturaId] = useState(pin.criatura_id || '');
  const [usarRetrato, setUsarRetrato] = useState(Boolean(pin.usar_retrato));
  const [visivel, setVisivel] = useState(pin.visivel !== false);
  const [notas, setNotas] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!isMestre || !supabase || !pin.id) return;
    supabase
      .from('pins_notas')
      .select('notas')
      .eq('pin_id', pin.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setNotas(data.notas || '');
      });
  }, [isMestre, pin.id]);

  const vinculado =
    personagens.find((p) => p.id === (personagemId || pin.personagem_id)) ||
    criaturas.find((c) => c.id === (criaturaId || pin.criatura_id));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isMestre) return;
    setSalvando(true);
    try {
      await onSalvar(
        pin.id,
        {
          nome: nome.trim() || 'Pin',
          icone,
          cor,
          tamanho,
          personagem_id: personagemId || null,
          criatura_id: criaturaId || null,
          usar_retrato: usarRetrato,
          visivel,
        },
        notas
      );
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-box stack" onClick={(e) => e.stopPropagation()}>
        <div className="space-between">
          <h3 style={{ margin: 0 }}>{isMestre ? 'Editar Pin' : pin.nome}</h3>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onFechar}>
            <X size={16} />
          </button>
        </div>

        {vinculado && (
          <div className="card" style={{ background: 'var(--bg)', padding: '0.65rem' }}>
            <div className="space-between">
              <strong>Ficha vinculada: {vinculado.nome}</strong>
              {vinculado.condicoes?.length > 0 && (
                <div className="row" style={{ gap: '0.25rem' }}>
                  {vinculado.condicoes.map((c) => (
                    <span key={c} className="badge badge-warn">{c}</span>
                  ))}
                </div>
              )}
            </div>
            {vinculado.dados?.recursos?.pv && (
              <div className="muted" style={{ marginTop: '0.25rem' }}>
                PV: {vinculado.dados.recursos.pv.atual} / {vinculado.dados.recursos.pv.max}
              </div>
            )}
          </div>
        )}

        {!isMestre ? (
          <p className="muted">Você pode arrastar seu próprio pin no tabuleiro.</p>
        ) : (
          <form onSubmit={handleSubmit} className="stack">
            <div>
              <label className="muted">Nome no mapa</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div>
              <label className="muted">Ícone</label>
              <div className="row" style={{ gap: '0.35rem', marginTop: '0.25rem' }}>
                {ICONES_PIN.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    className={`btn btn-sm ${icone === ic.id ? 'btn-primary' : ''}`}
                    onClick={() => setIcone(ic.id)}
                    title={ic.label}
                  >
                    {ic.simbolo} {ic.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <label className="muted">Cor</label>
                <div className="row" style={{ gap: '0.35rem', marginTop: '0.25rem' }}>
                  {CORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCor(c)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: c,
                        border: cor === c ? '3px solid #fff' : '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ minWidth: 160 }}>
                <label className="muted">Tamanho</label>
                <select value={tamanho} onChange={(e) => setTamanho(e.target.value)}>
                  {tamanhos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.escala}×{t.escala})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label className="muted">Vincular a Personagem</label>
                <select
                  value={personagemId}
                  onChange={(e) => {
                    setPersonagemId(e.target.value);
                    if (e.target.value) setCriaturaId('');
                  }}
                >
                  <option value="">— Nenhum —</option>
                  {personagens.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="muted">Vincular a Criatura</label>
                <select
                  value={criaturaId}
                  onChange={(e) => {
                    setCriaturaId(e.target.value);
                    if (e.target.value) setPersonagemId('');
                  }}
                >
                  <option value="">— Nenhuma —</option>
                  {criaturas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'space-between' }}>
              <label className="row" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={usarRetrato}
                  onChange={(e) => setUsarRetrato(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>Usar retrato da ficha no pin</span>
              </label>

              <label className="row" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visivel}
                  onChange={(e) => setVisivel(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>Visível para jogadores</span>
              </label>
            </div>

            <div>
              <label className="muted">Anotações secretas do mestre (jogadores nunca veem)</label>
              <textarea
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Armadilha DT 15, senha da porta, tática do monstro..."
              />
            </div>

            <div className="space-between">
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => {
                  onApagar(pin.id);
                  onFechar();
                }}
              >
                <Trash size={14} weight="light" /> Apagar pin
              </button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar pin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
