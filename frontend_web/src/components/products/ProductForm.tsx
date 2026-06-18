import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { Product, CreateProductDto } from '../../types';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category: '',
    unit: '',
    minStock: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        description: product.description || '',
        category: product.category || '',
        unit: product.unit,
        minStock: product.minStock,
        isActive: product.isActive,
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let processedValue: any = value;
    if (name === 'minStock') {
      processedValue = value ? parseInt(value) : 0;
    } else if (type === 'checkbox') {
      processedValue = checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (product) {
        await productService.update(product.id, formData);
      } else {
        await productService.create(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-edge w-full max-w-2xl shadow-lg rounded-lg bg-surface">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-ink">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-ink-soft mb-1">
                SKU (Código) *
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted uppercase"
                placeholder="Ej: PROD-001"
              />
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-ink-soft mb-1">
                Código de Barras
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="Ej: 7501234567890"
              />
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink-soft mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              placeholder="Ej: Laptop Dell Inspiron 15"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-ink-soft mb-1">
                Categoría
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="Ej: Electrónica"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-ink-soft mb-1">
                Unidad de Medida *
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              >
                <option value="">Seleccionar...</option>
                <option value="UNIDAD">Unidad</option>
                <option value="CAJA">Caja</option>
                <option value="PALLET">Pallet</option>
                <option value="KG">Kilogramo</option>
                <option value="LITRO">Litro</option>
                <option value="METRO">Metro</option>
              </select>
            </div>

            <div>
              <label htmlFor="minStock" className="block text-sm font-medium text-ink-soft mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ink-soft mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              placeholder="Descripción detallada del producto (opcional)"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive || false}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-edge rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-ink-soft">
                Producto activo
              </span>
            </label>
            <p className="text-xs text-ink-muted mt-1 ml-6">
              Los productos inactivos no estarán disponibles para nuevas transferencias
            </p>
          </div>

          <div className="bg-primary-soft border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-primary">
              <strong>Nota:</strong> El SKU debe ser único para cada producto y se utiliza para identificarlo en las transferencias. El stock mínimo se utiliza para alertas de inventario bajo.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
