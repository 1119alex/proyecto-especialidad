import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle, CreateVehicleDto } from '../../types';

interface VehicleFormProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, onClose }) => {
  const [formData, setFormData] = useState<CreateVehicleDto>({
    licensePlate: '',
    model: '',
    capacity: 0,
    status: 'DISPONIBLE',
    year: undefined,
    isAvailable: true,
    notes: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        licensePlate: vehicle.licensePlate,
        model: vehicle.model,
        year: vehicle.year,
        capacity: vehicle.capacity,
        status: vehicle.status,
        isAvailable: vehicle.isAvailable,
        notes: vehicle.notes || '',
      });
    }
  }, [vehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let processedValue: any = value;
    if (name === 'capacity') {
      processedValue = parseFloat(value) || 0;
    } else if (name === 'year') {
      processedValue = value ? parseInt(value) : undefined;
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
      if (vehicle) {
        await vehicleService.update(vehicle.id, formData);
      } else {
        await vehicleService.create(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-edge w-full max-w-2xl shadow-lg rounded-lg bg-surface">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-ink">
            {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
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
              <label htmlFor="licensePlate" className="block text-sm font-medium text-ink-soft mb-1">
                Placa del Vehículo *
              </label>
              <input
                type="text"
                id="licensePlate"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted uppercase"
                placeholder="Ej: ABC-1234"
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-ink-soft mb-1">
                Año
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year || ''}
                onChange={handleChange}
                min="1990"
                max={new Date().getFullYear() + 1}
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="Ej: 2023"
              />
            </div>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-ink-soft mb-1">
              Modelo del Vehículo *
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              placeholder="Ej: Isuzu NQR"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-ink-soft mb-1">
              Capacidad de Carga (kg) *
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              placeholder="Ej: 5000"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink-soft mb-1">
              Estado del Vehículo
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_USO">En Uso</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="FUERA_SERVICIO">Fuera de Servicio</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable || false}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-edge rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-ink-soft">
                Vehículo disponible para asignación
              </span>
            </label>
            <p className="text-xs text-ink-muted mt-1 ml-6">
              Los vehículos no disponibles no podrán ser asignados a transferencias
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-ink-soft mb-1">
              Notas / Observaciones
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              placeholder="Información adicional, mantenimientos, observaciones..."
            />
          </div>

          <div className="bg-primary-soft border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-primary">
              <strong>Nota:</strong> Los vehículos con estado "Disponible" estarán disponibles para asignar a nuevas transferencias.
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
              {loading ? 'Guardando...' : vehicle ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleForm;
