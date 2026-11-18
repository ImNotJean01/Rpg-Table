/**
 * Carimbos prontos de salas e estruturas.
 * Cada carimbo retorna um patch { "dx,dy": tipoTerreno } relativo à origem.
 */
function salaRetangular(largura, altura, chao = 'pedra', borda = 'parede', portas = ['sul']) {
  const patch = {};
  for (let x = 0; x < largura; x++) {
    for (let y = 0; y < altura; y++) {
      const naBorda = x === 0 || y === 0 || x === largura - 1 || y === altura - 1;
      patch[`${x},${y}`] = naBorda ? borda : chao;
    }
  }
  const meioX = Math.floor(largura / 2);
  const meioY = Math.floor(altura / 2);
  if (portas.includes('norte')) patch[`${meioX},0`] = 'porta';
  if (portas.includes('sul')) patch[`${meioX},${altura - 1}`] = 'porta';
  if (portas.includes('oeste')) patch[`0,${meioY}`] = 'porta';
  if (portas.includes('leste')) patch[`${largura - 1},${meioY}`] = 'porta';
  return patch;
}

export const CARIMBOS = [
  {
    id: 'sala-masmorra',
    nome: 'Sala de Masmorra (6×6)',
    descricao: 'Sala de pedra fechada com duas portas.',
    gerar: () => salaRetangular(6, 6, 'pedra', 'parede', ['norte', 'sul']),
  },
  {
    id: 'camara-pilares',
    nome: 'Câmara com Pilares (8×8)',
    descricao: 'Salão amplo para chefes ou rituais, com 4 pilares de cobertura.',
    gerar: () => {
      const p = salaRetangular(8, 8, 'pedra', 'parede', ['sul']);
      p['2,2'] = 'parede';
      p['5,2'] = 'parede';
      p['2,5'] = 'parede';
      p['5,5'] = 'parede';
      return p;
    },
  },
  {
    id: 'corredor-l',
    nome: 'Corredor em L',
    descricao: 'Corredor estreito de pedra com curva de 90°.',
    gerar: () => {
      const p = {};
      for (let x = 0; x < 6; x++) {
        p[`${x},0`] = 'parede';
        p[`${x},1`] = 'pedra';
        p[`${x},2`] = x >= 3 ? 'pedra' : 'parede';
      }
      for (let y = 2; y < 6; y++) {
        p[`3,${y}`] = 'parede';
        p[`4,${y}`] = 'pedra';
        p[`5,${y}`] = 'parede';
      }
      return p;
    },
  },
  {
    id: 'taverna',
    nome: 'Taverna / Abrigo (8×6)',
    descricao: 'Piso de madeira, paredes e porta de entrada.',
    gerar: () => salaRetangular(8, 6, 'madeira', 'parede', ['sul', 'leste']),
  },
  {
    id: 'comodo-mansao',
    nome: 'Cômodo de Mansão (5×5)',
    descricao: 'Ideal para escritórios, quartos ou bibliotecas.',
    gerar: () => salaRetangular(5, 5, 'madeira', 'parede', ['oeste', 'sul']),
  },
  {
    id: 'acampamento',
    nome: 'Acampamento na Floresta (7×7)',
    descricao: 'Clareira de terra cercada por grama e árvores.',
    gerar: () => {
      const p = {};
      for (let x = 0; x < 7; x++) {
        for (let y = 0; y < 7; y++) {
          const borda = x === 0 || y === 0 || x === 6 || y === 6;
          if (borda && (x + y) % 2 === 0) p[`${x},${y}`] = 'arvore';
          else if (borda) p[`${x},${y}`] = 'grama';
          else p[`${x},${y}`] = 'terra';
        }
      }
      return p;
    },
  },
];

export function aplicarCarimbo(carimboId, origemX = 0, origemY = 0) {
  const carimbo = CARIMBOS.find((c) => c.id === carimboId);
  if (!carimbo) return {};
  const rel = carimbo.gerar();
  const patch = {};
  for (const [k, tipo] of Object.entries(rel)) {
    const [dx, dy] = k.split(',').map(Number);
    patch[`${origemX + dx},${origemY + dy}`] = tipo;
  }
  return patch;
}
