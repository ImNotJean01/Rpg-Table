import { useState } from 'react';
import { Lightbulb, MapPin, Sparkles, Stamp, Wand2, X } from 'lucide-react';
import { CARIMBOS } from './assistente/carimbos.js';
import { gerarMasmorra } from './assistente/geradorMasmorra.js';
import { AMBIENTES, RECOMENDACOES_POR_AMBIENTE } from './assistente/recomendacoes.js';
import {
  gerarMapaComGemini,
  lerChaveGeminiLocal,
  salvarChaveGeminiLocal,
} from '../../lib/geminiMapa.js';
import { supabase } from '../../lib/supabase.js';

const EXEMPLOS_GEMINI = [
  'Mansão abandonada com hall, biblioteca secreta, 2 cultistas e armadilha na entrada',
  'Masmorra alagada com ponte de madeira, câmara do chefe e 1 baú escondido',
  'Taverna de beira de estrada com balcão, lareira, saída dos fundos e contato suspeito',
  'Laboratório secreto com 3 salas de contenção, alarme e criatura solta',
];

export default function AssistenteMapa({
  campanhaId,
  sistemaNome,
  cena,
  carimboAtivo,
  onSelecionarCarimbo,
  onAplicarTerreno,
  onAplicarMapaGemini,
  onAlterarAmbiente,
  onCriarPinSugerido,
  onFechar,
}) {
  const [aba, setAba] = useState('gemini');
  const [estilo, setEstilo] = useState('masmorra');
  const [porte, setPorte] = useState('medio');

  // Estado Gemini
  const [promptGemini, setPromptGemini] = useState('');
  const [chaveLocal, setChaveLocal] = useState(() => lerChaveGeminiLocal());
  const [mostrarChave, setMostrarChave] = useState(() => !lerChaveGeminiLocal());
  const [limparAntes, setLimparAntes] = useState(true);
  const [gerandoGemini, setGerandoGemini] = useState(false);
  const [erroGemini, setErroGemini] = useState('');

  const ambienteAtual = cena?.ambiente || 'masmorra';
  const grupos = RECOMENDACOES_POR_AMBIENTE[ambienteAtual] || [];

  function handleGerarPlanta() {
    const { patch } = gerarMasmorra({ estilo, porte });
    onAplicarTerreno(patch);
  }

  async function handleGerarGemini(e) {
    e.preventDefault();
    if (!promptGemini.trim()) return;
    setErroGemini('');
    setGerandoGemini(true);
    try {
      salvarChaveGeminiLocal(chaveLocal);
      const resultado = await gerarMapaComGemini({
        supabase,
        campanhaId,
        prompt: promptGemini.trim(),
        sistemaNome,
        chaveLocal,
      });
      await onAplicarMapaGemini(resultado, limparAntes);
    } catch (err) {
      setErroGemini(err.message || 'Erro ao gerar mapa.');
    } finally {
      setGerandoGemini(false);
    }
  }

  return (
    <div
      className="card stack"
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 25,
        width: 360,
        maxWidth: 'calc(100% - 24px)',
        maxHeight: 'calc(100% - 24px)',
        overflowY: 'auto',
        boxShadow: '0 14px 36px rgba(0,0,0,0.65)',
      }}
    >
      <div className="space-between">
        <strong>Assistente de Mapa</strong>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onFechar}>
          <X size={15} />
        </button>
      </div>

      <div className="row" style={{ gap: '0.28rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${aba === 'gemini' ? 'btn-primary' : ''}`}
          onClick={() => setAba('gemini')}
        >
          <Sparkles size={13} /> Gemini
        </button>
        <button
          type="button"
          className={`btn btn-sm ${aba === 'recomendacoes' ? 'btn-primary' : ''}`}
          onClick={() => setAba('recomendacoes')}
        >
          <Lightbulb size={13} /> Sugestões
        </button>
        <button
          type="button"
          className={`btn btn-sm ${aba === 'carimbos' ? 'btn-primary' : ''}`}
          onClick={() => setAba('carimbos')}
        >
          <Stamp size={13} /> Carimbos
        </button>
        <button
          type="button"
          className={`btn btn-sm ${aba === 'gerar' ? 'btn-primary' : ''}`}
          onClick={() => setAba('gerar')}
        >
          <Wand2 size={13} /> Planta
        </button>
      </div>

      {aba === 'gemini' && (
        <form onSubmit={handleGerarGemini} className="stack" style={{ gap: '0.55rem' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            Descreva o lugar e o Gemini monta as salas, portas, rótulos, pins e notas secretas (100% Free Tier, sem cobrança).
          </span>

          <textarea
            rows={3}
            value={promptGemini}
            onChange={(e) => setPromptGemini(e.target.value)}
            placeholder="Ex: Mansão abandonada com porão, 3 cultistas e armadilha na entrada..."
            required
          />

          <div className="row" style={{ gap: '0.3rem' }}>
            {EXEMPLOS_GEMINI.map((ex, i) => (
              <button
                key={i}
                type="button"
                className="badge"
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => setPromptGemini(ex)}
              >
                {ex.split(' com ')[0]}
              </button>
            ))}
          </div>

          <label className="row" style={{ cursor: 'pointer', fontSize: '0.82rem' }}>
            <input
              type="checkbox"
              checked={limparAntes}
              onChange={(e) => setLimparAntes(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <span>Limpar terreno atual antes de aplicar</span>
          </label>

          <div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setMostrarChave((v) => !v)}
              style={{ paddingLeft: 0 }}
            >
              {mostrarChave ? '▾ Chave gratuita do Google AI Studio (opcional)' : '▸ Configurar chave do Gemini'}
            </button>
            {mostrarChave && (
              <div className="stack" style={{ gap: '0.25rem', marginTop: '0.25rem' }}>
                <input
                  type="password"
                  value={chaveLocal}
                  onChange={(e) => setChaveLocal(e.target.value)}
                  placeholder="AIza... (fica só neste navegador)"
                />
                <span className="muted" style={{ fontSize: '0.73rem' }}>
                  Deixe vazio se já publicou a Edge Function no Supabase. Crie grátis sem cartão em{' '}
                  <code>aistudio.google.com</code>.
                </span>
              </div>
            )}
          </div>

          {erroGemini && (
            <div className="badge badge-accent" style={{ borderRadius: 8, padding: '0.45rem 0.65rem' }}>
              {erroGemini}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={gerandoGemini}>
            <Sparkles size={15} /> {gerandoGemini ? 'Montando mapa...' : 'Gerar mapa com Gemini'}
          </button>
        </form>
      )}

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
              <strong style={{ fontSize: '0.86rem', color: 'var(--accent)' }}>{g.espaco}</strong>
              {g.itens.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
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
                      <MapPin size={12} /> + Pin
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
              className={`btn ${carimboAtivo === c.id ? 'btn-primary' : ''}`}
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
            <Wand2 size={15} /> Gerar rascunho no mapa
          </button>
        </div>
      )}
    </div>
  );
}
