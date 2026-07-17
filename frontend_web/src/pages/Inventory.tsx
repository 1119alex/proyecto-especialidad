import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import StockAdjustForm from '../components/inventory/StockAdjustForm';
import { StatCard } from '../components/ui/StatCard';
import { StockMeter } from '../components/ui/StockMeter';
import { warehouseService } from '../services/warehouseService';
import { productService } from '../services/productService';
import { InventoryItem, Product, Warehouse } from '../types';

const Inventory: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Cargar catálogos una vez; se selecciona el primer almacén activo
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [whData, prodData] = await Promise.all([
          warehouseService.getAll(),
          productService.getAll(),
        ]);
        const activeWarehouses = whData.filter((w) => w.isActive);
        setWarehouses(activeWarehouses);
        setProducts(prodData.filter((p) => p.isActive));
        if (activeWarehouses.length > 0) {
          setSelectedWarehouseId(activeWarehouses[0].id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar los catálogos');
        setLoading(false);
      }
    };
    loadCatalogs();
  }, []);

  const loadInventory = async (warehouseId: number) => {
    if (!warehouseId) return;
    try {
      setLoading(true);
      setError('');
      const data = await warehouseService.getInventory(warehouseId);
      setInventory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el inventario');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWarehouseId) {
      loadInventory(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

  const isLowStock = (item: InventoryItem): boolean => {
    const min = Number(item.product?.minStock ?? 0);
    return min > 0 && Number(item.quantity) < min;
  };

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter(
      (item) =>
        item.product?.name?.toLowerCase().includes(term) ||
        item.product?.sku?.toLowerCase().includes(term) ||
        item.product?.category?.toLowerCase().includes(term),
    );
  }, [inventory, search]);

  const lowStockCount = inventory.filter(isLowStock).length;

  const totalUnits = useMemo(
    () => inventory.reduce((sum, i) => sum + Number(i.quantity), 0),
    [inventory],
  );

  const categoryCount = useMemo(
    () => new Set(inventory.map((i) => i.product?.category).filter(Boolean)).size,
    [inventory],
  );

  const lowStockItems = useMemo(() => inventory.filter(isLowStock), [inventory]);

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    loadInventory(selectedWarehouseId);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-ink">Inventario</h1>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            disabled={!selectedWarehouseId}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-strong transition disabled:opacity-50"
          >
            + Registrar Stock
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="warehouse" className="sr-only">
              Almacén
            </label>
            <select
              id="warehouse"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
              className="px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {warehouses.length === 0 && (
                <option value={0}>Sin almacenes activos</option>
              )}
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU, nombre o categoría..."
            className="flex-1 min-w-[220px] px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
          />
        </div>

        {/* KPIs del almacén seleccionado */}
        {!loading && selectedWarehouseId > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Productos"
              value={inventory.length.toLocaleString('es-BO')}
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
            <StatCard
              label="Unidades en stock"
              value={totalUnits.toLocaleString('es-BO')}
              accent="info"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <StatCard
              label="Con stock bajo"
              value={lowStockCount.toLocaleString('es-BO')}
              accent={lowStockCount > 0 ? 'warning' : 'success'}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <StatCard
              label="Categorías"
              value={categoryCount.toLocaleString('es-BO')}
              accent="neutral"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Banner de stock bajo */}
        {!loading && lowStockItems.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-warning">
              <span className="font-semibold">
                {lowStockItems.length} producto{lowStockItems.length === 1 ? '' : 's'} bajo el mínimo:
              </span>{' '}
              {lowStockItems
                .slice(0, 4)
                .map((i) => i.product?.name ?? `#${i.productId}`)
                .join(', ')}
              {lowStockItems.length > 4 && ` y ${lowStockItems.length - 4} más`}.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-danger-soft border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tabla */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-surface border border-edge rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-edge">
              <thead className="bg-app">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider w-56">
                    Nivel de stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-ink-muted">
                      {inventory.length === 0
                        ? 'Este almacén aún no tiene stock registrado. Usa "Registrar Stock" para inicializarlo.'
                        : 'Sin resultados para la búsqueda'}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const low = isLowStock(item);
                    return (
                      <tr key={item.id} className="hover:bg-app transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-ink">
                          {item.product?.sku || `#${item.productId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                          {item.product?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                          {item.product?.category || '-'}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                            low ? 'text-warning' : 'text-ink'
                          }`}
                        >
                          {Number(item.quantity)}{' '}
                          <span className="font-normal text-ink-muted">
                            {item.product?.unit?.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-ink-soft">
                          {Number(item.product?.minStock ?? 0)}
                        </td>
                        <td className="px-6 py-4">
                          <StockMeter
                            quantity={Number(item.quantity)}
                            minStock={Number(item.product?.minStock ?? 0)}
                            showValue={false}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {low ? (
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-soft text-warning">
                              Stock bajo
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-soft text-success">
                              OK
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowForm(true);
                            }}
                            className="text-primary hover:text-primary-strong"
                          >
                            Ajustar
                          </button>
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

        {/* Modal */}
        {showForm && selectedWarehouse && (
          <StockAdjustForm
            warehouseId={selectedWarehouse.id}
            warehouseName={selectedWarehouse.name}
            item={editingItem}
            products={products}
            existingProductIds={inventory.map((i) => i.productId)}
            onClose={handleFormClose}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Inventory;
