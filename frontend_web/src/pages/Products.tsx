import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/productService';
import { Product } from '../types';
import MainLayout from '../components/layout/MainLayout';
import ProductForm from '../components/products/ProductForm';
import { StatCard } from '../components/ui/StatCard';
import { StockMeter } from '../components/ui/StockMeter';

const totalStockOf = (product: Product): number =>
  (product.inventory ?? []).reduce((sum, item) => sum + Number(item.quantity), 0);

const hasLowWarehouse = (product: Product): boolean =>
  product.minStock > 0 &&
  (product.inventory ?? []).some((item) => Number(item.quantity) < product.minStock);

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState<string>('');

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term),
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive).length;
    const low = products.filter(hasLowWarehouse).length;
    const categories = new Set(products.map((p) => p.category).filter(Boolean)).size;
    return { total: products.length, active, low, categories };
  }, [products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await productService.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los productos');
      setProducts([]);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) {
      return;
    }

    try {
      const result = await productService.delete(id);
      if (result && result.deleted === false) {
        alert(result.message);
      }
      await loadProducts();
    } catch (err) {
      alert('Error al eliminar el producto');
      console.error(err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-ink">Productos</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-strong transition"
          >
            + Nuevo Producto
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-danger-soft border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total productos"
                value={stats.total.toLocaleString('es-BO')}
                accent="primary"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
              />
              <StatCard
                label="Activos"
                value={stats.active.toLocaleString('es-BO')}
                sub={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% del catálogo` : undefined}
                accent="success"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Con stock bajo"
                value={stats.low.toLocaleString('es-BO')}
                accent={stats.low > 0 ? 'warning' : 'success'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />
              <StatCard
                label="Categorías"
                value={stats.categories.toLocaleString('es-BO')}
                accent="neutral"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                }
              />
            </div>

            {/* Buscador */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por SKU, nombre o categoría..."
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
            />

            {/* Products Table */}
            <div className="bg-surface border border-edge rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-edge">
                <thead className="bg-app">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Unidad
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Stock Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Mínimo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider w-48">
                      Nivel
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
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-ink-muted">
                        {products.length === 0
                          ? 'No hay productos registrados'
                          : 'Sin resultados para la búsqueda'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const inventory = product.inventory ?? [];
                      const totalStock = totalStockOf(product);
                      const lowInWarehouses = hasLowWarehouse(product);
                      const stockBreakdown = inventory
                        .map(
                          (item) =>
                            `${item.warehouse?.name ?? `Almacén ${item.warehouseId}`}: ${Number(item.quantity)}`,
                        )
                        .join('\n');

                      return (
                      <tr key={product.id} className="hover:bg-app transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-ink">
                          {product.sku}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm text-ink"
                          title={product.description || undefined}
                        >
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                          {product.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                          {product.unit}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm text-right"
                          title={stockBreakdown || 'Sin stock registrado'}
                        >
                          <span
                            className={`font-bold ${
                              lowInWarehouses ? 'text-warning' : 'text-ink'
                            }`}
                          >
                            {totalStock}
                          </span>
                          {inventory.length > 0 && (
                            <span className="block text-xs text-ink-muted">
                              en {inventory.length} almac{inventory.length === 1 ? 'én' : 'enes'}
                            </span>
                          )}
                          {lowInWarehouses && (
                            <span className="block text-xs font-semibold text-warning">
                              Stock bajo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-ink-soft">
                          {product.minStock}
                        </td>
                        <td className="px-6 py-4">
                          <StockMeter
                            quantity={totalStock}
                            minStock={product.minStock}
                            showValue={false}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.isActive
                                ? 'bg-success-soft text-success'
                                : 'bg-danger-soft text-danger'
                            }`}
                          >
                            {product.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-primary hover:text-primary-strong mr-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-danger hover:opacity-80"
                          >
                            Eliminar
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
          </>
        )}

        {/* Form Modal */}
        {showForm && (
          <ProductForm
            product={editingProduct}
            onClose={handleFormClose}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Products;
