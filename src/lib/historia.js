/**
 * Divide um texto em blocos quando houver uma linha contendo apenas
 * `---fim---` ou `===`. Retorna um array de strings (no mínimo 1 item).
 */
export function dividirPorMarcador(texto = '') {
  const bruto = String(texto ?? '');
  const partes = bruto.split(/^\s*(?:---fim---|===+)\s*$/gim);
  if (partes.length <= 1) return [bruto];
  return partes.map((p) => p.trim());
}
