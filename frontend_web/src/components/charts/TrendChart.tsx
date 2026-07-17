import {
  KeyboardEvent,
  PointerEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  /** Nombre de la serie para el tooltip y accesibilidad */
  seriesLabel: string;
  height?: number;
}

const M = { top: 12, right: 16, bottom: 26, left: 40 };

/** Máximo "limpio" divisible en 4 ticks enteros */
const niceMax = (v: number): number => {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [0.4, 0.8, 1, 2, 4, 8, 10]) {
    const candidate = m * pow * (m < 1 ? 10 : 1);
    if (candidate >= v && (candidate / 4) % 1 === 0) return candidate;
  }
  return Math.ceil(v / 4) * 4;
};

/**
 * Línea de tendencia SVG: trazo 2px, área al 10%, crosshair que salta al punto
 * más cercano y tooltip con valor. Navegable con teclado (flechas).
 */
export function TrendChart({ data, seriesLabel, height = 220 }: TrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plot = useMemo(() => {
    if (width === 0 || data.length === 0) return null;
    const innerW = width - M.left - M.right;
    const innerH = height - M.top - M.bottom;
    const max = niceMax(Math.max(...data.map((d) => d.value)));
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
    const x = (i: number) => M.left + (data.length > 1 ? i * stepX : innerW / 2);
    const y = (v: number) => M.top + innerH - (v / max) * innerH;
    const points = data.map((d, i) => ({ px: x(i), py: y(d.value) }));
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px.toFixed(1)},${p.py.toFixed(1)}`)
      .join(' ');
    const baseline = M.top + innerH;
    const areaPath =
      points.length > 1
        ? `${linePath} L${points[points.length - 1].px.toFixed(1)},${baseline} L${points[0].px.toFixed(1)},${baseline} Z`
        : '';
    const ticks = [0, 1, 2, 3, 4].map((t) => ({
      value: (max / 4) * t,
      py: y((max / 4) * t),
    }));
    // Etiquetas X espaciadas: como máximo ~6 visibles
    const labelEvery = Math.max(1, Math.ceil(data.length / 6));
    return { points, linePath, areaPath, ticks, baseline, x, labelEvery };
  }, [width, height, data]);

  const pickNearest = (clientX: number) => {
    if (!plot || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    let nearest = 0;
    let best = Infinity;
    plot.points.forEach((p, i) => {
      const d = Math.abs(p.px - px);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  };

  const onPointerMove = (e: PointerEvent) => pickNearest(e.clientX);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHoverIdx((i) => Math.min((i ?? -1) + 1, data.length - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHoverIdx((i) => Math.max((i ?? data.length) - 1, 0));
    } else if (e.key === 'Escape') {
      setHoverIdx(null);
    }
  };

  const hovered = hoverIdx != null && plot ? plot.points[hoverIdx] : null;
  const hoveredDatum = hoverIdx != null ? data[hoverIdx] : null;

  // Tooltip: a la derecha del punto salvo cerca del borde derecho
  const tooltipLeft =
    hovered && width > 0
      ? hovered.px + 12 + 140 > width
        ? hovered.px - 12 - 140
        : hovered.px + 12
      : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      style={{ height }}
      tabIndex={0}
      role="img"
      aria-label={`Gráfica de ${seriesLabel}: ${data.length} períodos`}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHoverIdx(null)}
      onKeyDown={onKeyDown}
    >
      {plot && (
        <svg width={width} height={height} className="block">
          {/* Gridlines horizontales (hairline, recesivas) */}
          {plot.ticks.map((t) => (
            <line
              key={t.value}
              x1={M.left}
              x2={width - M.right}
              y1={t.py}
              y2={t.py}
              stroke="var(--color-edge)"
              strokeWidth={1}
            />
          ))}
          {/* Ticks del eje Y */}
          {plot.ticks.map((t) => (
            <text
              key={`label-${t.value}`}
              x={M.left - 8}
              y={t.py + 3.5}
              textAnchor="end"
              className="fill-ink-muted"
              fontSize={10}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {t.value.toLocaleString('es-BO')}
            </text>
          ))}
          {/* Etiquetas X espaciadas */}
          {data.map((d, i) =>
            i % plot.labelEvery === 0 ? (
              <text
                key={`x-${i}`}
                x={plot.points[i].px}
                y={height - 8}
                textAnchor="middle"
                className="fill-ink-muted"
                fontSize={10}
              >
                {d.label}
              </text>
            ) : null
          )}
          {/* Área al 10% */}
          {plot.areaPath && (
            <path d={plot.areaPath} fill="var(--color-primary)" opacity={0.1} />
          )}
          {/* Línea 2px */}
          {data.length > 1 && (
            <path
              d={plot.linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {/* Crosshair */}
          {hovered && (
            <line
              x1={hovered.px}
              x2={hovered.px}
              y1={M.top}
              y2={plot.baseline}
              stroke="var(--color-ink-muted)"
              strokeWidth={1}
            />
          )}
          {/* Punto final o punto activo: 8px con anillo de superficie 2px */}
          {(hovered ?? plot.points[plot.points.length - 1]) && (
            <circle
              cx={(hovered ?? plot.points[plot.points.length - 1]).px}
              cy={(hovered ?? plot.points[plot.points.length - 1]).py}
              r={4}
              fill="var(--color-primary)"
              stroke="var(--color-surface)"
              strokeWidth={2}
            />
          )}
        </svg>
      )}
      {/* Tooltip: el valor manda, la etiqueta acompaña */}
      {hovered && hoveredDatum && (
        <div
          className="pointer-events-none absolute z-10 w-[140px] rounded-lg border border-edge bg-surface px-3 py-2 shadow-md"
          style={{ left: tooltipLeft, top: Math.max(hovered.py - 44, 0) }}
        >
          <p className="text-sm font-bold text-ink tabular-nums">
            {hoveredDatum.value.toLocaleString('es-BO')}
          </p>
          <p className="text-xs text-ink-muted truncate">{hoveredDatum.label}</p>
        </div>
      )}
    </div>
  );
}
