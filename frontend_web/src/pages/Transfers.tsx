import React, { useState, useEffect } from 'react';
import { transferService } from '../services/transferService';
import { Transfer, TransferStatus } from '../types';
import MainLayout from '../components/layout/MainLayout';
import TransferForm from '../components/transfers/TransferForm';
import TransferDetail from '../components/transfers/TransferDetail';

const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [viewingTransfer, setViewingTransfer] = useState<Transfer | null>(null);
  const [filterStatus, setFilterStatus] = useState<TransferStatus | 'ALL'>('ALL');

  const loadTransfers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await transferService.getAll();
      setTransfers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las transferencias');
      setTransfers([]);
      console.error('Error loading transfers:', err);
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
      console.error(err);
    }
  };

  const handleEdit = (transfer: Transfer) => {
    setEditingTransfer(transfer);
    setShowForm(true);
  };

  const handleView = (transfer: Transfer) => {
    setViewingTransfer(transfer);
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

  const getStatusBadgeClass = (status: TransferStatus): string => {
    const statusClasses: Record<TransferStatus, string> = {
      PENDIENTE: 'bg-gray-100 text-gray-800',
      ASIGNADA: 'bg-blue-100 text-blue-800',
      EN_PREPARACION: 'bg-yellow-100 text-yellow-800',
      LISTA_DESPACHO: 'bg-orange-100 text-orange-800',
      EN_TRANSITO: 'bg-purple-100 text-purple-800',
      LLEGADA_DESTINO: 'bg-indigo-100 text-indigo-800',
      COMPLETADA: 'bg-green-100 text-green-800',
      COMPLETADA_CON_DISCREPANCIA: 'bg-amber-100 text-amber-800',
      CANCELADA: 'bg-red-100 text-red-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: TransferStatus): string => {
    const labels: Record<TransferStatus, string> = {
      PENDIENTE: 'Pendiente',
      ASIGNADA: 'Asignada',
      EN_PREPARACION: 'En Preparación',
      LISTA_DESPACHO: 'Lista para Despacho',
      EN_TRANSITO: 'En Tránsito',
      LLEGADA_DESTINO: 'Llegada a Destino',
      COMPLETADA: 'Completada',
      COMPLETADA_CON_DISCREPANCIA: 'Completada con Discrepancia',
      CANCELADA: 'Cancelada',
    };
    return labels[status] || status;
  };

  const filteredTransfers = filterStatus === 'ALL'
    ? transfers
    : transfers.filter(t => t.status === filterStatus);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Transferencias</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            + Nueva Transferencia
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Estado
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TransferStatus | 'ALL')}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ASIGNADA">Asignada</option>
            <option value="EN_PREPARACION">En Preparación</option>
            <option value="LISTA_DESPACHO">Lista para Despacho</option>
            <option value="EN_TRANSITO">En Tránsito</option>
            <option value="LLEGADA_DESTINO">Llegada a Destino</option>
            <option value="COMPLETADA">Completada</option>
            <option value="COMPLETADA_CON_DISCREPANCIA">Completada con Discrepancia</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Transfers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Origen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destino
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehículo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conductor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransfers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No hay transferencias para mostrar
                        </td>
                      </tr>
                    ) : (
                      filteredTransfers.map((transfer) => (
                        <tr key={transfer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {transfer.transferCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {transfer.originWarehouse?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transfer.originWarehouse?.city}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {transfer.destinationWarehouse?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transfer.destinationWarehouse?.city}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transfer.vehicle?.licensePlate || 'Sin asignar'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {transfer.driver
                                ? `${transfer.driver.firstName} ${transfer.driver.lastName}`
                                : 'Sin asignar'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(transfer.status)}`}>
                              {getStatusLabel(transfer.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transfer.createdAt).toLocaleDateString('es-BO')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleView(transfer)}
                              className="text-primary hover:text-blue-900"
                            >
                              Ver
                            </button>
                            {transfer.status === 'PENDIENTE' && (
                              <>
                                <button
                                  onClick={() => handleEdit(transfer)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(transfer.id)}
                                  className="text-red-600 hover:text-red-900"
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm font-medium text-gray-500">Total</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {transfers.length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm font-medium text-gray-500">En Tránsito</div>
                <div className="mt-1 text-2xl font-semibold text-purple-600">
                  {transfers.filter(t => t.status === 'EN_TRANSITO').length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm font-medium text-gray-500">Completadas</div>
                <div className="mt-1 text-2xl font-semibold text-green-600">
                  {transfers.filter(t => t.status === 'COMPLETADA').length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm font-medium text-gray-500">Pendientes</div>
                <div className="mt-1 text-2xl font-semibold text-gray-600">
                  {transfers.filter(t => t.status === 'PENDIENTE' || t.status === 'ASIGNADA').length}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Forms and Modals */}
      {showForm && (
        <TransferForm
          transfer={editingTransfer}
          onClose={handleFormClose}
        />
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
