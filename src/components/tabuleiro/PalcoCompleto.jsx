import { useEffect, useRef, useState } from 'react';
import {
  Circle,
  Ellipse,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
} from 'react-konva';
import { MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react';
import {
  encaixarNaGrade,
  ICONES_PIN,
  tamanhoParaPixels,
  telaParaMundo,
} from './utils.js';
import { celulasDoPincel, celulasDoRetangulo, getPadraoTerreno, MAPA_TERRENOS } from './texturas.js';

const SIGLAS_PIN = {
  guerreiro: 'AG',
  mago: 'OC',
  arqueiro: 'AT',
  monstro: 'CR',
  chefe: 'CH',
  npc: 'NP',
  bau: 'IT',
  porta: 'PT',
  armadilha: '!',
  local: '◆',
  fogueira: '✦',
  caveira: '†',
};

function useImagemUrl(url) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!url) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.onerror = () => setImg(null);
    image.src = url;
  }, [url]);
  return img;
}

function PinKonva({ pin, grade, podeArrastar, entidade, onMover, onClicar }) {
  const tamanhoPx = tamanhoParaPixels(pin.tamanho, grade);
  const raio = tamanhoPx / 2;
  const imgSrc = pin.usar_retrato
    ? entidade?.retrato_url || entidade?.imagem_url
    : null;
  const img = useImagemUrl(imgSrc);
  const iconeObj = ICONES_PIN.find((i) => i.id === pin.icone) || ICONES_PIN[0];

  const pv = entidade?.dados?.recursos?.pv;
  const pvPct = pv && pv.max > 0 ? Math.max(0, Math.min(1, pv.atual / pv.max)) : null;

  return (
    <Group
      x={pin.x}
      y={pin.y}
      draggable={podeArrastar}
      opacity={pin.visivel === false ? 0.45 : 1}
      onClick={(e) => {
        if (e.evt.altKey) return;
        e.cancelBubble = true;
        onClicar(pin);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onClicar(pin);
      }}
      onDragEnd={(e) => {
        const encaixado = encaixarNaGrade(
          e.target.x(),
          e.target.y(),
          grade,
          pin.tamanho
        );
        e.target.position(encaixado);
        onMover(pin.id, encaixado.x, encaixado.y);
      }}
    >
      <Circle
        x={raio}
        y={raio}
        radius={raio - 3}
        fill="#111016"
        stroke={pin.cor || '#c92a42'}
        strokeWidth={3}
        shadowColor="#000"
        shadowBlur={10}
      />
      <Circle
        x={raio}
        y={raio}
        radius={raio - 7}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
      />

      {img ? (
        <Group
          clipFunc={(ctx) => {
            ctx.arc(raio, raio, raio - 6, 0, Math.PI * 2, false);
          }}
        >
          <KonvaImage image={img} x={6} y={6} width={tamanhoPx - 12} height={tamanhoPx - 12} />
        </Group>
      ) : (
        <Text
          x={0}
          y={raio - Math.max(8, tamanhoPx * 0.16)}
          width={tamanhoPx}
          align="center"
          text={SIGLAS_PIN[iconeObj.id] || '●'}
          fontStyle="bold"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fill="#eceaf2"
          fontSize={Math.max(13, Math.round(tamanhoPx * 0.3))}
        />
      )}

      {pvPct !== null && (
        <Group x={4} y={tamanhoPx + 2}>
          <Rect width={tamanhoPx - 8} height={5} fill="#0c0b0e" cornerRadius={3} />
          <Rect
            width={(tamanhoPx - 8) * pvPct}
            height={5}
            fill="#c92a42"
            cornerRadius={3}
          />
        </Group>
      )}

      <Group x={-26} y={tamanhoPx + (pvPct !== null ? 9 : 4)}>
        <Rect
          width={tamanhoPx + 52}
          height={17}
          fill="rgba(12,11,14,0.82)"
          cornerRadius={4}
        />
        <Text
          y={2}
          width={tamanhoPx + 52}
          align="center"
          text={`${pin.nome}${entidade?.condicoes?.length ? ` (${entidade.condicoes.length})` : ''}`}
          fontSize={11}
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fill="#eceaf2"
        />
      </Group>
    </Group>
  );
}

