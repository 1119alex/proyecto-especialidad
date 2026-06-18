import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { transferService } from '../../services/transferService';
import { Transfer, TrackingLog } from '../../types';
import { TrackingMap } from './TrackingMap';
import { StatusBadge } from '../ui/StatusBadge';

// URL raíz del servidor (sin el prefijo /api/v1) para el WebSocket
const SOCKET_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
).replace(/\/api\/v1\/?$/, '');

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

  // Seguimiento en tiempo real vía WebSocket (sin polling): el backend
  // emite los puntos GPS a la room de la transferencia al guardarlos
  useEffect(() => {
    if (transfer.status !== 'EN_TRANSITO') return;

    const socket: Socket = io(`${SOCKET_BASE_URL}/tracking`, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join-transfer', transfer.id);
    });

    socket.on(
      'tracking:points',
      (payload: { transferId: number; points: TrackingLog[] }) => {
        if (payload.transferId !== transfer.id) return;
        setTrackingHistory((prev) => {
          const known = new Set(prev.map((p) => p.id));
          const newPoints = payload.points.filter((p) => !known.has(p.id));
          return newPoints.length > 0 ? [...prev, ...newPoints] : prev;
        });
      }
    );

    // Cambios de estado en vivo (ej. llegada detectada por geocerca)
    socket.on(
      'transfer:status',
      (payload: { transferId: number; type: string; status: string }) => {
        if (payload.transferId !== transfer.id) return;
        refreshTransfer();
      }
    );

    // Respaldo: si el socket no está conectado, refrescar por REST cada 60s
    const fallback = setInterval(async () => {
      if (socket.connected) return;
      try {
        const tracking = await transferService.getTrackingHistory(transfer.id);
        setTrackingHistory(tracking);
      } catch (err) {
        console.error('Error refreshing tracking:', err);
      }
    }, 60000);

    return () => {
      socket.emit('leave-transfer', transfer.id);
      socket.disconnect();
      clearInterval(fallback);
    };
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

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-edge w-full max-w-6xl shadow-lg rounded-lg bg-surface mb-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-bold text-ink">
              Detalle de Transferencia
            </h3>
            <p className="text-sm text-ink-muted mt-1">
              Código: <span className="font-semibold text-ink-soft">{transfer.transferCode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-danger-soft border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="bg-surface border border-edge rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-ink-muted mb-1">Estado</p>
                <StatusBadge status={transfer.status} />
              </div>
              <div>
                <p className="text-sm text-ink-muted">Creado por</p>
                <p className="font-medium text-ink">
                  {transfer.createdBy
                    ? `${transfer.createdBy.firstName} ${transfer.createdBy.lastName}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Fecha Creación</p>
                <p className="font-medium text-ink">
                  {new Date(transfer.createdAt).toLocaleString('es-BO')}
                </p>
              </div>
              {transfer.completedAt && (
                <div>
                  <p className="text-sm text-ink-muted">Fecha Completado</p>
                  <p className="font-medium text-ink">
                    {new Date(transfer.completedAt).toLocaleString('es-BO')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Route Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary-soft border border-primary/20 rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">Origen</h4>
              <p className="font-medium text-ink">{transfer.originWarehouse?.name}</p>
              <p className="text-sm text-ink-soft">{transfer.originWarehouse?.address}</p>
              <p className="text-sm text-ink-soft">{transfer.originWarehouse?.city}</p>
              {transfer.qrVerifiedAtOrigin && (
                <p className="text-xs text-success mt-2">
                  ✓ QR Verificado: {new Date(transfer.qrVerifiedAtOrigin).toLocaleString('es-BO')}
                </p>
              )}
            </div>

            <div className="bg-success-soft border border-success/20 rounded-lg p-4">
              <h4 className="font-semibold text-success mb-2">Destino</h4>
              <p className="font-medium text-ink">{transfer.destinationWarehouse?.name}</p>
              <p className="text-sm text-ink-soft">{transfer.destinationWarehouse?.address}</p>
              <p className="text-sm text-ink-soft">{transfer.destinationWarehouse?.city}</p>
              {transfer.qrVerifiedAtDestination && (
                <p className="text-xs text-success mt-2">
                  ✓ QR Verificado: {new Date(transfer.qrVerifiedAtDestination).toLocaleString('es-BO')}
                </p>
              )}
            </div>
          </div>

          {/* Vehicle and Driver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-app border border-edge rounded-lg p-4">
              <h4 className="font-semibold text-ink mb-2">Vehículo</h4>
              {transfer.vehicle ? (
                <>
                  <p className="font-medium text-ink">{transfer.vehicle.licensePlate}</p>
                  <p className="text-sm text-ink-soft">{transfer.vehicle.model}</p>
                  <p className="text-sm text-ink-soft">Capacidad: {transfer.vehicle.capacity} kg</p>
                </>
              ) : (
                <p className="text-ink-muted italic">No asignado</p>
              )}
            </div>

            <div className="bg-app border border-edge rounded-lg p-4">
              <h4 className="font-semibold text-ink mb-2">Conductor</h4>
              {transfer.driver ? (
                <>
                  <p className="font-medium text-ink">
                    {transfer.driver.firstName} {transfer.driver.lastName}
                  </p>
                  <p className="text-sm text-ink-soft">{transfer.driver.phone}</p>
                  <p className="text-sm text-ink-soft">{transfer.driver.email}</p>
                </>
              ) : (
                <p className="text-ink-muted italic">No asignado</p>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          {qrData && (
            <div className="bg-surface border border-edge rounded-lg p-4">
              <h4 className="font-semibold text-ink mb-3">Código QR</h4>
              <div className="flex items-center space-x-6">
                <div className="bg-white p-2 border-2 border-edge rounded">
                  <img src={qrData.qrImage} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink-soft mb-2">
                    Escanea este código QR para verificar la transferencia en origen y destino.
                  </p>
                  <p className="text-xs font-mono bg-app text-ink-soft p-2 rounded border border-edge break-all">
                    {qrData.qrCode}
                  </p>
                  <div className="mt-3 space-y-1">
                    {transfer.qrVerifiedAtOrigin ? (
                      <p className="text-sm text-success">✓ Verificado en origen</p>
                    ) : (
                      <p className="text-sm text-ink-muted">○ Pendiente verificación en origen</p>
                    )}
                    {transfer.qrVerifiedAtDestination ? (
                      <p className="text-sm text-success">✓ Verificado en destino</p>
                    ) : (
                      <p className="text-sm text-ink-muted">○ Pendiente verificación en destino</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GPS Tracking Map */}
          <div className="bg-surface border border-edge rounded-lg p-4">
            <h4 className="font-semibold text-ink mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-primary"
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
              <div className="mt-4 bg-success-soft border border-success/20 rounded p-3">
                <p className="text-sm text-success flex items-center">
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
          <div className="bg-surface border border-edge rounded-lg p-4">
            <h4 className="font-semibold text-ink mb-3">Productos</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-edge">
                <thead className="bg-app">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted uppercase">
                      Cant. Esperada
                    </th>
                    {transfer.status === 'LLEGADA_DESTINO' && (
                      <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted uppercase">
                        Cant. Recibida
                      </th>
                    )}
                    {(transfer.status === 'COMPLETADA' || transfer.status === 'COMPLETADA_CON_DISCREPANCIA') && (
                      <>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted uppercase">
                          Cant. Recibida
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted uppercase">
                          Estado
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {transfer.details.map(detail => (
                    <tr key={detail.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-soft">
                        {detail.product?.sku}
                      </td>
                      <td className="px-4 py-2 text-sm text-ink">
                        {detail.product?.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-soft">
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
                            className="w-20 px-2 py-1 bg-surface text-ink border border-edge rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </td>
                      )}
                      {(transfer.status === 'COMPLETADA' || transfer.status === 'COMPLETADA_CON_DISCREPANCIA') && (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-soft">
                            {detail.quantityReceived || detail.quantityExpected}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {detail.hasDiscrepancy ? (
                              <span className="text-xs bg-danger-soft text-danger px-2 py-1 rounded">
                                Discrepancia
                              </span>
                            ) : (
                              <span className="text-xs bg-success-soft text-success px-2 py-1 rounded">
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
            <div className="bg-danger-soft border border-danger/20 rounded-lg p-4">
              <h4 className="font-semibold text-danger mb-2">Cancelación</h4>
              <p className="text-sm text-danger">
                <strong>Razón:</strong> {transfer.cancellationReason}
              </p>
              {transfer.cancelledAt && (
                <p className="text-xs text-danger/80 mt-1">
                  Cancelada el: {new Date(transfer.cancelledAt).toLocaleString('es-BO')}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-app border border-edge rounded-lg p-4">
            <h4 className="font-semibold text-ink mb-3">Acciones</h4>
            <div className="flex flex-wrap gap-3">
              {transfer.status === 'ASIGNADA' && (
                <button
                  onClick={() => handleStateAction('start-preparation')}
                  disabled={loading}
                  className="px-4 py-2 bg-warning text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  Iniciar Preparación
                </button>
              )}

              {transfer.status === 'LISTA_DESPACHO' && (
                <p className="text-sm text-ink-soft bg-surface border border-edge rounded-lg px-4 py-2">
                  Esperando que el transportista escanee el código QR en el
                  origen para iniciar el tránsito.
                </p>
              )}

              {transfer.status === 'EN_TRANSITO' && (
                <button
                  onClick={() => handleStateAction('arrive-destination')}
                  disabled={loading}
                  className="px-4 py-2 bg-info text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  Marcar Llegada a Destino
                </button>
              )}

              {transfer.status === 'LLEGADA_DESTINO' && (
                <button
                  onClick={() => handleStateAction('complete')}
                  disabled={loading}
                  className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
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
                    className="px-3 py-2 bg-surface text-ink border border-edge rounded-lg placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-danger"
                  />
                  <button
                    onClick={() => handleStateAction('cancel')}
                    disabled={loading}
                    className="px-4 py-2 bg-danger text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
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
              className="px-6 py-2 border border-edge rounded-lg text-ink-soft hover:bg-app transition"
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
