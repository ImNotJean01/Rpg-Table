import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, GridFour, Image, MapPin, Plus } from '@phosphor-icons/react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import PalcoCompleto from '../components/tabuleiro/PalcoCompleto.jsx';
import Ferramentas from '../components/tabuleiro/Ferramentas.jsx';
import AssistenteMapa from '../components/tabuleiro/AssistenteMapa.jsx';
import PainelPin from '../components/tabuleiro/PainelPin.jsx';
import Iniciativa from '../components/mesa/Iniciativa.jsx';
import RoladorDados from '../components/mesa/RoladorDados.jsx';
import UploadImagem from '../components/UploadImagem.jsx';
import { aplicarCarimbo } from '../components/tabuleiro/assistente/carimbos.js';
import { criarHistorico } from '../components/tabuleiro/historico.js';

export default function Tabuleiro({
  campanhaId,
  sistema,
  userId,
  autorNome = 'Jogador',
  isMestre,
}) {
  const { rows: cenas, setRows: setCenas } = useRealtimeTable('cenas', {
    filtroValor: campanhaId,
    orderBy: 'ordem',
  });
  const { rows: personagens } = useRealtimeTable('personagens', {
    filtroValor: campanhaId,
    orderBy: 'criado_em',
  });
  const { rows: criaturas } = useRealtimeTable('criaturas', {
    filtroValor: campanhaId,
    orderBy: 'criado_em',
  });
  const { rows: iniciativa } = useRealtimeTable('iniciativa', {
    filtroValor: campanhaId,
    orderBy: 'ordem',
  });
  const { rows: estados } = useRealtimeTable('estado_mesa', {
    filtroValor: campanhaId,
  });
  const { rows: rolagens } = useRealtimeTable('rolagens', {
    filtroValor: campanhaId,
    orderBy: 'criado_em',
    ascending: false,
  });

  const [cenaSelecionadaId, setCenaSelecionadaId] = useState(null);
  const [pinEditando, setPinEditando] = useState(null);
  const [configFundoAberto, setConfigFundoAberto] = useState(false);

  // Ferramentas Fase 2
  const [ferramenta, setFerramenta] = useState('mao');
  const [terrenoTipo, setTerrenoTipo] = useState('pedra');
  const [pincelTamanho, setPincelTamanho] = useState(1);
  const [corDesenho, setCorDesenho] = useState('#eceaf2');
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [carimboAtivo, setCarimboAtivo] = useState(null);
  const [pingsAtivos, setPingsAtivos] = useState([]);
  const [, setVersaoHist] = useState(0);

  const historico = useMemo(() => criarHistorico(40), [cenaSelecionadaId]);
  const pingsTimers = useRef({});

  useEffect(() => {
    if (cenas.length === 0) {
      setCenaSelecionadaId(null);
      return;
    }
    const existe = cenas.some((c) => c.id === cenaSelecionadaId);
    if (!existe) {
      const ativa = cenas.find((c) => c.ativa) || cenas[0];
      setCenaSelecionadaId(ativa.id);
    }
  }, [cenas, cenaSelecionadaId]);

  const cenaAtual = cenas.find((c) => c.id === cenaSelecionadaId) || null;

  const { rows: pins, setRows: setPins } = useRealtimeTable('pins', {
    filtroColuna: 'cena_id',
    filtroValor: cenaAtual?.id,
    enabled: Boolean(cenaAtual?.id),
  });

  const { rows: desenhos, setRows: setDesenhos } = useRealtimeTable('desenhos', {
    filtroColuna: 'cena_id',
    filtroValor: cenaAtual?.id,
    orderBy: 'criado_em',
    enabled: Boolean(cenaAtual?.id),
  });

  // Assina pings ao vivo e remove visualmente após 3 segundos
  useEffect(() => {
    if (!supabase || !cenaAtual?.id) return;
    const ch = supabase
      .channel(`pings:${cenaAtual.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pings_mapa',
          filter: `cena_id=eq.${cenaAtual.id}`,
        },
        (payload) => {
          const novo = payload.new;
          setPingsAtivos((prev) => [...prev, novo]);
          pingsTimers.current[novo.id] = setTimeout(() => {
            setPingsAtivos((prev) => prev.filter((p) => p.id !== novo.id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      for (const t of Object.values(pingsTimers.current)) clearTimeout(t);
      pingsTimers.current = {};
      supabase.removeChannel(ch);
    };
  }, [cenaAtual?.id]);

  // Atalhos Ctrl+Z / Ctrl+Y
  useEffect(() => {
    if (!isMestre) return;
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        historico.desfazer().then(() => setVersaoHist((v) => v + 1));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        historico.refazer().then(() => setVersaoHist((v) => v + 1));
      } else if (e.key === 'Escape') {
        setCarimboAtivo(null);
        setFerramenta('mao');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMestre, historico]);

  async function criarCena() {
    if (!supabase) return;
    const nome = prompt('Nome da nova cena:', `Cena ${cenas.length + 1}`);
    if (!nome) return;
    const { data, error } = await supabase
      .from('cenas')
      .insert({
        campanha_id: campanhaId,
        nome: nome.trim(),
        ordem: cenas.length,
        ativa: cenas.length === 0,
      })
      .select()
      .single();
    if (!error && data) setCenaSelecionadaId(data.id);
  }

  async function ativarCena(cenaId) {
    if (!supabase) return;
    await supabase.rpc('ativar_cena', { p_cena: cenaId });
  }

  async function adicionarPin() {
    if (!supabase || !cenaAtual) return;
    const { data, error } = await supabase
      .from('pins')
      .insert({
        campanha_id: campanhaId,
        cena_id: cenaAtual.id,
        nome: 'Novo Pin',
        x: 140,
        y: 140,
      })
      .select()
      .single();
    if (!error && data) setPinEditando(data);
  }

  async function criarPinSugerido(item) {
    if (!supabase || !cenaAtual) return;
    const { data, error } = await supabase
      .from('pins')
      .insert({
        campanha_id: campanhaId,
        cena_id: cenaAtual.id,
        nome: item.nome,
        icone: item.icone,
        cor: item.cor,
        tamanho: item.tamanho || 'medio',
        x: 140,
        y: 140,
        visivel: false,
      })
      .select()
      .single();

    if (!error && data && item.notas) {
      await supabase.from('pins_notas').upsert({ pin_id: data.id, notas: item.notas });
    }
  }

  async function moverPin(pinId, x, y) {
    setPins((prev) => prev.map((p) => (p.id === pinId ? { ...p, x, y } : p)));
    if (!supabase) return;
    await supabase.from('pins').update({ x, y }).eq('id', pinId);
  }

  async function salvarPin(pinId, campos, notas) {
    if (!supabase) return;
    await supabase.from('pins').update(campos).eq('id', pinId);
    if (isMestre) {
      await supabase.from('pins_notas').upsert({ pin_id: pinId, notas });
    }
  }

  async function apagarPin(pinId) {
    if (!supabase) return;
    const { error } = await supabase.from('pins').delete().eq('id', pinId);
    if (!error) setPins((prev) => prev.filter((p) => p.id !== pinId));
  }

  async function atualizarCena(patch) {
    if (!supabase || !cenaAtual) return;
    await supabase.from('cenas').update(patch).eq('id', cenaAtual.id);
  }

  async function enviarPatchTerreno(patch, registrar = true) {
    if (!supabase || !cenaAtual) return;
    const anterior = {};
    const atual = cenaAtual.terreno || {};
    for (const k of Object.keys(patch)) {
      anterior[k] = atual[k] ?? null;
    }

    // Atualização otimista local
    setCenas((prev) =>
      prev.map((c) => {
        if (c.id !== cenaAtual.id) return c;
        const next = { ...(c.terreno || {}) };
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) delete next[k];
          else next[k] = v;
        }
        return { ...c, terreno: next };
      })
    );

    await supabase.rpc('atualizar_terreno', { p_cena: cenaAtual.id, p_patch: patch });

    if (registrar) {
      historico.registrar({
        desfazer: () => enviarPatchTerreno(anterior, false),
        refazer: () => enviarPatchTerreno(patch, false),
      });
      setVersaoHist((v) => v + 1);
    }
  }

  async function enviarPatchNevoa(patch) {
    if (!supabase || !cenaAtual) return;
    setCenas((prev) =>
      prev.map((c) => {
        if (c.id !== cenaAtual.id) return c;
        const next = { ...(c.nevoa || {}) };
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) delete next[k];
          else next[k] = true;
        }
        return { ...c, nevoa: next };
      })
    );
    await supabase.rpc('atualizar_nevoa', { p_cena: cenaAtual.id, p_patch: patch });
  }

  async function criarDesenho(tipo, dados) {
    if (!supabase || !cenaAtual) return;
    const { data } = await supabase
      .from('desenhos')
      .insert({
        cena_id: cenaAtual.id,
        campanha_id: campanhaId,
        tipo,
        dados,
      })
      .select()
      .single();

    if (data) {
      historico.registrar({
        desfazer: async () => {
          await supabase.from('desenhos').delete().eq('id', data.id);
        },
        refazer: async () => {
          await supabase.from('desenhos').insert({
            id: data.id,
            cena_id: cenaAtual.id,
            campanha_id: campanhaId,
            tipo,
            dados,
          });
        },
      });
      setVersaoHist((v) => v + 1);
    }
  }

  async function apagarDesenho(id) {
    if (!supabase) return;
    const { error } = await supabase.from('desenhos').delete().eq('id', id);
    if (!error) setDesenhos((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleAplicarCarimbo(carimboId, gx, gy) {
    const patch = aplicarCarimbo(carimboId, gx, gy);
    await enviarPatchTerreno(patch);
    setCarimboAtivo(null);
  }

  async function enviarPing(x, y) {
    if (!supabase || !cenaAtual) return;
    await supabase.from('pings_mapa').insert({
      cena_id: cenaAtual.id,
      campanha_id: campanhaId,
      autor_nome: autorNome,
      x,
      y,
    });
  }

  async function limparCenaCompleta() {
    if (!supabase || !cenaAtual) return;
    if (!confirm('Limpar terreno, desenhos e pins de cenário desta cena? (Pins dos jogadores serão mantidos.)')) return;
    const limparPatch = {};
    for (const k of Object.keys(cenaAtual.terreno || {})) limparPatch[k] = null;
    await Promise.all([
      Object.keys(limparPatch).length ? enviarPatchTerreno(limparPatch) : Promise.resolve(),
      supabase.from('desenhos').delete().eq('cena_id', cenaAtual.id),
      supabase.from('pins').delete().eq('cena_id', cenaAtual.id).is('personagem_id', null),
    ]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Barra superior de cenas */}
      <div
        className="row"
        style={{
          padding: '0.5rem 1rem',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
          justifyContent: 'space-between',
        }}
      >
        <div className="row">
          {isMestre ? (
            <>
              <select
                value={cenaAtual?.id || ''}
                onChange={(e) => setCenaSelecionadaId(e.target.value)}
                style={{ width: 'auto', padding: '0.35rem 0.6rem' }}
              >
                {cenas.length === 0 && <option value="">Sem cenas ainda</option>}
                {cenas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ativa ? '● ' : ''}{c.nome}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-sm" onClick={criarCena}>
                <Plus size={14} /> Nova cena
              </button>
              {cenaAtual && (
                <button
                  type="button"
                  className={`btn btn-sm ${cenaAtual.ativa ? 'btn-primary' : ''}`}
                  onClick={() => ativarCena(cenaAtual.id)}
                >
                  <Eye size={14} /> {cenaAtual.ativa ? 'Ativa para jogadores' : 'Mostrar para jogadores'}
                </button>
              )}
            </>
          ) : (
            <strong>{cenaAtual ? `Cena: ${cenaAtual.nome}` : 'Aguardando o mestre ativar uma cena...'}</strong>
          )}
        </div>

        {isMestre && cenaAtual && (
          <div className="row">
            <button type="button" className="btn btn-sm btn-primary" onClick={adicionarPin}>
              <MapPin size={14} /> Novo Pin
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setConfigFundoAberto((v) => !v)}
            >
              <Image size={14} /> Fundo & Grade
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={limparCenaCompleta}
              title="Limpar terreno, textos e pins de cenário"
            >
              Limpar mapa
            </button>
          </div>
        )}
      </div>

      {cenaAtual && (
        <Ferramentas
          isMestre={isMestre}
          ferramenta={ferramenta}
          setFerramenta={(f) => {
            setFerramenta(f);
            setCarimboAtivo(null);
          }}
          terrenoTipo={terrenoTipo}
          setTerrenoTipo={setTerrenoTipo}
          pincelTamanho={pincelTamanho}
          setPincelTamanho={setPincelTamanho}
          corDesenho={corDesenho}
          setCorDesenho={setCorDesenho}
          fogAtivo={Boolean(cenaAtual.fog_ativo)}
          onToggleFog={() => atualizarCena({ fog_ativo: !cenaAtual.fog_ativo })}
          assistenteAberto={assistenteAberto}
          onToggleAssistente={() => setAssistenteAberto((v) => !v)}
          podeDesfazer={historico.podeDesfazer()}
          podeRefazer={historico.podeRefazer()}
          onDesfazer={() => historico.desfazer().then(() => setVersaoHist((v) => v + 1))}
          onRefazer={() => historico.refazer().then(() => setVersaoHist((v) => v + 1))}
        />
      )}

      {isMestre && configFundoAberto && cenaAtual && (
        <div
          className="row"
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <UploadImagem
              pasta={`${campanhaId}/mapas`}
              valor={cenaAtual.fundo_url}
              onChange={(url) => atualizarCena({ fundo_url: url || null })}
              label="Imagem de fundo do mapa"
            />
          </div>
          <div style={{ width: 110 }}>
            <label className="muted">Grade (px)</label>
            <input
              type="number"
              min={30}
              max={160}
              value={cenaAtual.grade || 70}
              onChange={(e) => atualizarCena({ grade: Number(e.target.value) || 70 })}
            />
          </div>
          <button
            type="button"
            className={`btn btn-sm ${cenaAtual.mostrar_grade !== false ? 'btn-primary' : ''}`}
            onClick={() => atualizarCena({ mostrar_grade: !(cenaAtual.mostrar_grade !== false) })}
          >
            <GridFour size={14} weight="duotone" /> Grade
          </button>
        </div>
      )}

      <div className="mesa-layout">
        <div className="mesa-palco">
          {cenaAtual ? (
            <>
              <PalcoCompleto
                cena={cenaAtual}
                pins={pins}
                desenhos={desenhos}
                pings={pingsAtivos}
                personagens={personagens}
                criaturas={criaturas}
                userId={userId}
                isMestre={isMestre}
                ferramenta={ferramenta}
                terrenoTipo={terrenoTipo}
                pincelTamanho={pincelTamanho}
                corDesenho={corDesenho}
                carimboAtivo={carimboAtivo}
                onMoverPin={moverPin}
                onClicarPin={setPinEditando}
                onPatchTerreno={enviarPatchTerreno}
                onPatchNevoa={enviarPatchNevoa}
                onCriarDesenho={criarDesenho}
                onApagarDesenho={apagarDesenho}
                onAplicarCarimbo={handleAplicarCarimbo}
                onEnviarPing={enviarPing}
              />
              {isMestre && assistenteAberto && (
                <AssistenteMapa
                  cena={cenaAtual}
                  carimboAtivo={carimboAtivo}
                  onSelecionarCarimbo={setCarimboAtivo}
                  onAplicarTerreno={(patch) => enviarPatchTerreno(patch)}
                  onAlterarAmbiente={(ambiente) => atualizarCena({ ambiente })}
                  onCriarPinSugerido={criarPinSugerido}
                  onFechar={() => setAssistenteAberto(false)}
                />
              )}
            </>
          ) : (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: '1rem' }}>
              <div className="card stack" style={{ textAlign: 'center', maxWidth: 380 }}>
                <strong>Nenhuma cena ativa</strong>
                <span className="muted">
                  {isMestre
                    ? 'Clique em "+ Nova cena" ali em cima para criar o seu primeiro mapa.'
                    : 'O mestre ainda está preparando o tabuleiro.'}
                </span>
              </div>
            </div>
          )}
        </div>

        <aside className="mesa-sidebar">
          <Iniciativa
            campanhaId={campanhaId}
            lista={iniciativa}
            estadoMesa={estados[0]}
            personagens={personagens}
            criaturas={criaturas}
            isMestre={isMestre}
          />
          <RoladorDados
            campanhaId={campanhaId}
            rolagens={rolagens}
            isMestre={isMestre}
          />
        </aside>
      </div>

      {pinEditando && (
        <PainelPin
          pin={pinEditando}
          personagens={personagens}
          criaturas={criaturas}
          tamanhos={sistema.tamanhos || []}
          isMestre={isMestre}
          onFechar={() => setPinEditando(null)}
          onSalvar={salvarPin}
          onApagar={apagarPin}
        />
      )}
    </div>
  );
}