export default function PalcoCompleto({
  cena,
  pins = [],
  desenhos = [],
  pings = [],
  personagens = [],
  criaturas = [],
  userId,
  isMestre,
  ferramenta,
  terrenoTipo,
  pincelTamanho,
  corDesenho,
  carimboAtivo,
  onMoverPin,
  onClicarPin,
  onPatchTerreno,
  onPatchNevoa,
  onCriarDesenho,
  onApagarDesenho,
  onAplicarCarimbo,
  onEnviarPing,
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 520 });
  const [stagePos, setStagePos] = useState({ x: 60, y: 40 });
  const [escala, setEscala] = useState(1);

  // Estado transitório de desenho / pincel / régua
  const [ativoDrag, setAtivoDrag] = useState(null);
  const [previewPatch, setPreviewPatch] = useState({});
  const [regua, setRegua] = useState(null);

  const fundoImg = useImagemUrl(cena?.fundo_url);
  const grade = cena?.grade || 70;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function getMundoPointer(stage) {
    const ptr = stage.getPointerPosition();
    if (!ptr) return null;
    return telaParaMundo(ptr.x, ptr.y, stagePos, escala);
  }

  function handleWheel(e) {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = escala;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clamped = Math.max(0.25, Math.min(2.5, newScale));

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    setEscala(clamped);
    setStagePos({
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    });
  }

  function handleMouseDown(e) {
    const stage = e.target.getStage();
    const mundo = getMundoPointer(stage);
    if (!mundo) return;

    const gx = Math.floor(mundo.x / grade);
    const gy = Math.floor(mundo.y / grade);

    // Ping (Alt+clique ou ferramenta Ping)
    if (e.evt.altKey || ferramenta === 'ping') {
      onEnviarPing(mundo.x, mundo.y);
      return;
    }

    // Carimbo de sala
    if (isMestre && carimboAtivo) {
      onAplicarCarimbo(carimboAtivo, gx, gy);
      return;
    }

    // Régua
    if (ferramenta === 'regua') {
      setRegua({ x1: mundo.x, y1: mundo.y, x2: mundo.x, y2: mundo.y });
      return;
    }

    if (!isMestre) return;

    if (ferramenta === 'texto') {
      const texto = prompt('Texto para colocar no mapa:');
      if (texto && texto.trim()) {
        onCriarDesenho('texto', {
          x: mundo.x,
          y: mundo.y,
          texto: texto.trim(),
          cor: corDesenho,
        });
      }
      return;
    }

    if (ferramenta === 'terreno') {
      if (pincelTamanho === 'rect') {
        setAtivoDrag({ modo: 'terreno-rect', gx, gy });
      } else {
        const lote = {};
        for (const c of celulasDoPincel(gx, gy, pincelTamanho)) {
          lote[c.key] = terrenoTipo;
        }
        setPreviewPatch(lote);
        setAtivoDrag({ modo: 'terreno-pincel' });
      }
      return;
    }

    if (ferramenta === 'borracha') {
      const lote = { [`${gx},${gy}`]: null };
      setPreviewPatch(lote);
      setAtivoDrag({ modo: 'borracha' });
      return;
    }

    if (ferramenta === 'nevoa') {
      const val = e.evt.shiftKey ? null : true;
      const lote = {};
      for (const c of celulasDoPincel(gx, gy, 3)) {
        lote[c.key] = val;
      }
      setPreviewPatch(lote);
      setAtivoDrag({ modo: 'nevoa', val });
      return;
    }

    if (ferramenta === 'caneta') {
      setAtivoDrag({
        modo: 'caneta',
        pontos: [mundo.x, mundo.y],
        cor: corDesenho,
      });
      return;
    }

    if (['linha', 'ret', 'circulo'].includes(ferramenta)) {
      setAtivoDrag({
        modo: ferramenta,
        x1: mundo.x,
        y1: mundo.y,
        x2: mundo.x,
        y2: mundo.y,
        cor: corDesenho,
      });
    }
  }

  function handleMouseMove(e) {
    const stage = e.target.getStage();
    const mundo = getMundoPointer(stage);
    if (!mundo) return;

    if (regua) {
      setRegua((r) => (r ? { ...r, x2: mundo.x, y2: mundo.y } : null));
      return;
    }

    if (!ativoDrag) return;
    const gx = Math.floor(mundo.x / grade);
    const gy = Math.floor(mundo.y / grade);

    if (ativoDrag.modo === 'terreno-pincel') {
      setPreviewPatch((prev) => {
        const next = { ...prev };
        for (const c of celulasDoPincel(gx, gy, pincelTamanho)) {
          next[c.key] = terrenoTipo;
        }
        return next;
      });
    } else if (ativoDrag.modo === 'terreno-rect') {
      const next = {};
      for (const c of celulasDoRetangulo(ativoDrag.gx, ativoDrag.gy, gx, gy)) {
        next[c.key] = terrenoTipo;
      }
      setPreviewPatch(next);
    } else if (ativoDrag.modo === 'borracha') {
      setPreviewPatch((prev) => ({ ...prev, [`${gx},${gy}`]: null }));
    } else if (ativoDrag.modo === 'nevoa') {
      setPreviewPatch((prev) => {
        const next = { ...prev };
        for (const c of celulasDoPincel(gx, gy, 3)) {
          next[c.key] = ativoDrag.val;
        }
        return next;
      });
    } else if (ativoDrag.modo === 'caneta') {
      setAtivoDrag((d) =>
        d ? { ...d, pontos: [...d.pontos, mundo.x, mundo.y] } : null
      );
    } else if (['linha', 'ret', 'circulo'].includes(ativoDrag.modo)) {
      setAtivoDrag((d) => (d ? { ...d, x2: mundo.x, y2: mundo.y } : null));
    }
  }

  function handleMouseUp() {
    if (regua) {
      setRegua(null);
      return;
    }
    if (!ativoDrag) return;

    if (
      ativoDrag.modo === 'terreno-pincel' ||
      ativoDrag.modo === 'terreno-rect' ||
      ativoDrag.modo === 'borracha'
    ) {
      if (Object.keys(previewPatch).length > 0) {
        onPatchTerreno(previewPatch);
      }
      setPreviewPatch({});
    } else if (ativoDrag.modo === 'nevoa') {
      if (Object.keys(previewPatch).length > 0) {
        onPatchNevoa(previewPatch);
      }
      setPreviewPatch({});
    } else if (ativoDrag.modo === 'caneta') {
      if (ativoDrag.pontos.length >= 4) {
        onCriarDesenho('caneta', {
          pontos: ativoDrag.pontos,
          cor: ativoDrag.cor,
        });
      }
    } else if (['linha', 'ret', 'circulo'].includes(ativoDrag.modo)) {
      onCriarDesenho(ativoDrag.modo, {
        x1: ativoDrag.x1,
        y1: ativoDrag.y1,
        x2: ativoDrag.x2,
        y2: ativoDrag.y2,
        cor: ativoDrag.cor,
      });
    }

    setAtivoDrag(null);
  }

  // Mescla terreno salvo com preview atual
  const terrenoCombinado = { ...(cena?.terreno || {}) };
  if (ativoDrag?.modo?.startsWith('terreno') || ativoDrag?.modo === 'borracha') {
    for (const [k, v] of Object.entries(previewPatch)) {
      if (v === null) delete terrenoCombinado[k];
      else terrenoCombinado[k] = v;
    }
  }

  // Mescla névoa revelada com preview atual
  const nevoaCombinada = { ...(cena?.nevoa || {}) };
  if (ativoDrag?.modo === 'nevoa') {
    for (const [k, v] of Object.entries(previewPatch)) {
      if (v === null) delete nevoaCombinada[k];
      else nevoaCombinada[k] = true;
    }
  }

  // Grade visível
  const linhasGrade = [];
  if (cena?.mostrar_grade !== false) {
    const cols = 45;
    for (let i = -cols; i <= cols; i++) {
      linhasGrade.push(
        <Line
          key={`v${i}`}
          points={[i * grade, -cols * grade, i * grade, cols * grade]}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      );
      linhasGrade.push(
        <Line
          key={`h${i}`}
          points={[-cols * grade, i * grade, cols * grade, i * grade]}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      );
    }
  }

  function resolverEntidade(pin) {
    if (pin.personagem_id) return personagens.find((p) => p.id === pin.personagem_id);
    if (pin.criatura_id) return criaturas.find((c) => c.id === pin.criatura_id);
    return null;
  }

  function podeArrastarPin(pin) {
    if (ferramenta !== 'mao' || carimboAtivo) return false;
    if (isMestre) return true;
    if (!pin.personagem_id) return false;
    const p = personagens.find((x) => x.id === pin.personagem_id);
    if (p?.dados?.controlado_pelo_mestre) return false;
    return p?.dono_id === userId;
  }

  function renderDesenho(d, key, isPreview = false) {
    const propsComuns = {
      key,
      stroke: d.cor || '#eceaf2',
      strokeWidth: 3,
      opacity: isPreview ? 0.7 : 1,
      onClick: () => {
        if (!isPreview && isMestre && ferramenta === 'borracha') {
          onApagarDesenho(d.id);
        }
      },
    };

    if (d.tipo === 'caneta') {
      return <Line {...propsComuns} points={d.pontos || []} lineCap="round" lineJoin="round" />;
    }
    if (d.tipo === 'linha') {
      return <Line {...propsComuns} points={[d.x1, d.y1, d.x2, d.y2]} lineCap="round" />;
    }
    if (d.tipo === 'ret') {
      return (
        <Rect
          {...propsComuns}
          x={Math.min(d.x1, d.x2)}
          y={Math.min(d.y1, d.y2)}
          width={Math.abs(d.x2 - d.x1)}
          height={Math.abs(d.y2 - d.y1)}
        />
      );
    }
    if (d.tipo === 'circulo') {
      return (
        <Ellipse
          {...propsComuns}
          x={(d.x1 + d.x2) / 2}
          y={(d.y1 + d.y2) / 2}
          radiusX={Math.abs(d.x2 - d.x1) / 2}
          radiusY={Math.abs(d.y2 - d.y1) / 2}
        />
      );
    }
    if (d.tipo === 'texto') {
      return (
        <Group
          key={key}
          x={d.x}
          y={d.y}
          onClick={() => {
            if (!isPreview && isMestre && ferramenta === 'borracha') {
              onApagarDesenho(d.id);
            }
          }}
        >
          <Text
            text={String(d.texto || '').toUpperCase()}
            fontSize={13}
            fontStyle="bold"
            letterSpacing={1.5}
            fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
            fill={d.cor || 'rgba(236,234,242,0.85)'}
            shadowColor="#000"
            shadowBlur={6}
          />
        </Group>
      );
    }
    return null;
  }

  const distanciaRegua = regua
    ? Math.hypot(regua.x2 - regua.x1, regua.y2 - regua.y1) / grade
    : 0;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        touchAction: 'none',
        cursor: carimboAtivo ? 'crosshair' : ferramenta === 'mao' ? 'grab' : 'crosshair',
      }}
    >
      <Stage
        width={size.width}
        height={size.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={escala}
        scaleY={escala}
        draggable={ferramenta === 'mao' && !carimboAtivo}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Fundo + Terreno + Grade */}
        <Layer>
          {fundoImg && (
            <KonvaImage
              image={fundoImg}
              x={cena?.fundo_x || 0}
              y={cena?.fundo_y || 0}
              scaleX={cena?.fundo_escala || 1}
              scaleY={cena?.fundo_escala || 1}
            />
          )}

          {Object.entries(terrenoCombinado).map(([key, tipo]) => {
            const [gx, gy] = key.split(',').map(Number);
            const mat = MAPA_TERRENOS[tipo];
            if (!mat) return null;
            const px = gx * grade;
            const py = gy * grade;

            if (tipo === 'porta') {
              return (
                <Group key={key} x={px} y={py}>
                  <Rect width={grade} height={grade} fill="#343842" />
                  <Rect
                    x={4}
                    y={grade * 0.38}
                    width={grade - 8}
                    height={grade * 0.24}
                    fill="#8c5a2b"
                    stroke="#d4a373"
                    strokeWidth={1.5}
                    cornerRadius={2}
                  />
                  <Circle x={grade - 12} y={grade * 0.5} radius={2.5} fill="#e0a94f" />
                </Group>
              );
            }

            if (tipo === 'arvore') {
              const padraoGrama = getPadraoTerreno('grama', grade);
              return (
                <Group key={key} x={px} y={py}>
                  <Rect
                    width={grade}
                    height={grade}
                    fillPatternImage={padraoGrama || undefined}
                    fill={padraoGrama ? undefined : '#22492d'}
                  />
                  <Circle
                    x={grade * 0.52}
                    y={grade * 0.54}
                    radius={grade * 0.4}
                    fill="rgba(0,0,0,0.45)"
                  />
                  <Circle
                    x={grade * 0.5}
                    y={grade * 0.48}
                    radius={grade * 0.38}
                    fill="#184223"
                    stroke="#245c32"
                    strokeWidth={2}
                  />
                </Group>
              );
            }

            const padrao = getPadraoTerreno(tipo, grade);
            return (
              <Rect
                key={key}
                x={px}
                y={py}
                width={grade}
                height={grade}
                fillPatternImage={padrao || undefined}
                fillPatternOffset={padrao ? { x: px, y: py } : undefined}
                fill={padrao ? undefined : mat.cor}
                shadowColor={tipo === 'parede' ? '#000' : undefined}
                shadowBlur={tipo === 'parede' ? 8 : 0}
              />
            );
          })}

          {linhasGrade}
        </Layer>

        {/* Desenhos e Textos */}
        <Layer>
          {desenhos.map((d) => renderDesenho({ ...d.dados, tipo: d.tipo, id: d.id }, d.id))}
          {ativoDrag && ['caneta', 'linha', 'ret', 'circulo'].includes(ativoDrag.modo) &&
            renderDesenho({ ...ativoDrag, tipo: ativoDrag.modo }, 'preview', true)}
        </Layer>

        {/* Pins */}
        <Layer>
          {pins.map((pin) => (
            <PinKonva
              key={pin.id}
              pin={pin}
              grade={grade}
              podeArrastar={podeArrastarPin(pin)}
              entidade={resolverEntidade(pin)}
              onMover={onMoverPin}
              onClicar={onClicarPin}
            />
          ))}
        </Layer>

        {/* Névoa de Guerra */}
        {cena?.fog_ativo && (
          <Layer listening={false}>
            <Rect
              x={-45 * grade}
              y={-45 * grade}
              width={90 * grade}
              height={90 * grade}
              fill={isMestre ? 'rgba(8,7,10,0.48)' : 'rgba(8,7,10,0.97)'}
            />
            {Object.keys(nevoaCombinada).map((key) => {
              const [gx, gy] = key.split(',').map(Number);
              return (
                <Rect
                  key={key}
                  x={gx * grade}
                  y={gy * grade}
                  width={grade}
                  height={grade}
                  fill="#000"
                  globalCompositeOperation="destination-out"
                />
              );
            })}
          </Layer>
        )}

        {/* Régua e Pings ao vivo */}
        <Layer listening={false}>
          {regua && (
            <Group>
              <Line
                points={[regua.x1, regua.y1, regua.x2, regua.y2]}
                stroke="#f59e0b"
                strokeWidth={3}
                dash={[8, 6]}
              />
              <Text
                x={(regua.x1 + regua.x2) / 2 - 50}
                y={(regua.y1 + regua.y2) / 2 - 24}
                text={`${distanciaRegua.toFixed(1)} quad (${(distanciaRegua * 1.5).toFixed(1)} m)`}
                fontSize={14}
                fontStyle="bold"
                fill="#ffe066"
                shadowColor="#000"
                shadowBlur={5}
              />
            </Group>
          )}

          {pings.map((p) => (
            <Group key={p.id} x={p.x} y={p.y}>
              <Circle radius={28} stroke={p.cor || '#f59e0b'} strokeWidth={4} opacity={0.85} />
              <Circle radius={12} stroke="#fff" strokeWidth={2} />
              <Text
                x={-40}
                y={32}
                width={80}
                align="center"
                text={p.autor_nome}
                fontSize={12}
                fill="#ffe066"
                shadowColor="#000"
                shadowBlur={4}
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {carimboAtivo && (
        <div
          className="badge badge-accent"
          style={{ position: 'absolute', top: 12, right: 12, padding: '0.4rem 0.7rem' }}
        >
          Modo Carimbo ativo — clique no mapa para colocar
        </div>
      )}

      <div
        className="row"
        role="group"
        aria-label="Controles de zoom do mapa"
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: 'color-mix(in srgb, var(--bg-surface) 88%, transparent)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem 0.4rem',
          gap: '0.25rem',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.42)',
        }}
      >
        <button
          type="button"
          className="btn btn-sm btn-ghost btn-icon"
          aria-label="Diminuir zoom do mapa"
          title="Diminuir zoom"
          onClick={() => setEscala((s) => Math.max(0.25, s / 1.15))}
        >
          <MagnifyingGlassMinus size={15} weight="duotone" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost mono"
          title="Voltar para 100% e centralizar mapa"
          aria-label={`Zoom atual ${Math.round(escala * 100)} por cento. Clique para redefinir para 100%`}
          onClick={() => {
            setEscala(1);
            setStagePos({ x: 60, y: 40 });
          }}
          style={{ padding: '0.22rem 0.45rem', fontSize: '0.78rem' }}
        >
          {Math.round(escala * 100)}%
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost btn-icon"
          aria-label="Aumentar zoom do mapa"
          title="Aumentar zoom"
          onClick={() => setEscala((s) => Math.min(2.5, s * 1.15))}
        >
          <MagnifyingGlassPlus size={15} weight="duotone" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
