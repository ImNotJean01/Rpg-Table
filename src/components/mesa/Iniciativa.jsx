import { useState } from 'react';
import { ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

export default function Iniciativa({
  campanhaId,
  lista = [],
  estadoMesa,
  personagens = [],
  criaturas = [],
  isMestre,
}) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState(10);

  const ordenada = [...lista].sort((a, b) => b.valor - a.valor || a.ordem - b.ordem);
  const rodada = estadoMesa?.rodada || 1;
  const turnoAtual = estadoMesa?.turno_atual || null;

  async function adicionar(e) {
    e.preventDefault();
    if (!nome.trim() || !supabase) return;
    await supabase.from('iniciativa').insert({
      campanha_id: campanhaId,
      nome: nome.trim(),
      valor: Number(valor) || 0,
      ordem: lista.length,
    });
    setNome('');
  }

  async function adicionarDaLista(entidade, tipo) {
    if (!supabase) return;
    await supabase.from('iniciativa').insert({
      campanha_id: campanhaId,
      nome: entidade.nome,
      valor: 10,
      personagem_id: tipo === 'personagem' ? entidade.id : null,
      criatura_id: tipo === 'criatura' ? entidade.id : null,
      ordem: lista.length,
    });
  }

  async function remover(id) {
    if (!supabase) return;
    await supabase.from('iniciativa').delete().eq('id', id);
  }

  async function proximoTurno() {
    if (!supabase || ordenada.length === 0) return;
    const idx = ordenada.findIndex((i) => i.id === turnoAtual);
    let proxIdx = idx + 1;
    let proxRodada = rodada;
    if (proxIdx >= ordenada.length) {
      proxIdx = 0;
      proxRodada = rodada + 1;
    }
    await supabase.from('estado_mesa').upsert({
      campanha_id: campanhaId,
      rodada: proxRodada,
      turno_atual: ordenada[proxIdx].id,
    });
  }

  async function resetarRodada() {
    if (!supabase) return;
    await supabase.from('estado_mesa').upsert({
      campanha_id: campanhaId,
      rodada: 1,
      turno_atual: ordenada[0]?.id || null,
    });
  }

  function buscarCondicoes(item) {
    if (item.personagem_id) {
      return personagens.find((p) => p.id === item.personagem_id)?.condicoes || [];
    }
    if (item.criatura_id) {
      return criaturas.find((c) => c.id === item.criatura_id)?.condicoes || [];
    }
    return [];
  }

  return (
    <div className="stack" style={{ padding: '0.85rem', borderBottom: '1px solid var(--border)' }}>
      <div className="space-between">
        <strong>Iniciativa — Rodada {rodada}</strong>
        {isMestre && (
          <div className="row" style={{ gap: '0.3rem' }}>
            <button type="button" className="btn btn-sm btn-primary" onClick={proximoTurno} title="Próximo turno">
              <ChevronRight size={14} /> Próximo
            </button>
            <button type="button" className="btn btn-sm" onClick={resetarRodada} title="Reiniciar para rodada 1">
              <RotateCcw size={13} />
            </button>
          </div>
        )}
      </div>

      {ordenada.length === 0 ? (
        <span className="muted">Nenhum participante na iniciativa.</span>
      ) : (
        <div className="stack" style={{ gap: '0.35rem' }}>
          {ordenada.map((item) => {
            const ativo = item.id === turnoAtual;
            const conds = buscarCondicoes(item);
            return (
              <div
                key={item.id}
                className="row"
                style={{
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.55rem',
                  borderRadius: 8,
                  background: ativo ? 'rgba(201, 42, 66, 0.2)' : 'var(--bg)',
                  border: `1px solid ${ativo ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: ativo ? 700 : 500, fontSize: '0.9rem' }}>
                    {ativo ? '▶ ' : ''}
                    {item.nome}
                  </div>
                  {conds.length > 0 && (
                    <div className="row" style={{ gap: '0.2rem', marginTop: '0.15rem' }}>
                      {conds.map((c) => (
                        <span key={c} className="badge badge-warn" style={{ fontSize: '0.68rem', padding: '0.05rem 0.35rem' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="row" style={{ gap: '0.35rem' }}>
                  <span className="badge">{item.valor}</span>
                  {isMestre && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => remover(item.id)}
                      style={{ padding: '0.15rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isMestre && (
        <div className="stack" style={{ gap: '0.4rem' }}>
          <form onSubmit={adicionar} className="row" style={{ gap: '0.35rem' }}>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome"
              style={{ flex: 1, minWidth: 90, padding: '0.35rem 0.5rem' }}
            />
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={{ width: 58, padding: '0.35rem 0.4rem' }}
              title="Valor de iniciativa"
            />
            <button type="submit" className="btn btn-sm">
              <Plus size={14} />
            </button>
          </form>

          {(personagens.length > 0 || criaturas.length > 0) && (
            <select
              value=""
              onChange={(e) => {
                const [tipo, id] = e.target.value.split(':');
                const listaOrigem = tipo === 'personagem' ? personagens : criaturas;
                const found = listaOrigem.find((x) => x.id === id);
                if (found) adicionarDaLista(found, tipo);
              }}
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
            >
              <option value="">+ Puxar personagem ou criatura...</option>
              {personagens.map((p) => (
                <option key={p.id} value={`personagem:${p.id}`}>
                  Personagem: {p.nome}
                </option>
              ))}
              {criaturas.map((c) => (
                <option key={c.id} value={`criatura:${c.id}`}>
                  Criatura: {c.nome}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
