import React, { useMemo, useState } from 'react';
import { warehouseService } from '../../services/warehouseService';
import { InventoryItem, Product } from '../../types';

interface StockAdjustFormProps {
  warehouseId: number;
  warehouseName: string;
  /** Item existente a ajustar; null para registrar stock de un producto nuevo */
  item: InventoryItem | null;
  /** Catálogo de productos activos (para el modo "registrar stock") */
  products: Product[];
  /** Productos que ya tienen registro en este almacén (para excluirlos del select) */
  existingProductIds: number[];
  onClose: () => void;
}

const StockAdjustForm: React.FC<StockAdjustFormProps> = ({
  warehouseId,
  warehouseName,
  item,
  products,
  existingProductIds,
  onClose,
}) => {
  const isNew = item === null;
  const currentQuantity = item ? Number(item.quantity) : 0;

  const [productId, setProductId] = useState<number>(item?.productId ?? 0);
  const [quantity, setQuantity] = useState<string>(
    item ? String(Number(item.quantity)) : '',
  );
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // En modo "registrar" solo se ofrecen productos sin registro en el almacén
  const selectableProducts = useMemo(
    () => products.filter((p) => !existingProductIds.includes(p.id)),
    [products, existingProductIds],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedQuantity = Number(quantity);
    if (isNew && productId === 0) {
      setError('Selecciona un producto');
      return;
    }
    if (quantity === '' || isNaN(parsedQuantity) || parsedQuantity < 0) {
      setError('La cantidad debe ser un número mayor o igual a 0');
      return;
    }

    try {
      setLoading(true);
      await warehouseService.adjustInventory(warehouseId, {
        productId: isNew ? productId : item!.productId,
        quantity: parsedQuantity,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al ajustar el stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-24 mx-auto p-5 border border-edge w-full max-w-md shadow-lg rounded-lg bg-surface">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-ink">
            {isNew ? 'Registrar stock' : 'Ajustar stock'}
          </h3>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-ink-soft mb-4">
          Almacén: <span className="font-semibold text-ink">{warehouseName}</span>
        </p>

        {error && (
          <div className="mb-4 bg-danger-soft border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-ink-soft mb-1">
              Producto *
            </label>
            {isNew ? (
              <select
                id="productId"
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={0}>Seleccionar producto...</option>
                {selectableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="px-3 py-2 bg-app border border-edge rounded-lg text-sm text-ink">
                {item?.product?.sku} — {item?.product?.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-ink-soft mb-1">
              Nueva cantidad total *
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="any"
              required
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              placeholder="0"
            />
            {!isNew && (
              <p className="text-xs text-ink-muted mt-1">
                Stock actual: {currentQuantity}. El stock quedará fijado en el
                valor indicado y la diferencia se registra como movimiento de
                AJUSTE.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-ink-soft mb-1">
              Motivo
            </label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={255}
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              placeholder="Ej: Reposición de stock inicial"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-edge rounded-lg text-ink-soft hover:bg-app transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-strong transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustForm;
