/**
 * Interpreta expressões de dados como "2d6+3", "d20", "3d8-2".
 * Retorna { qtd, faces, mod } ou null se inválida.
 */
export function parseExpressaoDados(texto) {
  if (!texto || typeof texto !== 'string') return null;
  const limpo = texto.trim().toLowerCase().replace(/\s+/g, '');
  const match = /^(\d*)d(\d+)([+-]\d+)?$/.exec(limpo);
  if (!match) return null;

  const qtd = match[1] ? Number(match[1]) : 1;
  const faces = Number(match[2]);
  const mod = match[3] ? Number(match[3]) : 0;

  if (qtd < 1 || qtd > 30 || faces < 2 || faces > 1000) return null;
  return { qtd, faces, mod };
}

/**
 * Executa uma rolagem no servidor via RPC `rolar_dados`.
 */
export async function rolarNoServidor(
  supabase,
  { campanhaId, qtd, faces, manter = 'todos', mod = 0, rotulo = '', secreta = false }
) {
  const { data, error } = await supabase.rpc('rolar_dados', {
    p_campanha: campanhaId,
    p_qtd: qtd,
    p_faces: faces,
    p_manter: manter,
    p_mod: mod,
    p_rotulo: rotulo,
    p_secreta: secreta,
  });
  if (error) throw error;
  return data;
}
