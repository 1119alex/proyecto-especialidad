import React, { useMemo, useState, useEffect } from 'react';
import { transferService } from '../services/transferService';
import { Transfer, TransferStatus } from '../types';
import MainLayout from '../components/layout/MainLayout';
import TransferForm from '../components/transfers/TransferForm';
import TransferDetail from '../components/transfers/TransferDetail';
import { StatusBadge, getStatusLabel } from '../components/ui/StatusBadge';
import { StatCard } from '../components/ui/StatCard';

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

const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [viewingTransfer, setViewingTransfer] = useState<Transfer | null>(null);
  const [filterStatus, setFilterStatus] = useState<TransferStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState<string>('');

  const loadTransfers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await transferService.getAll();
      setTransfers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las transferencias');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta transferencia?')) {
      return;
    }

    try {
      await transferService.delete(id);
      await loadTransfers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar la transferencia');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTransfer(null);
    loadTransfers();
  };

  const handleDetailClose = () => {
    setViewingTransfer(null);
    loadTransfers();
  };

  const filteredTransfers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transfers.filter((t) => {
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      if (!term) return true;
      const haystack = [
        t.transferCode,
        t.originWarehouse?.name,
        t.destinationWarehouse?.name,
        t.vehicle?.licensePlate,
        t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [transfers, filterStatus, search]);

  const inTransit = transfers.filter((t) => t.status === 'EN_TRANSITO').length;
  const completedCount = transfers.filter(
    (t) =>
      t.status === 'COMPLETADA' || t.status === 'COMPLETADA_CON_DISCREPANCIA'
  ).length;
  const pendingCount = transfers.filter(
    (t) => t.status === 'PENDIENTE' || t.status === 'ASIGNADA'
  ).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Métricas rápidas */}
        <section aria-label="Resumen de transferencias">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total"
              value={transfers.length}
              loading={loading}
              accent="primary"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
              }
            />
            <StatCard
              label="En tránsito"
              value={inTransit}
              loading={loading}
              accent="info"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              label="Completadas"
              value={completedCount}
              loading={loading}
              accent="success"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              label="Por despachar"
              value={pendingCount}
              loading={loading}
              accent="neutral"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="bg-danger-soft border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm"
          >
            {error}
          </div>
        )}

        {/* Barra de herramientas */}
        <div className="bg-surface border border-edge rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label
                htmlFor="transfer-search"
                className="block text-sm font-medium text-ink-soft mb-1.5"
              >
                Buscar
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  id="transfer-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Código, almacén, placa o conductor…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-edge rounded-md bg-surface text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div className="w-full md:w-60">
              <label
                htmlFor="transfer-status-filter"
                className="block text-sm font-medium text-ink-soft mb-1.5"
              >
                Estado
              </label>
              <select
                id="transfer-status-filter"
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as TransferStatus | 'ALL')
                }
                className="w-full px-3 py-2 text-sm border border-edge rounded-md bg-surface text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              >
                <option value="ALL">Todos los estados</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white text-sm font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nueva Transferencia
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-surface border border-edge rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-edge flex items-center justify-between">
            <p className="text-sm text-ink-soft">
              {loading
                ? 'Cargando…'
                : `${filteredTransfers.length} de ${transfers.length} transferencias`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-edge">
              <thead className="bg-app">
                <tr>
                  {[
                    'Código',
                    'Origen',
                    'Destino',
                    'Vehículo',
                    'Conductor',
                    'Estado',
                    'Creación',
                  ].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {loading ? (
                  [0, 1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-6 py-4">
                        <div className="h-5 rounded bg-app motion-safe:animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center">
                      <p className="text-sm font-medium text-ink-soft">
                        No hay transferencias para mostrar
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        {search || filterStatus !== 'ALL'
                          ? 'Prueba ajustando la búsqueda o el filtro de estado'
                          : 'Crea la primera con el botón "Nueva Transferencia"'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-app transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-ink">
                          {transfer.transferCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ink">
                          {transfer.originWarehouse?.name || '—'}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {transfer.originWarehouse?.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-ink">
                          {transfer.destinationWarehouse?.name || '—'}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {transfer.destinationWarehouse?.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                        {transfer.vehicle?.licensePlate || (
                          <span className="text-ink-muted">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                        {transfer.driver ? (
                          `${transfer.driver.firstName} ${transfer.driver.lastName}`
                        ) : (
                          <span className="text-ink-muted">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={transfer.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-muted tabular-nums">
                        {new Date(transfer.createdAt).toLocaleDateString('es-BO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => setViewingTransfer(transfer)}
                          className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        >
                          Ver
                        </button>
                        {transfer.status === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => {
                                setEditingTransfer(transfer);
                                setShowForm(true);
                              }}
                              className="text-warning hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning rounded"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(transfer.id)}
                              className="text-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Forms and Modals */}
      {showForm && (
        <TransferForm transfer={editingTransfer} onClose={handleFormClose} />
      )}

      {viewingTransfer && (
        <TransferDetail
          transfer={viewingTransfer}
          onClose={handleDetailClose}
          onUpdate={loadTransfers}
        />
      )}
    </MainLayout>
  );
};

export default Transfers;
