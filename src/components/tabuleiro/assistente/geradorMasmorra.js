const PORTES = {
  pequeno: { salas: 4, largura: 22, altura: 18 },
  medio: { salas: 7, largura: 30, altura: 24 },
  grande: { salas: 10, largura: 38, altura: 30 },
};

const ESTILOS = {
  masmorra: { chao: 'pedra', parede: 'parede', porta: 'porta' },
  mansao: { chao: 'madeira', parede: 'parede', porta: 'porta' },
  caverna: { chao: 'terra', parede: 'parede', porta: null },
};

/**
 * Gera um rascunho procedural de planta baixa (salas + corredores + portas)
 * retornando { patch: { "x,y": tipo }, salas: [{ x, y, w, h, cx, cy }] }.
 */
export function gerarMasmorra({ estilo = 'masmorra', porte = 'medio' } = {}) {
  const cfg = PORTES[porte] || PORTES.medio;
  const mat = ESTILOS[estilo] || ESTILOS.masmorra;
  const salas = [];
  const chaoSet = new Set();

  let tentativas = 0;
  while (salas.length < cfg.salas && tentativas < 120) {
    tentativas++;
    const w = 4 + Math.floor(Math.random() * 4);
    const h = 4 + Math.floor(Math.random() * 4);
    const x = 2 + Math.floor(Math.random() * (cfg.largura - w - 4));
    const y = 2 + Math.floor(Math.random() * (cfg.altura - h - 4));

    const sobrepoe = salas.some(
      (s) =>
        x < s.x + s.w + 2 &&
        x + w + 2 > s.x &&
        y < s.y + s.h + 2 &&
        y + h + 2 > s.y
    );
    if (sobrepoe) continue;

    const nova = {
      x,
      y,
      w,
      h,
      cx: Math.floor(x + w / 2),
      cy: Math.floor(y + h / 2),
    };
    salas.push(nova);

    for (let ix = x; ix < x + w; ix++) {
      for (let iy = y; iy < y + h; iy++) {
        chaoSet.add(`${ix},${iy}`);
      }
    }
  }

  // Conecta cada sala à anterior com corredor em L
  for (let i = 1; i < salas.length; i++) {
    const a = salas[i - 1];
    const b = salas[i];
    let cx = a.cx;
    let cy = a.cy;

    while (cx !== b.cx) {
      chaoSet.add(`${cx},${cy}`);
      cx += cx < b.cx ? 1 : -1;
    }
    while (cy !== b.cy) {
      chaoSet.add(`${cx},${cy}`);
      cy += cy < b.cy ? 1 : -1;
    }
    chaoSet.add(`${b.cx},${b.cy}`);
  }

  const patch = {};
  for (const key of chaoSet) {
    patch[key] = mat.chao;
  }

  // Adiciona paredes ao redor de todo o chão
  for (const key of chaoSet) {
    const [x, y] = key.split(',').map(Number);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const vk = `${x + dx},${y + dy}`;
        if (!chaoSet.has(vk)) {
          patch[vk] = mat.parede;
        }
      }
    }
  }

  // Marca portas na entrada de algumas salas
  if (mat.porta) {
    for (const s of salas) {
      const px = s.cx;
      const py = s.y - 1;
      if (patch[`${px},${py}`] === mat.parede && chaoSet.has(`${px},${py - 1}`)) {
        patch[`${px},${py}`] = mat.porta;
      }
    }
  }

  return { patch, salas };
}
