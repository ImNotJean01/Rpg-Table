import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { encaixarNaGrade, ICONES_PIN, tamanhoParaPixels } from './utils.js';

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
        fill="#15131a"
        stroke={pin.cor || '#c92a42'}
        strokeWidth={3}
        shadowColor="#000"
        shadowBlur={6}
      />

      {img ? (
        <Group
          clipFunc={(ctx) => {
            ctx.arc(raio, raio, raio - 5, 0, Math.PI * 2, false);
          }}
        >
          <KonvaImage image={img} x={5} y={5} width={tamanhoPx - 10} height={tamanhoPx - 10} />
        </Group>
      ) : (
        <Text
          x={0}
          y={raio - Math.max(11, tamanhoPx * 0.22)}
          width={tamanhoPx}
          align="center"
          text={iconeObj.simbolo}
          fontSize={Math.max(18, Math.round(tamanhoPx * 0.42))}
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

      <Text
        x={-20}
        y={tamanhoPx + (pvPct !== null ? 9 : 3)}
        width={tamanhoPx + 40}
        align="center"
        text={`${pin.nome}${entidade?.condicoes?.length ? ` (${entidade.condicoes.length})` : ''}`}
        fontSize={12}
        fill="#eceaf2"
        shadowColor="#000"
        shadowBlur={4}
      />
    </Group>
  );
}

export default function PalcoBasico({
  cena,
  pins = [],
  personagens = [],
  criaturas = [],
  userId,
  isMestre,
  onMoverPin,
  onClicarPin,
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 520 });
  const [stagePos, setStagePos] = useState({ x: 60, y: 40 });
  const [escala, setEscala] = useState(1);

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

  // Grade visível
  const linhasGrade = [];
  if (cena?.mostrar_grade !== false) {
    const cols = 40;
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
    if (isMestre) return true;
    if (!pin.personagem_id) return false;
    const p = personagens.find((x) => x.id === pin.personagem_id);
    return p?.dono_id === userId;
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Stage
        width={size.width}
        height={size.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={escala}
        scaleY={escala}
        draggable
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onWheel={handleWheel}
      >
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
          {linhasGrade}
        </Layer>

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
      </Stage>

      <div
        className="row"
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: 'rgba(12,11,14,0.85)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0.25rem 0.45rem',
          gap: '0.35rem',
        }}
      >
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => setEscala((s) => Math.max(0.25, s / 1.15))}
        >
          <ZoomOut size={14} />
        </button>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          {Math.round(escala * 100)}%
        </span>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => setEscala((s) => Math.min(2.5, s * 1.15))}
        >
          <ZoomIn size={14} />
        </button>
      </div>
    </div>
  );
}
