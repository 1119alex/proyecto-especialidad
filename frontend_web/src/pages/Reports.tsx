import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { reportService, TransfersReport, ReportFilters } from '../services/reportService';
import { warehouseService } from '../services/warehouseService';
import { Warehouse, TransferStatus } from '../types';

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

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ASIGNADA: 'Asignada',
  EN_PREPARACION: 'En Preparación',
  LISTA_DESPACHO: 'Lista para Despacho',
  EN_TRANSITO: 'En Tránsito',
  LLEGADA_DESTINO: 'Llegada a Destino',
  COMPLETADA: 'Completada',
  COMPLETADA_CON_DISCREPANCIA: 'Completada c/ Discrepancia',
  CANCELADA: 'Cancelada',
};

const Reports = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({ status: '' });
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

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getTransfersReport(filters);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError('');
    try {
      await reportService.downloadTransfersPdf(filters);
    } catch (err: any) {
      setError('Error al exportar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (date?: Date | string | null) =>
    date ? new Date(date).toLocaleString('es-BO') : '—';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
            <p className="text-gray-600">
              Historial de transferencias por período, estado, origen y destino
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {downloading ? 'Generando…' : 'Exportar PDF'}
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.from ?? ''}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.to ?? ''}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.status ?? ''}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as TransferStatus | '' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origen
              </label>
              <select
                value={filters.originWarehouseId ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    originWarehouseId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino
              </label>
              <select
                value={filters.destinationWarehouseId ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    destinationWarehouseId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="mt-4 flex justify-end">
            <button
              onClick={loadReport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Generando…' : 'Generar Reporte'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Resumen */}
        {report && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total transferencias</p>
                <p className="text-3xl font-bold text-gray-900">
                  {report.summary.total}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Completadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {(report.summary.byStatus['COMPLETADA'] ?? 0) +
                    (report.summary.byStatus['COMPLETADA_CON_DISCREPANCIA'] ?? 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Con discrepancias</p>
                <p className="text-3xl font-bold text-amber-600">
                  {report.summary.withDiscrepancies}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Tránsito promedio</p>
                <p className="text-3xl font-bold text-blue-600">
                  {report.summary.averageTransitMinutes != null
                    ? `${report.summary.averageTransitMinutes} min`
                    : '—'}
                </p>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Código', 'Ruta', 'Estado', 'Conductor', 'Creada', 'Llegada'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {t.transferCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t.originWarehouse?.name} → {t.destinationWarehouse?.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {STATUS_LABELS[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(t.actualArrivalTime)}
                      </td>
                    </tr>
                  ))}
                  {report.transfers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No se encontraron transferencias con los filtros aplicados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;
