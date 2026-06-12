import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge, getStatusLabel } from '../components/ui/StatusBadge';
import { reportService, TransfersReport } from '../services/reportService';
import { vehicleService } from '../services/vehicleService';
import { warehouseService } from '../services/warehouseService';
import { Transfer, Vehicle, Warehouse, TransferStatus } from '../types';

const ACTIVE_STATUSES: TransferStatus[] = [
  'EN_PREPARACION',
  'LISTA_DESPACHO',
  'EN_TRANSITO',
  'LLEGADA_DESTINO',
];

const STATUS_BAR_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-slate-400',
  ASIGNADA: 'bg-blue-500',
  EN_PREPARACION: 'bg-yellow-500',
  LISTA_DESPACHO: 'bg-orange-500',
  EN_TRANSITO: 'bg-info',
  LLEGADA_DESTINO: 'bg-indigo-500',
  COMPLETADA: 'bg-success',
  COMPLETADA_CON_DISCREPANCIA: 'bg-warning',
  CANCELADA: 'bg-danger',
};

const formatMinutes = (minutes: number | null): string => {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
};

const Dashboard: React.FC = () => {
  const [report, setReport] = useState<TransfersReport | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [reportData, vehicleData, warehouseData] = await Promise.all([
          reportService.getTransfersReport({}),
          vehicleService.getAll().catch(() => [] as Vehicle[]),
          warehouseService.getAll().catch(() => [] as Warehouse[]),
        ]);
        setReport(reportData);
        setVehicles(vehicleData);
        setWarehouses(warehouseData);
      } catch {
        setError('No se pudieron cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const transfers = report?.transfers ?? [];
  const byStatus = report?.summary.byStatus ?? {};
  const total = report?.summary.total ?? 0;

  const inTransit = byStatus['EN_TRANSITO'] ?? 0;
  const completed =
    (byStatus['COMPLETADA'] ?? 0) + (byStatus['COMPLETADA_CON_DISCREPANCIA'] ?? 0);
  const discrepancies = report?.summary.withDiscrepancies ?? 0;

  const activeTransfers = transfers.filter((t) =>
    ACTIVE_STATUSES.includes(t.status)
  );
  const recentTransfers = transfers.slice(0, 6);

  const availableVehicles = vehicles.filter(
    (v) => v.status === 'DISPONIBLE' || v.isAvailable
  ).length;
  const activeWarehouses = warehouses.filter((w) => w.isActive).length;

  const statusEntries = Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <MainLayout>
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="bg-danger-soft border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm"
          >
            {error}
          </div>
        )}

        {/* KPIs principales */}
        <section aria-label="Indicadores principales">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Transferencias totales"
              value={total}
              loading={loading}
              accent="primary"
              sub="Histórico completo"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
              }
            />
            <StatCard
              label="En tránsito ahora"
              value={inTransit}
              loading={loading}
              accent="info"
              sub="Con seguimiento GPS activo"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              label="Completadas"
              value={completed}
              loading={loading}
              accent="success"
              sub={
                total > 0
                  ? `${Math.round((completed / total) * 100)}% del total`
                  : undefined
              }
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              label="Con discrepancias"
              value={discrepancies}
              loading={loading}
              accent="warning"
              sub="Requieren revisión del detalle"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Indicadores de recursos */}
        <section aria-label="Indicadores de recursos">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Vehículos disponibles"
              value={`${availableVehicles}/${vehicles.length}`}
              loading={loading}
              accent="neutral"
              sub="Listos para asignación"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              }
            />
            <StatCard
              label="Almacenes activos"
              value={activeWarehouses}
              loading={loading}
              accent="neutral"
              sub="Puntos de operación"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              label="Tránsito promedio"
              value={formatMinutes(report?.summary.averageTransitMinutes ?? null)}
              loading={loading}
              accent="neutral"
              sub="De salida a llegada real"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribución por estado */}
          <section
            aria-label="Distribución por estado"
            className="bg-surface border border-edge rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-base font-semibold text-ink mb-4">
              Distribución por estado
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 rounded-md bg-app motion-safe:animate-pulse" />
                ))}
              </div>
            ) : statusEntries.length === 0 ? (
              <p className="text-sm text-ink-muted py-8 text-center">
                Aún no hay transferencias registradas
              </p>
            ) : (
              <ul role="list" className="space-y-3">
                {statusEntries.map(([status, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <li key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-ink-soft">
                          {getStatusLabel(status as TransferStatus)}
                        </span>
                        <span className="tabular-nums text-ink font-semibold">
                          {count}
                          <span className="text-ink-muted font-normal text-xs ml-1">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full bg-app overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${getStatusLabel(status as TransferStatus)}: ${pct}%`}
                      >
                        <div
                          className={`h-full rounded-full ${STATUS_BAR_COLORS[status] ?? 'bg-slate-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Operación en curso */}
          <section
            aria-label="Transferencias activas"
            className="bg-surface border border-edge rounded-lg p-6 shadow-sm lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink">
                Operación en curso
                {activeTransfers.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-info-soft text-info">
                    {activeTransfers.length}
                  </span>
                )}
              </h2>
              <Link
                to="/transfers"
                className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                Ver todas →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-app motion-safe:animate-pulse" />
                ))}
              </div>
            ) : activeTransfers.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-ink-muted">
                  No hay transferencias en curso en este momento
                </p>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-edge">
                {activeTransfers.slice(0, 5).map((transfer: Transfer) => (
                  <li
                    key={transfer.id}
                    className="py-3 flex items-center gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">
                          {transfer.transferCode}
                        </span>
                        <StatusBadge status={transfer.status} />
                      </div>
                      <p className="text-sm text-ink-soft truncate mt-0.5">
                        {transfer.originWarehouse?.name ?? '—'}
                        <span className="text-ink-muted mx-1.5">→</span>
                        {transfer.destinationWarehouse?.name ?? '—'}
                      </p>
                    </div>
                    <div className="hidden sm:block text-right flex-shrink-0">
                      <p className="text-sm text-ink-soft">
                        {transfer.driver
                          ? `${transfer.driver.firstName} ${transfer.driver.lastName}`
                          : 'Sin conductor'}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {transfer.vehicle?.licensePlate ?? 'Sin vehículo'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Actividad reciente */}
        <section
          aria-label="Actividad reciente"
          className="bg-surface border border-edge rounded-lg shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-edge flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Actividad reciente</h2>
            <Link
              to="/reports"
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Ver reportes →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-edge">
              <thead className="bg-app">
                <tr>
                  {['Código', 'Ruta', 'Estado', 'Conductor', 'Creada'].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {loading ? (
                  [0, 1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-5 rounded bg-app motion-safe:animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : recentTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-ink-muted">
                      Sin actividad registrada
                    </td>
                  </tr>
                ) : (
                  recentTransfers.map((transfer: Transfer) => (
                    <tr key={transfer.id} className="hover:bg-app transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-ink">
                        {transfer.transferCode}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-ink-soft">
                        {transfer.originWarehouse?.name ?? '—'}
                        <span className="text-ink-muted mx-1">→</span>
                        {transfer.destinationWarehouse?.name ?? '—'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <StatusBadge status={transfer.status} />
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-ink-soft">
                        {transfer.driver
                          ? `${transfer.driver.firstName} ${transfer.driver.lastName}`
                          : '—'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-ink-muted tabular-nums">
                        {new Date(transfer.createdAt).toLocaleString('es-BO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
