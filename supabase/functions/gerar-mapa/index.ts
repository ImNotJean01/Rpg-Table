// Supabase Edge Function (Opção A — segura e gratuita no Free Tier)
// Deploy: supabase functions deploy gerar-mapa
// Secret: supabase secrets set GEMINI_API_KEY=sua-chave-do-ai-studio

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@^1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY não configurada nos Secrets do Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { campanhaId, prompt, sistemaNome = 'Ordem Paranormal' } = await req.json();
    if (!campanhaId || !prompt) {
      return new Response(JSON.stringify({ error: 'Dados incompletos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Confirma que quem chamou é mestre da campanha
    const { data: ehMestre } = await supabase.rpc('eh_mestre', { c: campanhaId });
    if (!ehMestre) {
      return new Response(JSON.stringify({ error: 'Apenas o mestre pode gerar mapas.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const instrucao = `Você é um arquiteto de mapas de RPG (${sistemaNome}).
Crie um mapa em grade 2D (x de 0 a 24, y de 0 a 18) para: "${prompt}".
Retorne APENAS JSON válido no formato:
{
  "terreno": [{ "x": 0, "y": 0, "tipo": "parede" }],
  "textos": [{ "x": 3, "y": 3, "texto": "Sala", "cor": "#eceaf2" }],
  "pins": [{ "x": 5, "y": 4, "nome": "Pin", "icone": "monstro", "cor": "#c92a42", "tamanho": "medio", "visivel": false, "notas": "Nota secreta" }]
}
Materiais: pedra, madeira, terra, grama, agua, lava, parede, porta, arvore, escuridao.
Ícones: guerreiro, mago, arqueiro, monstro, chefe, npc, bau, porta, armadilha, local, fogueira, caveira.
Tamanhos: minusculo, medio, grande, enorme, colossal.`;

    const interaction = await ai.interactions.create({
      model: 'gemini-4-hydrogen',
      store: false,
      input: instrucao,
    });

    const limpo = (interaction.output_text || '{}')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    return new Response(limpo, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
