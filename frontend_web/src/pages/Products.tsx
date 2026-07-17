import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { Product } from '../types';
import MainLayout from '../components/layout/MainLayout';
import ProductForm from '../components/products/ProductForm';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
            {/* Products Table */}
            <div className="bg-surface border border-edge rounded-lg shadow-sm overflow-hidden">
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-ink-muted">
                        No hay productos registrados
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const inventory = product.inventory ?? [];
                      const totalStock = inventory.reduce(
                        (sum, item) => sum + Number(item.quantity),
                        0,
                      );
                      const lowInWarehouses =
                        product.minStock > 0 &&
                        inventory.some(
                          (item) => Number(item.quantity) < product.minStock,
                        );
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
