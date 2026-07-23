import React, { useEffect, useState } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { KardexMovement, KardexResult, MovementType } from '../../types';

interface KardexModalProps {
  /** Contexto de apertura: producto y almacén (uno u ambos) */
  productId?: number;
  warehouseId?: number;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

const TYPE_STYLES: Record<MovementType, { label: string; className: string }> = {
  ENTRADA: { label: 'Entrada', className: 'bg-success-soft text-success' },
  SALIDA: { label: 'Salida', className: 'bg-danger-soft text-danger' },
  AJUSTE: { label: 'Ajuste', className: 'bg-info-soft text-info' },
};

const KardexModal: React.FC<KardexModalProps> = ({
  productId,
  warehouseId,
  title,
  subtitle,
  onClose,
}) => {
  const [result, setResult] = useState<KardexResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<MovementType | ''>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await inventoryService.getMovements({
          productId,
          warehouseId,
          movementType: typeFilter || undefined,
          from: from || undefined,
          to: to || undefined,
        });
        if (!cancelled) setResult(data);
      } catch (err: any) {
        if (!cancelled)
          setError(err.response?.data?.message || 'Error al cargar el historial');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [productId, warehouseId, typeFilter, from, to]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-edge w-full max-w-4xl shadow-lg rounded-lg bg-surface mb-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-ink">{title}</h3>
            {subtitle && <p className="text-sm text-ink-soft mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Resumen */}
        {result && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border border-edge bg-app px-3 py-2">
              <p className="text-xs text-ink-muted">Movimientos</p>
              <p className="text-lg font-bold text-ink">{result.summary.total}</p>
            </div>
            <div className="rounded-lg border border-edge bg-app px-3 py-2">
              <p className="text-xs text-ink-muted">Entradas</p>
              <p className="text-lg font-bold text-success">{result.summary.entradas}</p>
            </div>
            <div className="rounded-lg border border-edge bg-app px-3 py-2">
              <p className="text-xs text-ink-muted">Salidas</p>
              <p className="text-lg font-bold text-danger">{result.summary.salidas}</p>
            </div>
            <div className="rounded-lg border border-edge bg-app px-3 py-2">
              <p className="text-xs text-ink-muted">Ajustes</p>
              <p className="text-lg font-bold text-info">{result.summary.ajustes}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MovementType | '')}
            className="px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
            <option value="AJUSTE">Ajustes</option>
          </select>
          <label className="text-sm text-ink-soft">
            Desde{' '}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="ml-1 px-2 py-1.5 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Hasta{' '}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="ml-1 px-2 py-1.5 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </label>
          {(typeFilter || from || to) && (
            <button
              onClick={() => {
                setTypeFilter('');
                setFrom('');
                setTo('');
              }}
              className="text-sm text-primary hover:text-primary-strong"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-danger-soft border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tabla */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="border border-edge rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-edge">
                <thead className="bg-app sticky top-0">
                  <tr>
                    <Th>Fecha</Th>
                    <Th>Tipo</Th>
                    {!productId && <Th>Producto</Th>}
                    {!warehouseId && <Th>Almacén</Th>}
                    <Th align="right">Cantidad</Th>
                    <Th align="right">Anterior → Nuevo</Th>
                    <Th>Motivo</Th>
                    <Th>Usuario</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {result && result.movements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-ink-muted text-sm">
                        Sin movimientos para los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    result?.movements.map((m: KardexMovement) => {
                      const style = TYPE_STYLES[m.movementType];
                      const sign = m.movementType === 'SALIDA' ? '−' : m.movementType === 'ENTRADA' ? '+' : '';
                      return (
                        <tr key={m.id} className="hover:bg-app transition-colors">
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-ink-soft">
                            {formatDate(m.createdAt)}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${style.className}`}>
                              {style.label}
                            </span>
                          </td>
                          {!productId && (
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-ink">
                              {m.product?.name ?? '-'}
                            </td>
                          )}
                          {!warehouseId && (
                            <td className="px-4 py-2.5 whitespace-nowrap text-sm text-ink-soft">
                              {m.warehouse?.name ?? '-'}
                            </td>
                          )}
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-right font-semibold text-ink">
                            {sign}{m.quantity}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-right text-ink-muted">
                            {m.previousQuantity} → <span className="font-semibold text-ink">{m.newQuantity}</span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-ink-soft max-w-xs truncate" title={m.reason ?? undefined}>
                            {m.transferCode ? (
                              <span className="font-medium text-primary">{m.transferCode}</span>
                            ) : (
                              m.reason || '-'
                            )}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-ink-soft">
                            {m.performedBy?.name ?? '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Th: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({
  children,
  align = 'left',
}) => (
  <th
    className={`px-4 py-2.5 text-${align} text-xs font-semibold text-ink-muted uppercase tracking-wider`}
  >
    {children}
  </th>
);

export default KardexModal;
