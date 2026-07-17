import React, { useMemo, useState } from 'react';
import { warehouseService } from '../../services/warehouseService';
import { InventoryItem, InventoryAdjustMode, Product } from '../../types';

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
  // Por defecto se AGREGA al stock actual; el campo empieza vacío (cuánto sumar).
  const [mode, setMode] = useState<InventoryAdjustMode>('add');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // En modo "registrar" solo se ofrecen productos sin registro en el almacén
  const selectableProducts = useMemo(
    () => products.filter((p) => !existingProductIds.includes(p.id)),
    [products, existingProductIds],
  );

  // Distingue "catálogo no disponible" de "todos ya registrados aquí"
  const catalogEmpty = products.length === 0;
  const noneSelectable = isNew && selectableProducts.length === 0;

  const parsed = Number(quantity);
  const validNumber = quantity !== '' && !isNaN(parsed) && parsed >= 0;
  // Al registrar un producto nuevo el stock parte de 0, así que "agregar" y
  // "fijar" son equivalentes: se oculta el selector.
  const resultingQuantity =
    mode === 'add' && !isNew ? currentQuantity + parsed : parsed;

  // Al cambiar de modo, prellena "fijar total" con el stock actual como base
  const changeMode = (next: InventoryAdjustMode) => {
    setMode(next);
    if (next === 'set' && quantity === '' && !isNew) {
      setQuantity(String(currentQuantity));
    } else if (next === 'add') {
      setQuantity('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isNew && productId === 0) {
      setError('Selecciona un producto');
      return;
    }
    if (!validNumber) {
      setError('La cantidad debe ser un número mayor o igual a 0');
      return;
    }
    if (mode === 'add' && !isNew && parsed <= 0) {
      setError('La cantidad a agregar debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);
      await warehouseService.adjustInventory(warehouseId, {
        productId: isNew ? productId : item!.productId,
        quantity: parsed,
        // Registrar stock inicial cuenta como entrada (ENTRADA).
        mode: isNew ? 'add' : mode,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al ajustar el stock');
    } finally {
      setLoading(false);
    }
  };

  const quantityLabel = isNew
    ? 'Cantidad inicial *'
    : mode === 'add'
      ? 'Cantidad a agregar *'
      : 'Nueva cantidad total *';

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
            {isNew && noneSelectable ? (
              <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-3 text-sm text-warning">
                {catalogEmpty ? (
                  <>
                    No se pudo cargar el catálogo de productos. Cierra este cuadro y
                    recarga la página; si el problema persiste, revisa tu conexión.
                  </>
                ) : (
                  <>
                    Todos los productos activos ya tienen stock registrado en este
                    almacén. Para <span className="font-semibold">agregar</span> stock
                    usa el botón <span className="font-semibold">Ajustar</span> de la
                    fila; para registrar uno nuevo, créalo primero en{' '}
                    <span className="font-semibold">Productos</span>.
                  </>
                )}
              </div>
            ) : isNew ? (
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

          {/* Selector de modo (solo al ajustar un producto ya registrado) */}
          {!noneSelectable && !isNew && (
            <div>
              <span className="block text-sm font-medium text-ink-soft mb-1">Operación</span>
              <div className="inline-flex rounded-lg border border-edge overflow-hidden">
                <button
                  type="button"
                  onClick={() => changeMode('add')}
                  aria-pressed={mode === 'add'}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    mode === 'add'
                      ? 'bg-primary text-white'
                      : 'bg-surface text-ink-soft hover:bg-app'
                  }`}
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => changeMode('set')}
                  aria-pressed={mode === 'set'}
                  className={`px-4 py-2 text-sm font-medium transition border-l border-edge ${
                    mode === 'set'
                      ? 'bg-primary text-white'
                      : 'bg-surface text-ink-soft hover:bg-app'
                  }`}
                >
                  Fijar total
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                {mode === 'add'
                  ? 'Suma unidades al stock actual (entrada de mercadería).'
                  : 'Reemplaza el total, p. ej. tras un conteo físico (ajuste).'}
              </p>
            </div>
          )}

          {!noneSelectable && (
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-ink-soft mb-1">
                {quantityLabel}
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="any"
                required
                autoFocus
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="0"
              />
              {!isNew && (
                <p className="text-xs text-ink-muted mt-1">
                  Stock actual: <span className="font-semibold text-ink-soft">{currentQuantity}</span>
                  {validNumber && (
                    <>
                      {' '}→ quedará en{' '}
                      <span className="font-semibold text-ink">{resultingQuantity}</span>
                    </>
                  )}
                  {mode === 'add' ? ' (movimiento ENTRADA).' : ' (movimiento AJUSTE).'}
                </p>
              )}
            </div>
          )}

          {!noneSelectable && (
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
                placeholder={mode === 'add' ? 'Ej: Ingreso de mercadería' : 'Ej: Corrección por conteo físico'}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-edge rounded-lg text-ink-soft hover:bg-app transition"
            >
              {noneSelectable ? 'Cerrar' : 'Cancelar'}
            </button>
            {!noneSelectable && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-strong transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustForm;
