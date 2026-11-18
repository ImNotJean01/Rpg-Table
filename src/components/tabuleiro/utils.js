export const ESCALAS_TAMANHO = {
  minusculo: 0.5,
  medio: 1,
  grande: 2,
  enorme: 3,
  colossal: 4,
};

export const ICONES_PIN = [
  { id: 'guerreiro', label: 'Guerreiro', simbolo: '⚔️' },
  { id: 'mago', label: 'Ocultista / Mago', simbolo: '🔮' },
  { id: 'arqueiro', label: 'Atirador', simbolo: '🏹' },
  { id: 'monstro', label: 'Monstro', simbolo: '👹' },
  { id: 'chefe', label: 'Chefe', simbolo: '💀' },
  { id: 'npc', label: 'NPC', simbolo: '🧑' },
  { id: 'bau', label: 'Baú / Item', simbolo: '🧰' },
  { id: 'porta', label: 'Porta', simbolo: '🚪' },
  { id: 'armadilha', label: 'Armadilha', simbolo: '⚠️' },
  { id: 'local', label: 'Local / Pista', simbolo: '📍' },
  { id: 'fogueira', label: 'Fogueira / Base', simbolo: '🔥' },
  { id: 'caveira', label: 'Perigo', simbolo: '☠️' },
];

export function tamanhoParaPixels(tamanhoId, grade = 70) {
  const escala = ESCALAS_TAMANHO[tamanhoId] ?? 1;
  return Math.round(grade * escala);
}

/**
 * Encaixa a posição (canto superior esquerdo) na grade,
 * respeitando o tamanho do pin.
 */
export function encaixarNaGrade(x, y, grade = 70, tamanhoId = 'medio') {
  const passo = tamanhoId === 'minusculo' ? grade / 2 : grade;
  return {
    x: Math.round(x / passo) * passo,
    y: Math.round(y / passo) * passo,
  };
}

/**
 * Converte coordenadas da tela (ex: clique no canvas) para coordenadas do mundo.
 */
export function telaParaMundo(px, py, stagePos, escala = 1) {
  return {
    x: (px - stagePos.x) / escala,
    y: (py - stagePos.y) / escala,
  };
}
