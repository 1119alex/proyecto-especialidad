import { ReactNode } from 'react';

export interface HBarRow {
  key: string;
  label: ReactNode;
  value: number;
  /** Texto mostrado en la punta de la barra; por defecto el valor numérico */
  display?: string;
  /** Clase Tailwind del relleno; por defecto el color primario */
  barClass?: string;
}

interface HBarChartProps {
  rows: HBarRow[];
  /** Máximo de la escala; por defecto el mayor valor de las filas */
  max?: number;
}

/**
 * Barras horizontales sin librerías: etiqueta + barra + valor visibles en cada
 * fila, de modo que la identidad y el dato nunca dependen solo del color.
 */
export function HBarChart({ rows, max }: HBarChartProps) {
  const scaleMax = max ?? Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const pct = scaleMax > 0 ? (row.value / scaleMax) * 100 : 0;
        return (
          <li
            key={row.key}
            className="group grid grid-cols-[9rem_1fr] items-center gap-3 sm:grid-cols-[11rem_1fr]"
          >
            <div className="min-w-0 text-xs text-ink-soft truncate" title={typeof row.label === 'string' ? row.label : undefined}>
              {row.label}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex-1 h-4 rounded-r bg-app overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-r transition-[filter] group-hover:brightness-110 ${row.barClass ?? 'bg-primary'}`}
                  style={{ width: `${pct}%`, minWidth: row.value > 0 ? '3px' : 0 }}
                  aria-hidden="true"
                />
              </div>
              <span className="w-14 shrink-0 text-xs font-semibold text-ink tabular-nums">
                {row.display ?? row.value.toLocaleString('es-BO')}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
