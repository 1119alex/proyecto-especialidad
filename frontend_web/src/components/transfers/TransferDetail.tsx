import React, { useState, useEffect } from 'react';
import { transferService } from '../../services/transferService';
import { Transfer, TrackingLog, TransferStatus } from '../../types';
import { TrackingMap } from './TrackingMap';

interface TransferDetailProps {
  transfer: Transfer;
  onClose: () => void;
  onUpdate: () => void;
}

const TransferDetail: React.FC<TransferDetailProps> = ({ transfer: initialTransfer, onClose, onUpdate }) => {
  const [transfer, setTransfer] = useState<Transfer>(initialTransfer);
  const [qrData, setQrData] = useState<{ qrCode: string; qrImage: string } | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receivedQuantities, setReceivedQuantities] = useState<{ [key: number]: number }>({});
  const [cancellationReason, setCancellationReason] = useState('');

  // Load QR and tracking data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load QR for all states except CANCELADA
        if (transfer.status !== 'CANCELADA') {
          const qr = await transferService.getQRCode(transfer.id);
          setQrData(qr);
        }

        // Load tracking history if in transit or completed
        if (['EN_TRANSITO', 'LLEGADA_DESTINO', 'COMPLETADA', 'COMPLETADA_CON_DISCREPANCIA'].includes(transfer.status)) {
          const tracking = await transferService.getTrackingHistory(transfer.id);
          setTrackingHistory(tracking);
        }
      } catch (err) {
        console.error('Error loading transfer data:', err);
      }
    };

    loadData();

    // Initialize received quantities with expected quantities
    const initialQuantities: { [key: number]: number } = {};
    transfer.details.forEach(detail => {
      initialQuantities[detail.productId] = detail.quantityExpected;
    });
    setReceivedQuantities(initialQuantities);
  }, [transfer]);

  // Auto-refresh tracking for active transfers
  useEffect(() => {
    if (transfer.status === 'EN_TRANSITO') {
      const interval = setInterval(async () => {
        try {
          const tracking = await transferService.getTrackingHistory(transfer.id);
          setTrackingHistory(tracking);
        } catch (err) {
          console.error('Error refreshing tracking:', err);
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [transfer.id, transfer.status]);

  const refreshTransfer = async () => {
    try {
      const updated = await transferService.getById(transfer.id);
      setTransfer(updated);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar transferencia');
    }
  };

  const handleStateAction = async (action: string) => {
    setLoading(true);
    setError('');

    try {
      switch (action) {
        case 'start-preparation':
          await transferService.startPreparation(transfer.id);
          break;
        case 'start-transit':
          await transferService.startTransit(transfer.id);
          break;
        case 'arrive-destination':
          await transferService.arriveDestination(transfer.id);
          break;
        case 'complete':
          const quantities = transfer.details.map(d => ({
            productId: d.productId,
            quantity: receivedQuantities[d.productId] || d.quantityExpected,
          }));
          await transferService.complete(transfer.id, quantities);
          break;
        case 'cancel':
          if (!cancellationReason.trim()) {
            setError('Debe proporcionar una razón para cancelar');
            setLoading(false);
            return;
          }
          await transferService.cancel(transfer.id, cancellationReason);
          break;
      }
      await refreshTransfer();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al ejecutar la acción');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Detalle de Transferencia
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Código: <span className="font-semibold">{transfer.transferCode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className={`mt-1 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusBadgeClass(transfer.status)}`}>
                  {getStatusLabel(transfer.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Creado por</p>
                <p className="font-medium">
                  {transfer.createdBy
                    ? `${transfer.createdBy.firstName} ${transfer.createdBy.lastName}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha Creación</p>
                <p className="font-medium">
                  {new Date(transfer.createdAt).toLocaleString('es-BO')}
                </p>
              </div>
              {transfer.completedAt && (
                <div>
                  <p className="text-sm text-gray-500">Fecha Completado</p>
                  <p className="font-medium">
                    {new Date(transfer.completedAt).toLocaleString('es-BO')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Route Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Origen</h4>
              <p className="font-medium">{transfer.originWarehouse?.name}</p>
              <p className="text-sm text-gray-600">{transfer.originWarehouse?.address}</p>
              <p className="text-sm text-gray-600">{transfer.originWarehouse?.city}</p>
              {transfer.qrVerifiedAtOrigin && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ QR Verificado: {new Date(transfer.qrVerifiedAtOrigin).toLocaleString('es-BO')}
                </p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Destino</h4>
              <p className="font-medium">{transfer.destinationWarehouse?.name}</p>
              <p className="text-sm text-gray-600">{transfer.destinationWarehouse?.address}</p>
              <p className="text-sm text-gray-600">{transfer.destinationWarehouse?.city}</p>
              {transfer.qrVerifiedAtDestination && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ QR Verificado: {new Date(transfer.qrVerifiedAtDestination).toLocaleString('es-BO')}
                </p>
              )}
            </div>
          </div>

          {/* Vehicle and Driver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Vehículo</h4>
              {transfer.vehicle ? (
                <>
                  <p className="font-medium">{transfer.vehicle.licensePlate}</p>
                  <p className="text-sm text-gray-600">{transfer.vehicle.model}</p>
                  <p className="text-sm text-gray-600">Capacidad: {transfer.vehicle.capacity} kg</p>
                </>
              ) : (
                <p className="text-gray-500 italic">No asignado</p>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Conductor</h4>
              {transfer.driver ? (
                <>
                  <p className="font-medium">
                    {transfer.driver.firstName} {transfer.driver.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{transfer.driver.phone}</p>
                  <p className="text-sm text-gray-600">{transfer.driver.email}</p>
                </>
              ) : (
                <p className="text-gray-500 italic">No asignado</p>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          {qrData && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Código QR</h4>
              <div className="flex items-center space-x-6">
                <div className="bg-white p-2 border-2 border-gray-300 rounded">
                  <img src={qrData.qrImage} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Escanea este código QR para verificar la transferencia en origen y destino.
                  </p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded border border-gray-300">
                    {qrData.qrCode}
                  </p>
                  <div className="mt-3 space-y-1">
                    {transfer.qrVerifiedAtOrigin ? (
                      <p className="text-sm text-green-600">✓ Verificado en origen</p>
                    ) : (
                      <p className="text-sm text-gray-500">○ Pendiente verificación en origen</p>
                    )}
                    {transfer.qrVerifiedAtDestination ? (
                      <p className="text-sm text-green-600">✓ Verificado en destino</p>
                    ) : (
                      <p className="text-sm text-gray-500">○ Pendiente verificación en destino</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GPS Tracking Map */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Seguimiento GPS en Tiempo Real
            </h4>

            <TrackingMap trackingData={trackingHistory} />

            {/* Mostrar mensaje de actualización automática si está en tránsito */}
            {transfer.status === 'EN_TRANSITO' && trackingHistory.length > 0 && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-800 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <strong>Actualización automática:</strong> El mapa se actualiza cada 30 segundos mientras la transferencia está en tránsito
                </p>
              </div>
            )}
          </div>

          {/* Products List */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Productos</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Cant. Esperada
                    </th>
                    {transfer.status === 'LLEGADA_DESTINO' && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Cant. Recibida
                      </th>
                    )}
                    {(transfer.status === 'COMPLETADA' || transfer.status === 'COMPLETADA_CON_DISCREPANCIA') && (
                      <>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Cant. Recibida
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfer.details.map(detail => (
                    <tr key={detail.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {detail.product?.sku}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {detail.product?.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {detail.quantityExpected}
                      </td>
                      {transfer.status === 'LLEGADA_DESTINO' && (
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={receivedQuantities[detail.productId] || detail.quantityExpected}
                            onChange={(e) =>
                              setReceivedQuantities(prev => ({
                                ...prev,
                                [detail.productId]: Number(e.target.value),
                              }))
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                      )}
                      {(transfer.status === 'COMPLETADA' || transfer.status === 'COMPLETADA_CON_DISCREPANCIA') && (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {detail.quantityReceived || detail.quantityExpected}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {detail.hasDiscrepancy ? (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Discrepancia
                              </span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                OK
                              </span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cancellation Section */}
          {transfer.status === 'CANCELADA' && transfer.cancellationReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">Cancelación</h4>
              <p className="text-sm text-red-800">
                <strong>Razón:</strong> {transfer.cancellationReason}
              </p>
              {transfer.cancelledAt && (
                <p className="text-xs text-red-600 mt-1">
                  Cancelada el: {new Date(transfer.cancelledAt).toLocaleString('es-BO')}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Acciones</h4>
            <div className="flex flex-wrap gap-3">
              {transfer.status === 'ASIGNADA' && (
                <button
                  onClick={() => handleStateAction('start-preparation')}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:bg-gray-400"
                >
                  Iniciar Preparación
                </button>
              )}

              {transfer.status === 'LISTA_DESPACHO' && (
                <button
                  onClick={() => handleStateAction('start-transit')}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
                >
                  Iniciar Tránsito
                </button>
              )}

              {transfer.status === 'EN_TRANSITO' && (
                <button
                  onClick={() => handleStateAction('arrive-destination')}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  Marcar Llegada a Destino
                </button>
              )}

              {transfer.status === 'LLEGADA_DESTINO' && (
                <button
                  onClick={() => handleStateAction('complete')}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  Completar Transferencia
                </button>
              )}

              {!['COMPLETADA', 'COMPLETADA_CON_DISCREPANCIA', 'CANCELADA'].includes(transfer.status) && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Razón de cancelación"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={() => handleStateAction('cancel')}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                  >
                    Cancelar Transferencia
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferDetail;
