import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowElbowDownLeft,
  BookOpenText,
  Eye,
  EyeSlash,
  FloppyDisk,
  PencilSimple,
  Scroll,
  Trash,
} from '@phosphor-icons/react';
import { useRealtimeTable } from '../hooks/useRealtimeTable.js';
import { supabase } from '../lib/supabase.js';
import { renderMarkdown } from '../lib/markdown.js';
import { dividirPorMarcador } from '../lib/historia.js';
import { cn } from '../lib/cn.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SkeletonCards from '../components/SkeletonCards.jsx';

export default function Historia({ campanhaId, isMestre }) {
  const { rows: capitulos, setRows: setCapitulos, loading } = useRealtimeTable('capitulos', {
    filtroValor: campanhaId,
    orderBy: 'ordem',
  });

  const [modoEscrever, setModoEscrever] = useState(false);
  const [rascunhos, setRascunhos] = useState({});
  const [salvandoId, setSalvandoId] = useState(null);
  const [capParaApagar, setCapParaApagar] = useState(null);
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    setRascunhos((prev) => {
      const next = {};
      for (const c of capitulos) {
        next[c.id] = prev[c.id] ?? { titulo: c.titulo, conteudo: c.conteudo };
      }
      return next;
    });
  }, [capitulos]);

  function alterarRascunho(id, campo, valor) {
    setRascunhos((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { titulo: '', conteudo: '' }), [campo]: valor },
    }));
  }

  async function salvarCapitulo(cap) {
    if (!supabase) return;
    const draft = rascunhos[cap.id] || { titulo: cap.titulo, conteudo: cap.conteudo };
    const partes = dividirPorMarcador(draft.conteudo);

    setSalvandoId(cap.id);
    try {
      await supabase
        .from('capitulos')
        .update({
          titulo: draft.titulo.trim() || cap.titulo,
          conteudo: partes[0],
        })
        .eq('id', cap.id);

      if (partes.length > 1) {
        const novos = partes.slice(1).map((texto, idx) => ({
          campanha_id: campanhaId,
          titulo: `Capítulo ${capitulos.length + idx + 1}`,
          conteudo: texto,
          publicado: cap.publicado,
          ordem: (cap.ordem ?? capitulos.length) + idx + 1,
        }));
        await supabase.from('capitulos').insert(novos);
        setRascunhos((prev) => ({
          ...prev,
          [cap.id]: { ...draft, conteudo: partes[0] },
        }));
      }
    } finally {
      setSalvandoId(null);
    }
  }

  async function encerrarEContinuar(cap, idx) {
    if (!supabase) return;
    await salvarCapitulo(cap);
    const proxNumero = capitulos.length + 1;
    const { data, error } = await supabase
      .from('capitulos')
      .insert({
        campanha_id: campanhaId,
        titulo: `Capítulo ${proxNumero}`,
        conteudo: '',
        publicado: false,
        ordem: (cap.ordem ?? idx + 1) + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setCapitulos((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [...prev, data]
      );
    }
  }

  async function iniciarPrimeiroCapitulo() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('capitulos')
      .insert({
        campanha_id: campanhaId,
        titulo: 'Capítulo 1',
        conteudo: '',
        publicado: false,
        ordem: 1,
      })
      .select()
      .single();
    if (!error && data) {
      setCapitulos((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [...prev, data]
      );
    }
    setModoEscrever(true);
  }

  async function alternarPublicado(cap) {
    if (!supabase) return;
    const prox = !cap.publicado;
    setCapitulos((prev) =>
      prev.map((c) => (c.id === cap.id ? { ...c, publicado: prox } : c))
    );
    await supabase.from('capitulos').update({ publicado: prox }).eq('id', cap.id);
  }

  async function confirmarApagar() {
    if (!supabase || !capParaApagar) return;
    setApagando(true);
    try {
      const id = capParaApagar.id;
      const { error } = await supabase.from('capitulos').delete().eq('id', id);
      if (!error) {
        setCapitulos((prev) => prev.filter((c) => c.id !== id));
        setCapParaApagar(null);
      }
    } finally {
      setApagando(false);
    }
  }

  function irParaCapitulo(capId) {
    document.getElementById(`cap-${capId}`)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="container stack"
      style={{ gap: '1.25rem' }}
    >
      <div className="space-between" style={{ alignItems: 'flex-end' }}>
        <div>
          <span className="section-kicker">Manuscrito da Campanha</span>
          <h1 style={{ margin: '0.2rem 0 0.2rem' }}>História</h1>
          <p className="muted" style={{ margin: 0 }}>
            {modoEscrever
              ? 'Escreva de forma contínua. Use "Encerrar capítulo" ou digite ---fim--- em uma linha para abrir o próximo.'
              : 'Crônica contínua dos acontecimentos e capítulos da aventura.'}
          </p>
        </div>

        {isMestre && (
          <div className="row">
            {capitulos.length === 0 ? (
              <button type="button" className="btn btn-primary" onClick={iniciarPrimeiroCapitulo}>
                <PencilSimple size={15} weight="duotone" /> Começar a escrever
              </button>
            ) : (
              <button
                type="button"
                className={cn('btn', !modoEscrever && 'btn-primary')}
                onClick={() => setModoEscrever((v) => !v)}
              >
                {modoEscrever ? (
                  <>
                    <BookOpenText size={15} weight="duotone" /> Modo leitura
                  </>
                ) : (
                  <>
                    <PencilSimple size={15} weight="duotone" /> Escrever história
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonCards quantidade={2} altura={160} />
      ) : capitulos.length === 0 ? (
        <EmptyState
          Icon={Scroll}
          titulo="A história ainda não começou"
          descricao={
            isMestre
              ? 'Clique em "Começar a escrever" no topo para abrir o manuscrito da campanha e registrar os capítulos da aventura.'
              : 'O mestre ainda não publicou o primeiro capítulo desta crônica.'
          }
        />
      ) : modoEscrever && isMestre ? (
        <div className="card dossie-papel stack" style={{ gap: '0.5rem' }}>
          {capitulos.map((cap, idx) => {
            const draft = rascunhos[cap.id] || { titulo: cap.titulo, conteudo: cap.conteudo };
            const isUltimo = idx === capitulos.length - 1;
            return (
              <div key={cap.id} className="stack" style={{ gap: '0.65rem' }}>
                <div className="space-between">
                  <input
                    value={draft.titulo}
                    onChange={(e) => alterarRascunho(cap.id, 'titulo', e.target.value)}
                    placeholder={`Título do Capítulo ${idx + 1}`}
                    style={{
                      flex: 1,
                      minWidth: 200,
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.18rem',
                      background: 'transparent',
                      border: '1px dashed var(--border-subtle)',
                    }}
                  />

                  <div className="row" style={{ gap: '0.35rem' }}>
                    <button
                      type="button"
                      className={cn('btn btn-sm', cap.publicado && 'btn-primary')}
                      onClick={() => alternarPublicado(cap)}
                      title={cap.publicado ? 'Visível para jogadores' : 'Rascunho oculto'}
                    >
                      {cap.publicado ? (
                        <Eye size={14} weight="duotone" />
                      ) : (
                        <EyeSlash size={14} weight="light" />
                      )}
                      {cap.publicado ? 'Publicado' : 'Rascunho'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={salvandoId === cap.id}
                      onClick={() => salvarCapitulo(cap)}
                    >
                      <FloppyDisk size={14} weight="duotone" />{' '}
                      {salvandoId === cap.id ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => setCapParaApagar(cap)}
                      title="Apagar capítulo"
                    >
                      <Trash size={14} weight="light" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={Math.max(6, Math.min(18, (draft.conteudo || '').split('\n').length + 2))}
                  value={draft.conteudo}
                  onChange={(e) => alterarRascunho(cap.id, 'conteudo', e.target.value)}
                  placeholder="Continue escrevendo a história aqui... (Dica: digite ---fim--- em uma linha sozinha para dividir em um novo capítulo)"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    lineHeight: 1.72,
                  }}
                />

                <div className="divisor-capitulo">
                  <span>✦ Fim do Capítulo {idx + 1} ✦</span>
                </div>

                {isUltimo && (
                  <div className="row" style={{ justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => encerrarEContinuar(cap, idx)}
                    >
                      <ArrowElbowDownLeft size={14} weight="duotone" /> Encerrar capítulo e continuar no próximo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <article className="card dossie-papel stack" style={{ gap: '0.5rem' }}>
          {capitulos.length > 1 && (
            <nav className="sumario-historia">
              {capitulos.map((cap, idx) => (
                <button
                  key={cap.id}
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => irParaCapitulo(cap.id)}
                >
                  <span className="mono muted">{String(idx + 1).padStart(2, '0')}</span> {cap.titulo}
                </button>
              ))}
            </nav>
          )}

          {capitulos.map((cap, idx) => (
            <section key={cap.id} id={`cap-${cap.id}`} className="stack" style={{ gap: '0.5rem' }}>
              <div className="space-between">
                <h2 style={{ margin: 0 }}>{cap.titulo}</h2>
                {isMestre && !cap.publicado && (
                  <span className="badge badge-warn">Rascunho (oculto)</span>
                )}
              </div>

              <div
                className="prose"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(cap.conteudo || '*Capítulo sem conteúdo ainda.*'),
                }}
              />

              <div className="divisor-capitulo">
                <span>✦ Fim do Capítulo {idx + 1} ✦</span>
              </div>
            </section>
          ))}
        </article>
      )}

      <ConfirmModal
        aberto={Boolean(capParaApagar)}
        titulo="Apagar capítulo"
        mensagem={`Deseja apagar "${capParaApagar?.titulo}"?`}
        textoConfirmar="Sim, apagar"
        carregando={apagando}
        onConfirmar={confirmarApagar}
        onCancelar={() => setCapParaApagar(null)}
      />
    </motion.div>
  );
}
