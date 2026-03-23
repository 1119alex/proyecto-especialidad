import React, { useState, useEffect } from 'react';
import { transferService } from '../../services/transferService';
import { warehouseService } from '../../services/warehouseService';
import { vehicleService } from '../../services/vehicleService';
import { productService } from '../../services/productService';
import { userService } from '../../services/userService';
import { Transfer, CreateTransferDto, Warehouse, Vehicle, Product, User } from '../../types';

interface TransferFormProps {
  transfer: Transfer | null;
  onClose: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ transfer, onClose }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);

  const [formData, setFormData] = useState<CreateTransferDto>({
    originWarehouseId: 0,
    destinationWarehouseId: 0,
    vehicleId: undefined,
    driverId: undefined,
    estimatedDepartureTime: '',
    estimatedArrivalTime: '',
    details: [],
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load catalog data
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [whData, vehData, prodData, usersData] = await Promise.all([
          warehouseService.getAll(),
          vehicleService.getAll(),
          productService.getAll(),
          userService.getAll(),
        ]);

        setWarehouses(whData.filter(w => w.isActive));
        setVehicles(vehData.filter(v => v.isAvailable));
        setProducts(prodData.filter(p => p.isActive));
        setDrivers(usersData.filter(u => u.role === 'TRANSPORTISTA' && u.isActive));
      } catch (err) {
        console.error('Error loading catalogs:', err);
        setError('Error al cargar los catálogos');
      }
    };

    loadCatalogs();
  }, []);

  // Initialize form when editing
  useEffect(() => {
    if (transfer) {
      setFormData({
        originWarehouseId: transfer.originWarehouseId,
        destinationWarehouseId: transfer.destinationWarehouseId,
        vehicleId: transfer.vehicleId,
        driverId: transfer.driverId,
        estimatedDepartureTime: transfer.estimatedDepartureTime
          ? new Date(transfer.estimatedDepartureTime).toISOString().slice(0, 16)
          : '',
        estimatedArrivalTime: transfer.estimatedArrivalTime
          ? new Date(transfer.estimatedArrivalTime).toISOString().slice(0, 16)
          : '',
        details: transfer.details.map(d => ({
          productId: d.productId,
          quantity: d.quantityExpected,
        })),
      });
    }
  }, [transfer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : (name.includes('Id') ? Number(value) : value),
    }));
  };

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      details: [...prev.details, { productId: 0, quantity: 1 }],
    }));
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const handleProductChange = (index: number, field: 'productId' | 'quantity', value: string) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.map((detail, i) =>
        i === index
          ? { ...detail, [field]: field === 'quantity' ? Number(value) : Number(value) }
          : detail
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validations
    if (formData.originWarehouseId === formData.destinationWarehouseId) {
      setError('El almacén de origen y destino deben ser diferentes');
      setLoading(false);
      return;
    }

    if (formData.details.length === 0) {
      setError('Debe agregar al menos un producto a la transferencia');
      setLoading(false);
      return;
    }

    if (formData.details.some(d => d.productId === 0 || d.quantity <= 0)) {
      setError('Todos los productos deben tener un producto seleccionado y cantidad mayor a 0');
      setLoading(false);
      return;
    }

    try {
      // Prepare data: convert empty strings to undefined for optional fields
      const dataToSend: any = {
        ...formData,
        vehicleId: formData.vehicleId === 0 ? undefined : formData.vehicleId,
        driverId: formData.driverId === 0 ? undefined : formData.driverId,
        estimatedDepartureTime: formData.estimatedDepartureTime === '' ? undefined : formData.estimatedDepartureTime,
        estimatedArrivalTime: formData.estimatedArrivalTime === '' ? undefined : formData.estimatedArrivalTime,
        // Ensure details have numeric quantities
        details: formData.details.map(d => ({
          productId: Number(d.productId),
          quantity: Number(d.quantity),
        })),
      };

      // Remove undefined values to avoid sending them in PATCH requests
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });

      if (transfer) {
        await transferService.update(transfer.id, dataToSend);
      } else {
        await transferService.create(dataToSend);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {transfer ? 'Editar Transferencia' : 'Nueva Transferencia'}
          </h3>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Warehouses Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-gray-700">Almacenes</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="originWarehouseId" className="block text-sm font-medium text-gray-700 mb-1">
                  Almacén de Origen *
                </label>
                <select
                  id="originWarehouseId"
                  name="originWarehouseId"
                  value={formData.originWarehouseId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={0}>Seleccionar almacén...</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} - {wh.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="destinationWarehouseId" className="block text-sm font-medium text-gray-700 mb-1">
                  Almacén de Destino *
                </label>
                <select
                  id="destinationWarehouseId"
                  name="destinationWarehouseId"
                  value={formData.destinationWarehouseId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={0}>Seleccionar almacén...</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} - {wh.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle and Driver Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-gray-700">Asignación (Opcional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
                  Vehículo
                </label>
                <select
                  id="vehicleId"
                  name="vehicleId"
                  value={formData.vehicleId || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sin asignar</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate} - {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="driverId" className="block text-sm font-medium text-gray-700 mb-1">
                  Conductor
                </label>
                <select
                  id="driverId"
                  name="driverId"
                  value={formData.driverId || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sin asignar</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-gray-700">Programación (Opcional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedDepartureTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Salida Estimada
                </label>
                <input
                  type="datetime-local"
                  id="estimatedDepartureTime"
                  name="estimatedDepartureTime"
                  value={formData.estimatedDepartureTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="estimatedArrivalTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Llegada Estimada
                </label>
                <input
                  type="datetime-local"
                  id="estimatedArrivalTime"
                  name="estimatedArrivalTime"
                  value={formData.estimatedArrivalTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-gray-700">Productos *</h4>
              <button
                type="button"
                onClick={handleAddProduct}
                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm"
              >
                + Agregar Producto
              </button>
            </div>

            {formData.details.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.details.map((detail, index) => (
                  <div key={index} className="flex gap-3 items-end bg-white p-3 rounded border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto
                      </label>
                      <select
                        value={detail.productId}
                        onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={0}>Seleccionar producto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        value={detail.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Una vez creada la transferencia, puedes asignar vehículo y conductor desde la vista de detalle si no los asignas ahora.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition disabled:bg-gray-400"
            >
              {loading ? 'Guardando...' : transfer ? 'Actualizar' : 'Crear Transferencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferForm;
