export const TERRENOS = [
  { id: 'pedra', nome: 'Pedra', cor: '#343842', detalhe: '#23262e' },
  { id: 'madeira', nome: 'Madeira', cor: '#5c3c24', detalhe: '#3d2616' },
  { id: 'terra', nome: 'Terra', cor: '#4a3a2b', detalhe: '#33271c' },
  { id: 'grama', nome: 'Grama', cor: '#22492d', detalhe: '#17331f' },
  { id: 'agua', nome: 'Água', cor: '#16426b', detalhe: '#245d91' },
  { id: 'lava', nome: 'Lava', cor: '#8f240c', detalhe: '#e8590c' },
  { id: 'parede', nome: 'Parede', cor: '#111016', detalhe: '#08070a' },
  { id: 'porta', nome: 'Porta', cor: '#8c5a2b', detalhe: '#d4a373' },
  { id: 'arvore', nome: 'Árvore', cor: '#163820', detalhe: '#0d2414' },
  { id: 'escuridao', nome: 'Escuridão', cor: '#070609', detalhe: '#0c0b10' },
];

export const MAPA_TERRENOS = Object.fromEntries(TERRENOS.map((t) => [t.id, t]));

const cachePadroes = new Map();

/**
 * Gera texturas contínuas em Canvas offscreen para o Konva usar como fillPatternImage,
 * evitando o aspecto de "blocos quadrados repetidos".
 */
export function getPadraoTerreno(tipo, grade = 70) {
  if (typeof document === 'undefined') return null;
  const chave = `${tipo}:${grade}`;
  if (cachePadroes.has(chave)) return cachePadroes.get(chave);

  const mat = MAPA_TERRENOS[tipo];
  if (!mat) return null;

  const size = grade * 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = mat.cor;
  ctx.fillRect(0, 0, size, size);

  if (tipo === 'madeira') {
    const tábuas = 8;
    const h = size / tábuas;
    ctx.strokeStyle = mat.detalhe;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < tábuas; i++) {
      const y = i * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();

      // emenda alternada das tábuas
      const juntaX = ((i * 53) % (size - 20)) + 10;
      ctx.beginPath();
      ctx.moveTo(juntaX, y);
      ctx.lineTo(juntaX, y + h);
      ctx.stroke();
    }
  } else if (tipo === 'pedra') {
    ctx.strokeStyle = mat.detalhe;
    ctx.lineWidth = 1.5;
    const step = size / 4;
    for (let row = 0; row < 4; row++) {
      const y = row * step;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
      const offset = (row % 2) * (step / 2);
      for (let col = 0; col < 4; col++) {
        const x = (col * step + offset) % size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + step);
        ctx.stroke();
      }
    }
  } else if (tipo === 'grama' || tipo === 'terra') {
    ctx.fillStyle = mat.detalhe;
    for (let i = 0; i < 90; i++) {
      const x = (i * 37) % size;
      const y = (i * 71) % size;
      ctx.fillRect(x, y, 2, tipo === 'grama' ? 4 : 2);
    }
  } else if (tipo === 'agua') {
    ctx.strokeStyle = mat.detalhe;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.45;
    for (let y = 12; y < size; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y - 5, size * 0.7, y + 5, size, y);
      ctx.stroke();
    }
  } else if (tipo === 'lava') {
    ctx.strokeStyle = mat.detalhe;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.lineTo(size * 0.4, size * 0.55);
    ctx.lineTo(size * 0.75, size * 0.25);
    ctx.lineTo(size, size * 0.65);
    ctx.stroke();
  } else if (tipo === 'parede') {
    ctx.strokeStyle = '#262330';
    ctx.lineWidth = 1;
    for (let i = -size; i < size * 2; i += 14) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
  }

  cachePadroes.set(chave, canvas);
  return canvas;
}

/**
 * Calcula as chaves "x,y" afetadas por um pincel (1x1 ou 3x3) ou retângulo.
 */
export function celulasDoPincel(gx, gy, tamanho = 1) {
  const lista = [];
  const raio = tamanho === 3 ? 1 : 0;
  for (let dx = -raio; dx <= raio; dx++) {
    for (let dy = -raio; dy <= raio; dy++) {
      lista.push({ x: gx + dx, y: gy + dy, key: `${gx + dx},${gy + dy}` });
    }
  }
  return lista;
}

export function celulasDoRetangulo(x1, y1, x2, y2) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const lista = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      lista.push({ x, y, key: `${x},${y}` });
    }
  }
  return lista;
}
