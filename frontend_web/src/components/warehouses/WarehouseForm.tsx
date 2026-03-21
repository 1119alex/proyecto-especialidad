import React, { useState, useEffect } from 'react';
import { warehouseService } from '../../services/warehouseService';
import { Warehouse, CreateWarehouseDto, User } from '../../types';

interface WarehouseFormProps {
  warehouse: Warehouse | null;
  onClose: () => void;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({ warehouse, onClose }) => {
  const [formData, setFormData] = useState<any>({
    code: '',
    name: '',
    address: '',
    city: '',
    phone: '',
    managerId: '',
    latitude: '',
    longitude: '',
  });
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingManagers, setLoadingManagers] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAvailableManagers();
  }, [warehouse]);

  useEffect(() => {
    if (warehouse) {
      const currentManager = warehouse.staff && warehouse.staff.length > 0
        ? warehouse.staff[0].userId
        : '';

      setFormData({
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address,
        city: warehouse.city,
        phone: warehouse.phone || '',
        managerId: currentManager.toString(),
        latitude: warehouse.latitude.toString(),
        longitude: warehouse.longitude.toString(),
      });
    }
  }, [warehouse]);

  const loadAvailableManagers = async () => {
    try {
      setLoadingManagers(true);
      const managers = await warehouseService.getAvailableManagers();

      // Si estamos editando y hay un manager asignado, incluirlo en la lista
      if (warehouse && warehouse.staff && warehouse.staff.length > 0) {
        const currentManager = warehouse.staff[0].user;
        if (currentManager && !managers.find(m => m.id === currentManager.id)) {
          setAvailableManagers([currentManager, ...managers]);
        } else {
          setAvailableManagers(managers);
        }
      } else {
        setAvailableManagers(managers);
      }
    } catch (err) {
      console.error('Error cargando encargados:', err);
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData: CreateWarehouseDto = {
        code: formData.code,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        phone: formData.phone || undefined,
        managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      if (warehouse) {
        await warehouseService.update(warehouse.id, submitData);
      } else {
        await warehouseService.create(submitData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el almacén');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {warehouse ? 'Editar Almacén' : 'Nuevo Almacén'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: ALM-001"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Almacén *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: Almacén Central"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: Av. Principal 123, La Paz"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: La Paz"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: 2-2123456"
              />
            </div>

            <div>
              <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-1">
                Encargado
              </label>
              <select
                id="managerId"
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                disabled={loadingManagers}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              >
                <option value="">Sin asignar</option>
                {availableManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName}
                  </option>
                ))}
              </select>
              {loadingManagers && (
                <p className="text-xs text-gray-500 mt-1">Cargando encargados...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                Latitud *
              </label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                step="0.00000001"
                min="-90"
                max="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="-16.5000"
              />
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                Longitud *
              </label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                step="0.00000001"
                min="-180"
                max="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="-68.1500"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Puedes obtener las coordenadas desde Google Maps haciendo clic derecho en el mapa y seleccionando las coordenadas.
            </p>
          </div>

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
              {loading ? 'Guardando...' : warehouse ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseForm;
