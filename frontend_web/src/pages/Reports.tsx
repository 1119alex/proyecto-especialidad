import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { StatCard } from '../components/ui/StatCard';
import {
  StatusBadge,
  getStatusLabel,
  getStatusDotClass,
} from '../components/ui/StatusBadge';
import { ChartCard } from '../components/charts/ChartCard';
import { HBarChart, HBarRow } from '../components/charts/HBarChart';
import { TrendChart, TrendPoint } from '../components/charts/TrendChart';
import { reportService, TransfersReport, ReportFilters } from '../services/reportService';
import { warehouseService } from '../services/warehouseService';
import { Warehouse, Transfer, TransferStatus } from '../types';

const STATUS_OPTIONS: TransferStatus[] = [
  'PENDIENTE',
  'ASIGNADA',
  'EN_PREPARACION',
  'LISTA_DESPACHO',
  'EN_TRANSITO',
  'LLEGADA_DESTINO',
  'COMPLETADA',
  'COMPLETADA_CON_DISCREPANCIA',
  'CANCELADA',
];

const DATE_PRESETS = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
  { label: 'Todo', days: null },
] as const;

const toDateInput = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatMinutes = (minutes: number | null): string => {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
};

type Granularity = 'day' | 'week' | 'month';

/** Agrupa transferencias por fecha de creación con granularidad según el rango */
const buildTrend = (transfers: Transfer[]): { points: TrendPoint[]; granularity: Granularity } => {
  if (transfers.length === 0) return { points: [], granularity: 'day' };

  const dates = transfers.map((t) => new Date(t.createdAt));
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));
  const spanDays = Math.ceil((max.getTime() - min.getTime()) / 86_400_000) + 1;

  const granularity: Granularity = spanDays <= 45 ? 'day' : spanDays <= 200 ? 'week' : 'month';

  const bucketKey = (d: Date): string => {
    if (granularity === 'day') return toDateInput(d);
    if (granularity === 'week') {
      const monday = new Date(d);
      const diff = (d.getDay() + 6) % 7;
      monday.setDate(d.getDate() - diff);
      return toDateInput(monday);
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const counts = new Map<string, number>();
  dates.forEach((d) => {
    const key = bucketKey(d);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  // Rellenar huecos para que la línea no mienta sobre períodos sin actividad
  const points: TrendPoint[] = [];
  const cursor = new Date(bucketKey(min) + 'T00:00:00');
  const end = new Date(bucketKey(max) + 'T00:00:00');
  const dayFmt = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short' });
  const monthFmt = new Intl.DateTimeFormat('es-BO', { month: 'short', year: '2-digit' });

  while (cursor.getTime() <= end.getTime()) {
    const key = toDateInput(cursor);
    const label = granularity === 'month' ? monthFmt.format(cursor) : dayFmt.format(cursor);
    points.push({ label, value: counts.get(key) ?? 0 });
    if (granularity === 'day') cursor.setDate(cursor.getDate() + 1);
    else if (granularity === 'week') cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  return { points, granularity };
};

const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: 'por día',
  week: 'por semana',
  month: 'por mes',
};

const routeName = (t: Transfer): string =>
  `${t.originWarehouse?.name ?? '¿?'} → ${t.destinationWarehouse?.name ?? '¿?'}`;

const transitMinutes = (t: Transfer): number | null => {
  if (!t.actualDepartureTime || !t.actualArrivalTime) return null;
  const ms =
    new Date(t.actualArrivalTime).getTime() - new Date(t.actualDepartureTime).getTime();
  return ms > 0 ? ms / 60_000 : null;
};

const inputClasses =
  'w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

const Reports = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({ status: '' });
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [report, setReport] = useState<TransfersReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    warehouseService
      .getAll()
      .then(setWarehouses)
      .catch(() => setWarehouses([]));
  }, []);

  const loadReport = async (f: ReportFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getTransfersReport(f);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (idx: number) => {
    const preset = DATE_PRESETS[idx];
    const next: ReportFilters = { ...filters };
    if (preset.days == null) {
      next.from = undefined;
      next.to = undefined;
    } else {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - (preset.days - 1));
      next.from = toDateInput(from);
      next.to = toDateInput(to);
    }
    setActivePreset(idx);
    setFilters(next);
    loadReport(next);
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError('');
    try {
      await reportService.downloadTransfersPdf(filters);
    } catch {
      setError('Error al exportar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (date?: Date | string | null) =>
    date ? new Date(date).toLocaleString('es-BO') : '—';

  const transfers = report?.transfers ?? [];
  const byStatus = report?.summary.byStatus ?? {};
  const total = report?.summary.total ?? 0;
  const completed =
    (byStatus['COMPLETADA'] ?? 0) + (byStatus['COMPLETADA_CON_DISCREPANCIA'] ?? 0);
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}% del total` : undefined);

  const trend = useMemo(() => buildTrend(transfers), [transfers]);

  const statusRows: HBarRow[] = useMemo(
    () =>
      STATUS_OPTIONS.filter((s) => (byStatus[s] ?? 0) > 0).map((s) => ({
        key: s,
        label: (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span
              className={`w-1.5 h-1.5 shrink-0 rounded-full ${getStatusDotClass(s)}`}
              aria-hidden="true"
            />
            <span className="truncate">{getStatusLabel(s)}</span>
          </span>
        ),
        value: byStatus[s] ?? 0,
        barClass: getStatusDotClass(s),
      })),
    [byStatus]
  );

  const routeRows: HBarRow[] = useMemo(() => {
    const counts = new Map<string, number>();
    transfers.forEach((t) => {
      const r = routeName(t);
      counts.set(r, (counts.get(r) ?? 0) + 1);
    });
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 6);
    const restCount = sorted.slice(6).reduce((acc, [, n]) => acc + n, 0);
    const rows: HBarRow[] = top.map(([route, n]) => ({
      key: route,
      label: route,
      value: n,
    }));
    if (restCount > 0) {
      rows.push({
        key: '__otras__',
        label: `Otras (${sorted.length - 6})`,
        value: restCount,
        barClass: 'bg-ink-muted',
      });
    }
    return rows;
  }, [transfers]);

  const transitRows: HBarRow[] = useMemo(() => {
    const byRoute = new Map<string, { total: number; n: number }>();
    transfers.forEach((t) => {
      const mins = transitMinutes(t);
      if (mins == null) return;
      const r = routeName(t);
      const agg = byRoute.get(r) ?? { total: 0, n: 0 };
      agg.total += mins;
      agg.n += 1;
      byRoute.set(r, agg);
    });
    return [...byRoute.entries()]
      .map(([route, { total: sum, n }]) => ({ route, avg: sum / n, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 6)
      .map(({ route, avg, n }) => ({
        key: route,
        label: `${route} (${n})`,
        value: avg,
        display: formatMinutes(Math.round(avg)),
      }));
  }, [transfers]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-ink">Reportes</h2>
            <p className="text-ink-soft">
              Historial de transferencias por período, estado, origen y destino
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || loading}
            className="px-4 py-2 bg-danger text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {downloading ? 'Generando…' : 'Exportar PDF'}
          </button>
        </div>

        {/* Filtros: una sola fila encima de todo lo que alcanzan */}
        <div className="bg-surface border border-edge rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wide mr-1">
              Período
            </span>
            {DATE_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(idx)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                  activePreset === idx
                    ? 'bg-primary-soft border-primary text-primary font-semibold'
                    : 'bg-surface border-edge text-ink-soft hover:bg-app'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1">Desde</label>
              <input
                type="date"
                value={filters.from ?? ''}
                onChange={(e) => {
                  setActivePreset(null);
                  setFilters({ ...filters, from: e.target.value });
                }}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1">Hasta</label>
              <input
                type="date"
                value={filters.to ?? ''}
                onChange={(e) => {
                  setActivePreset(null);
                  setFilters({ ...filters, to: e.target.value });
                }}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1">Estado</label>
              <select
                value={filters.status ?? ''}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as TransferStatus | '' })
                }
                className={inputClasses}
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {getStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1">Origen</label>
              <select
                value={filters.originWarehouseId ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    originWarehouseId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className={inputClasses}
              >
                <option value="">Todos</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1">Destino</label>
              <select
                value={filters.destinationWarehouseId ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    destinationWarehouseId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className={inputClasses}
              >
                <option value="">Todos</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => loadReport(filters)}
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-strong transition disabled:opacity-50"
            >
              {loading ? 'Generando…' : 'Generar Reporte'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-danger-soft border border-danger/30 text-danger px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {report && (
          <div
            className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}
          >
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total transferencias"
                value={total.toLocaleString('es-BO')}
                accent="primary"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                }
              />
              <StatCard
                label="Completadas"
                value={completed.toLocaleString('es-BO')}
                sub={pct(completed)}
                accent="success"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Con discrepancias"
                value={(report.summary.withDiscrepancies ?? 0).toLocaleString('es-BO')}
                sub={pct(report.summary.withDiscrepancies ?? 0)}
                accent="warning"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />
              <StatCard
                label="Tránsito promedio"
                value={formatMinutes(report.summary.averageTransitMinutes)}
                accent="info"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Gráficas */}
            <ChartCard
              title="Transferencias creadas"
              subtitle={`Tendencia ${GRANULARITY_LABEL[trend.granularity]} en el período`}
              empty={trend.points.length === 0}
            >
              <TrendChart data={trend.points} seriesLabel="transferencias creadas" />
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Distribución por estado"
                subtitle="Cantidad de transferencias en cada estado"
                empty={statusRows.length === 0}
              >
                <HBarChart rows={statusRows} />
              </ChartCard>
              <ChartCard
                title="Rutas más frecuentes"
                subtitle="Transferencias por par origen → destino"
                empty={routeRows.length === 0}
              >
                <HBarChart rows={routeRows} />
              </ChartCard>
            </div>

            <ChartCard
              title="Tiempo de tránsito por ruta"
              subtitle="Promedio en rutas con viajes completados (entre paréntesis: nº de viajes)"
              empty={transitRows.length === 0}
              emptyMessage="Aún no hay viajes con salida y llegada registradas en el período"
            >
              <HBarChart rows={transitRows} />
            </ChartCard>

            {/* Tabla: vista de respaldo de todos los valores */}
            <div className="bg-surface border border-edge rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-edge">
                  <thead className="bg-app">
                    <tr>
                      {['Código', 'Ruta', 'Estado', 'Conductor', 'Creada', 'Llegada'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-app/60 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-ink">
                          {t.transferCode}
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-soft">
                          {t.originWarehouse?.name} → {t.destinationWarehouse?.name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-soft">
                          {t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-soft">
                          {formatDate(t.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-soft">
                          {formatDate(t.actualArrivalTime)}
                        </td>
                      </tr>
                    ))}
                    {transfers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                          No se encontraron transferencias con los filtros aplicados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;
