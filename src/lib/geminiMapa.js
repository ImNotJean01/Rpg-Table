import { GoogleGenAI } from '@google/genai';
import { MAPA_TERRENOS } from '../components/tabuleiro/texturas.js';
import { ESCALAS_TAMANHO, ICONES_PIN } from '../components/tabuleiro/utils.js';

const CHAVE_LOCAL_STORAGE = 'mesa_rpg_gemini_key';

const ICONES_VALIDOS = new Set(ICONES_PIN.map((i) => i.id));
const TAMANHOS_VALIDOS = new Set(Object.keys(ESCALAS_TAMANHO));

export function lerChaveGeminiLocal() {
  try {
    return localStorage.getItem(CHAVE_LOCAL_STORAGE) || '';
  } catch {
    return '';
  }
}

export function salvarChaveGeminiLocal(chave) {
  try {
    const limpa = (chave || '').trim();
    if (limpa) localStorage.setItem(CHAVE_LOCAL_STORAGE, limpa);
    else localStorage.removeItem(CHAVE_LOCAL_STORAGE);
  } catch {
    // ignora erro de storage
  }
}

export function montarPromptMapa(pedido, sistemaNome = 'Ordem Paranormal') {
  return `Você é um arquiteto de mapas de RPG de mesa (${sistemaNome}).
Crie um mapa em grade 2D (coordenadas x de 0 a 24, y de 0 a 18) para o seguinte pedido do mestre:
"${pedido}"

Retorne APENAS um JSON válido com esta estrutura exata (sem texto fora do JSON):
{
  "terreno": [
    { "x": 0, "y": 0, "tipo": "parede" }
  ],
  "textos": [
    { "x": 3, "y": 3, "texto": "Hall de Entrada", "cor": "#eceaf2" }
  ],
  "pins": [
    {
      "x": 5,
      "y": 4,
      "nome": "Armadilha",
      "icone": "armadilha",
      "cor": "#e67700",
      "tamanho": "medio",
      "visivel": false,
      "notas": "Percepção DT 15 para notar."
    }
  ]
}

Regras obrigatórias:
- Tipos de terreno permitidos: pedra, madeira, terra, grama, agua, lava, parede, porta, arvore, escuridao.
- Desenhe uma planta arquitetônica coerente: salas retangulares fechadas com "parede" ao redor, "porta" nas aberturas entre salas e chão ("pedra", "madeira" ou "terra") preenchendo todo o interior.
- Coloque EXATAMENTE 1 texto no canto superior esquerdo de cada sala (ex.: y = inicio_da_sala + 0.4), sem repetir nomes.
- Ícones de pin permitidos: guerreiro, mago, arqueiro, monstro, chefe, npc, bau, porta, armadilha, local, fogueira, caveira.
- Tamanhos permitidos: minusculo, medio, grande, enorme, colossal.
- Coloque de 3 a 7 pins dentro dos cômodos (NUNCA em cima de paredes, NUNCA dois pins na mesma coordenada x,y e longe dos textos das salas), com notas secretas curtas em português e DTs adequadas a ${sistemaNome}.`;
}

/**
 * Valida e sanitiza o JSON retornado pelo Gemini para proteger o tabuleiro e o banco.
 */
export function validarMapaGemini(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    const limpo = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    obj = JSON.parse(limpo);
  }
  if (!obj || typeof obj !== 'object') {
    throw new Error('Resposta do Gemini não é um objeto válido.');
  }

  const terreno = {};
  const listaTerreno = Array.isArray(obj.terreno) ? obj.terreno.slice(0, 1500) : [];
  for (const cel of listaTerreno) {
    const x = Math.round(Number(cel?.x));
    const y = Math.round(Number(cel?.y));
    const tipo = String(cel?.tipo || '');
    if (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= -10 &&
      x <= 50 &&
      y >= -10 &&
      y <= 50 &&
      MAPA_TERRENOS[tipo]
    ) {
      terreno[`${x},${y}`] = tipo;
    }
  }

  const textos = [];
  const textosVistos = new Set();
  const listaTextos = Array.isArray(obj.textos) ? obj.textos.slice(0, 25) : [];
  for (const t of listaTextos) {
    const x = Number(t?.x);
    const y = Number(t?.y);
    const txt = String(t?.texto || '').trim().slice(0, 60);
    const chaveTxt = txt.toLowerCase();
    if (Number.isFinite(x) && Number.isFinite(y) && txt && !textosVistos.has(chaveTxt)) {
      textosVistos.add(chaveTxt);
      textos.push({
        x,
        y,
        texto: txt,
        cor: typeof t?.cor === 'string' && t.cor.startsWith('#') ? t.cor : '#eceaf2',
      });
    }
  }

  const pins = [];
  const coordsOcupadas = new Set();
  const listaPins = Array.isArray(obj.pins) ? obj.pins.slice(0, 25) : [];
  for (const p of listaPins) {
    let x = Math.round(Number(p?.x));
    let y = Math.round(Number(p?.y));
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    while (coordsOcupadas.has(`${x},${y}`)) x += 1;
    coordsOcupadas.add(`${x},${y}`);
    pins.push({
      x,
      y,
      nome: String(p?.nome || 'Pin').trim().slice(0, 40),
      icone: ICONES_VALIDOS.has(p?.icone) ? p.icone : 'local',
      cor: typeof p?.cor === 'string' && p.cor.startsWith('#') ? p.cor : '#c92a42',
      tamanho: TAMANHOS_VALIDOS.has(p?.tamanho) ? p.tamanho : 'medio',
      visivel: Boolean(p?.visivel),
      notas: String(p?.notas || '').trim().slice(0, 400),
    });
  }

  return { terreno, textos, pins };
}

function traduzirErroGemini(err) {
  const msg = String(err?.message || err || '');
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
    return 'Limite gratuito por minuto atingido. Aguarde alguns segundos e tente novamente.';
  }
  if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('api key')) {
    return 'Chave da API do Gemini inválida ou ausente.';
  }
  return msg || 'Não foi possível gerar o mapa com o Gemini.';
}

export async function gerarMapaComGemini({
  supabase,
  campanhaId,
  prompt,
  sistemaNome,
  chaveLocal = '',
}) {
  try {
    if (chaveLocal && chaveLocal.trim()) {
      const ai = new GoogleGenAI({ apiKey: chaveLocal.trim() });
      const interaction = await ai.interactions.create({
        model: 'gemini-4-hydrogen',
        store: false,
        input: montarPromptMapa(prompt, sistemaNome),
      });
      return validarMapaGemini(interaction.output_text);
    }

    if (!supabase) {
      throw new Error('Configure o Supabase ou cole sua chave gratuita do Google AI Studio.');
    }

    const { data, error } = await supabase.functions.invoke('gerar-mapa', {
      body: { campanhaId, prompt, sistemaNome },
    });

    if (error) {
      throw new Error(
        error.message?.includes('Failed to send a request')
          ? 'Edge Function "gerar-mapa" não publicada no Supabase. Cole sua chave gratuita do AI Studio abaixo para usar direto.'
          : error.message
      );
    }

    return validarMapaGemini(data);
  } catch (err) {
    throw new Error(traduzirErroGemini(err));
  }
}
