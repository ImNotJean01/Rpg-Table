import { useEffect, useState } from 'react';
import { Crown, DiceFive, LockKey, LockKeyOpen, Plus, Trash } from '@phosphor-icons/react';
import Condicoes from './Condicoes.jsx';
import UploadImagem from '../UploadImagem.jsx';
import { cn } from '../../lib/cn.js';

export default function FichaDinamica({
  personagem,
  sistema,
  campanhaId,
  membros = [],
  isMestre,
  podeEditar,
  onSalvar,
  onRolar,
}) {
  const [nome, setNome] = useState(personagem.nome || '');
  const [retratoUrl, setRetratoUrl] = useState(personagem.retrato_url || '');
  const [donoId, setDonoId] = useState(personagem.dono_id || '');
  const [condicoes, setCondicoes] = useState(personagem.condicoes || []);
  const [dados, setDados] = useState(() => ({
    atributos: {},
    recursos: {},
    campos: {},
    pericias: {},
    listas: {},
    anotacoes: '',
    controlado_pelo_mestre: false,
    ...(personagem.dados || {}),
  }));
  const [salvando, setSalvando] = useState(false);

  // Sincroniza em tempo real quando o mestre (ou jogador) altera a ficha no banco
  useEffect(() => {
    setNome(personagem.nome || '');
    setRetratoUrl(personagem.retrato_url || '');
    setDonoId(personagem.dono_id || '');
    setCondicoes(personagem.condicoes || []);
    setDados({
      atributos: {},
      recursos: {},
      campos: {},
      pericias: {},
      listas: {},
      anotacoes: '',
      controlado_pelo_mestre: false,
      ...(personagem.dados || {}),
    });
  }, [personagem]);

  const controladoPeloMestre = Boolean(dados.controlado_pelo_mestre);
  const podeEditarEfetivo = isMestre || (podeEditar && !controladoPeloMestre);

  function montarPayload(override = {}) {
    return {
      nome: (override.nome ?? nome).trim() || 'Sem nome',
      retrato_url: (override.retrato_url ?? retratoUrl).trim() || null,
      dono_id: isMestre ? (override.dono_id ?? donoId) || null : personagem.dono_id,
      condicoes: override.condicoes ?? condicoes,
      dados: override.dados ?? dados,
    };
  }

  async function alternarControleMestre() {
    if (!isMestre) return;
    const proxDados = { ...dados, controlado_pelo_mestre: !controladoPeloMestre };
    setDados(proxDados);
    if (personagem.id && personagem.id !== 'novo') {
      await onSalvar(montarPayload({ dados: proxDados }));
    }
  }

  async function handleChangeCondicoes(proxCondicoes) {
    setCondicoes(proxCondicoes);
    if (podeEditarEfetivo && personagem.id && personagem.id !== 'novo') {
      await onSalvar(montarPayload({ condicoes: proxCondicoes }));
    }
  }

  function setAtributo(id, val) {
    setDados((d) => ({
      ...d,
      atributos: { ...d.atributos, [id]: Number(val) || 0 },
    }));
  }

  function setRecurso(id, campo, val) {
    setDados((d) => {
      const atual = d.recursos?.[id] || { atual: 10, max: 10 };
      return {
        ...d,
        recursos: {
          ...d.recursos,
          [id]: { ...atual, [campo]: Number(val) || 0 },
        },
      };
    });
  }

  function ajustarRecurso(id, delta, padrao = 10) {
    setDados((d) => {
      const rec = d.recursos?.[id] || { atual: padrao, max: padrao };
      const prox = Math.max(0, (Number(rec.atual) || 0) + delta);
      return {
        ...d,
        recursos: { ...d.recursos, [id]: { ...rec, atual: prox } },
      };
    });
  }

  function setCampo(id, val) {
    setDados((d) => ({
      ...d,
      campos: { ...d.campos, [id]: val },
    }));
  }

  function setPericia(id, nivelId) {
    setDados((d) => ({
      ...d,
      pericias: { ...d.pericias, [id]: nivelId },
    }));
  }

  function addItemLista(listaId, campos) {
    const novo = {};
    for (const c of campos) novo[c.id] = '';
    setDados((d) => ({
      ...d,
      listas: {
        ...d.listas,
        [listaId]: [...(d.listas?.[listaId] || []), novo],
      },
    }));
  }

  function updateItemLista(listaId, idx, campoId, val) {
    setDados((d) => {
      const arr = [...(d.listas?.[listaId] || [])];
      arr[idx] = { ...arr[idx], [campoId]: val };
      return { ...d, listas: { ...d.listas, [listaId]: arr } };
    });
  }

  function removeItemLista(listaId, idx) {
    setDados((d) => {
      const arr = (d.listas?.[listaId] || []).filter((_, i) => i !== idx);
      return { ...d, listas: { ...d.listas, [listaId]: arr } };
    });
  }

  async function salvarTudo(e) {
    e?.preventDefault();
    if (!podeEditarEfetivo) return;
    setSalvando(true);
    try {
      await onSalvar(montarPayload());
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvarTudo} className="stack">
      {/* Barra de controle direto do Mestre */}
      {(isMestre || controladoPeloMestre) && (
        <div
          className="space-between"
          style={{
            padding: '0.6rem 0.85rem',
            borderRadius: 8,
            background: controladoPeloMestre ? 'var(--accent-soft)' : 'var(--bg-base)',
            border: `1px solid ${controladoPeloMestre ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
          }}
        >
          <div className="row" style={{ gap: '0.45rem' }}>
            <Crown size={16} weight="duotone" color="var(--accent-primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              {controladoPeloMestre
                ? isMestre
                  ? 'Você está no controle exclusivo desta ficha (edição travada para o jogador).'
                  : 'Seu personagem está sob controle do Mestre no momento (acompanhe ao vivo).'
                : 'Mestre: você pode editar esta ficha livremente ou assumir o controle exclusivo.'}
            </span>
          </div>

          {isMestre && (
            <button
              type="button"
              className={cn('btn btn-sm', controladoPeloMestre && 'btn-primary')}
              onClick={alternarControleMestre}
            >
              {controladoPeloMestre ? (
                <>
                  <LockKeyOpen size={14} weight="duotone" /> Devolver controle ao player
                </>
              ) : (
                <>
                  <LockKey size={14} weight="duotone" /> Assumir controle do personagem
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="space-between">
        <div className="row" style={{ flex: 1 }}>
          {retratoUrl && (
            <img
              src={retratoUrl}
              alt={nome}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--accent-primary)',
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="muted">Nome do personagem</label>
            <input
              value={nome}
              disabled={!podeEditarEfetivo}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
        </div>

        {podeEditarEfetivo && (
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar ficha'}
          </button>
        )}
      </div>

      {podeEditarEfetivo && (
        <UploadImagem
          pasta={`${campanhaId}/retratos`}
          valor={retratoUrl}
          onChange={setRetratoUrl}
          label="Retrato do personagem"
        />
      )}

      {isMestre && (
        <div>
          <label className="muted">Jogador dono da ficha (quem pode editar e mover o pin)</label>
          <select value={donoId || ''} onChange={(e) => setDonoId(e.target.value)}>
            <option value="">— Nenhum (NPC/Livre) —</option>
            {membros.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.nome} ({m.papel})
              </option>
            ))}
          </select>
        </div>
      )}

      <Condicoes
        opcoes={sistema.condicoes || []}
        ativas={condicoes}
        podeEditar={podeEditarEfetivo}
        onChange={handleChangeCondicoes}
      />

      {/* Recursos (PV, PE, SAN...) */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {(sistema.recursos || []).map((rec) => {
          const val = dados.recursos?.[rec.id] || {
            atual: rec.padrao ?? 10,
            max: rec.padrao ?? 10,
          };
          const pct = val.max > 0 ? Math.min(100, Math.max(0, (val.atual / val.max) * 100)) : 0;
          return (
            <div key={rec.id} className="card stack" style={{ gap: '0.45rem', padding: '0.8rem' }}>
              <div className="space-between">
                <strong style={{ fontSize: '0.88rem' }}>{rec.nome}</strong>
                <span className="muted mono" style={{ fontSize: '0.86rem' }}>
                  {val.atual} / {val.max}
                </span>
              </div>
              <div className="recurso-bar">
                <div className="recurso-fill" style={{ width: `${pct}%`, background: rec.cor }} />
              </div>
              {podeEditarEfetivo && (
                <div className="row" style={{ gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm mono"
                    onClick={() => ajustarRecurso(rec.id, -1, rec.padrao)}
                  >
                    −1
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm mono"
                    onClick={() => ajustarRecurso(rec.id, +1, rec.padrao)}
                  >
                    +1
                  </button>
                  <input
                    className="mono"
                    type="number"
                    value={val.atual}
                    onChange={(e) => setRecurso(rec.id, 'atual', e.target.value)}
                    style={{ width: 64, padding: '0.25rem 0.4rem' }}
                    title="Atual"
                  />
                  <span className="muted mono">/</span>
                  <input
                    className="mono"
                    type="number"
                    value={val.max}
                    onChange={(e) => setRecurso(rec.id, 'max', e.target.value)}
                    style={{ width: 64, padding: '0.25rem 0.4rem' }}
                    title="Máximo"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Atributos */}
      <div>
        <span className="section-kicker" style={{ marginBottom: '0.35rem' }}>
          Atributos — clique no dado para rolar
        </span>
        <div
          className="grid-cards"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', marginTop: '0.35rem' }}
        >
          {(sistema.atributos || []).map((atr) => {
            const val = dados.atributos?.[atr.id] ?? 1;
            return (
              <div
                key={atr.id}
                className="card stack"
                style={{ alignItems: 'center', gap: '0.38rem', padding: '0.7rem' }}
              >
                <strong className="mono" style={{ letterSpacing: '0.08em' }}>{atr.sigla}</strong>
                <input
                  className="mono"
                  type="number"
                  value={val}
                  disabled={!podeEditarEfetivo}
                  onChange={(e) => setAtributo(atr.id, e.target.value)}
                  style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.15rem' }}
                />
                {onRolar && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onRolar(`${nome} — ${atr.nome}`, sistema.teste(val, 0))}
                    title={`Rolar ${atr.nome}`}
                  >
                    <DiceFive size={14} weight="duotone" /> Rolar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Campos do cabeçalho */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {(sistema.campos || []).map((c) => {
          const val = dados.campos?.[c.id] ?? c.padrao ?? '';
          return (
            <div key={c.id}>
              <label className="muted">
                {c.nome} {c.sufixo ? `(${c.sufixo})` : ''}
              </label>
              {c.tipo === 'select' ? (
                <select
                  value={val}
                  disabled={!podeEditarEfetivo}
                  onChange={(e) => setCampo(c.id, e.target.value)}
                >
                  <option value="">—</option>
                  {(c.opcoes || []).map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={c.tipo === 'numero' ? 'mono' : ''}
                  type={c.tipo === 'numero' ? 'number' : 'text'}
                  value={val}
                  disabled={!podeEditarEfetivo}
                  onChange={(e) => setCampo(c.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Perícias */}
      {sistema.pericias?.lista?.length > 0 && (
        <div className="card stack">
          <strong>Perícias</strong>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.5rem' }}>
            {sistema.pericias.lista.map((per) => {
              const nivelId = dados.pericias?.[per.id] || sistema.pericias.niveis[0].id;
              const nivel =
                sistema.pericias.niveis.find((n) => n.id === nivelId) ||
                sistema.pericias.niveis[0];
              const valAtr = dados.atributos?.[per.atributo] ?? 1;

              return (
                <div
                  key={per.id}
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '0.38rem 0.55rem',
                  }}
                >
                  <div style={{ minWidth: 95 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 500 }}>{per.nome}</div>
                    <div className="muted mono" style={{ fontSize: '0.72rem' }}>
                      {per.atributo.toUpperCase()} +{nivel.bonus}
                    </div>
                  </div>
                  <div className="row" style={{ gap: '0.25rem' }}>
                    <select
                      value={nivelId}
                      disabled={!podeEditarEfetivo}
                      onChange={(e) => setPericia(per.id, e.target.value)}
                      style={{ width: 'auto', padding: '0.2rem 0.35rem', fontSize: '0.78rem' }}
                    >
                      {sistema.pericias.niveis.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.nome} (+{n.bonus})
                        </option>
                      ))}
                    </select>
                    {onRolar && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() =>
                          onRolar(`${nome} — ${per.nome}`, sistema.teste(valAtr, nivel.bonus))
                        }
                        title={`Rolar ${per.nome}`}
                      >
                        <DiceFive size={13} weight="duotone" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listas repetíveis (Rituais, Inventário...) */}
      {(sistema.listas || []).map((lista) => {
        const itens = dados.listas?.[lista.id] || [];
        return (
          <div key={lista.id} className="card stack">
            <div className="space-between">
              <strong>{lista.nome}</strong>
              {podeEditarEfetivo && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => addItemLista(lista.id, lista.campos)}
                >
                  <Plus size={14} weight="duotone" /> Adicionar
                </button>
              )}
            </div>
            {itens.length === 0 ? (
              <span className="muted">Nenhum item cadastrado.</span>
            ) : (
              <div className="stack" style={{ gap: '0.5rem' }}>
                {itens.map((item, idx) => (
                  <div
                    key={idx}
                    className="row"
                    style={{
                      background: 'var(--bg-base)',
                      padding: '0.5rem',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {lista.campos.map((campo) =>
                      campo.tipo === 'select' ? (
                        <select
                          key={campo.id}
                          value={item[campo.id] || ''}
                          disabled={!podeEditarEfetivo}
                          onChange={(e) =>
                            updateItemLista(lista.id, idx, campo.id, e.target.value)
                          }
                          style={{ flex: 1, minWidth: 110 }}
                        >
                          <option value="">{campo.nome}</option>
                          {(campo.opcoes || []).map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          key={campo.id}
                          value={item[campo.id] || ''}
                          disabled={!podeEditarEfetivo}
                          placeholder={campo.nome}
                          onChange={(e) =>
                            updateItemLista(lista.id, idx, campo.id, e.target.value)
                          }
                          style={{ flex: 1, minWidth: 110 }}
                        />
                      )
                    )}
                    {podeEditarEfetivo && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeItemLista(lista.id, idx)}
                      >
                        <Trash size={14} weight="light" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Anotações */}
      <div>
        <label className="muted">Anotações do personagem</label>
        <textarea
          rows={4}
          value={dados.anotacoes || ''}
          disabled={!podeEditarEfetivo}
          onChange={(e) => setDados((d) => ({ ...d, anotacoes: e.target.value }))}
          placeholder="História pessoal, contatos, objetivos..."
        />
      </div>
    </form>
  );
}
