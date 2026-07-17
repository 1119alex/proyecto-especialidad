interface StockMeterProps {
  quantity: number;
  minStock: number;
  /** Muestra el número y la unidad encima de la barra */
  unit?: string;
  showValue?: boolean;
}

type Severity = 'success' | 'warning' | 'danger' | 'neutral';

const FILL: Record<Severity, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-ink-muted',
};

const TRACK: Record<Severity, string> = {
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  neutral: 'bg-app',
};

const VALUE_TEXT: Record<Severity, string> = {
  success: 'text-ink',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-ink',
};

/**
 * Medidor de nivel de stock: una razón contra un límite (cantidad vs mínimo).
 * El relleno lleva la severidad y la pista es un tono suave del mismo color, de
 * modo que el estado se lee a lo largo de toda la barra. Una marca vertical
 * señala el umbral mínimo, y a escala completa el mínimo queda en el punto medio.
 */
export function StockMeter({ quantity, minStock, unit, showValue = true }: StockMeterProps) {
  const hasMin = minStock > 0;
  const empty = quantity <= 0;
  const below = hasMin && quantity < minStock;

  // Escala completa = doble del mínimo, así el umbral cae en el 50 %.
  const scaleMax = hasMin ? minStock * 2 : Math.max(quantity, 1);
  const pct = Math.min((quantity / scaleMax) * 100, 100);
  const thresholdPct = hasMin ? (minStock / scaleMax) * 100 : null;

  const severity: Severity = !hasMin ? 'neutral' : empty ? 'danger' : below ? 'warning' : 'success';

  const label = hasMin
    ? below
      ? `Bajo el mínimo (${minStock.toLocaleString('es-BO')})`
      : `Sobre el mínimo (${minStock.toLocaleString('es-BO')})`
    : 'Sin mínimo definido';

  return (
    <div className="min-w-[120px]">
      {showValue && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className={`text-sm font-bold tabular-nums ${VALUE_TEXT[severity]}`}>
            {quantity.toLocaleString('es-BO')}
            {unit && <span className="ml-1 text-xs font-normal text-ink-muted">{unit}</span>}
          </span>
        </div>
      )}
      <div
        className={`relative h-2.5 w-full rounded-full ${TRACK[severity]}`}
        role="meter"
        aria-valuenow={quantity}
        aria-valuemin={0}
        aria-valuemax={hasMin ? minStock * 2 : undefined}
        aria-label={label}
        title={label}
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${FILL[severity]}`}
          style={{ width: `${pct}%`, minWidth: quantity > 0 ? '4px' : 0 }}
        />
        {thresholdPct != null && (
          <div
            className="absolute -inset-y-1 w-0.5 rounded bg-ink-soft"
            style={{ left: `${thresholdPct}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
