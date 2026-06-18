import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { User, CreateUserDto } from '../../types';

interface UserFormProps {
  user: User | null;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose }) => {
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'TRANSPORTISTA',
    isActive: true,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '', // No mostrar password en edición
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Si estamos editando y no se proporcionó password, quitarlo del payload
      const payload = user && !formData.password
        ? { ...formData, password: undefined }
        : formData;

      if (user) {
        await userService.update(user.id, payload);
      } else {
        await userService.create(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const showDriverFields = formData.role === 'TRANSPORTISTA';

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-edge w-full max-w-3xl shadow-lg rounded-lg bg-surface">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-ink">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
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
              <label htmlFor="firstName" className="block text-sm font-medium text-ink-soft mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="Ej: Juan"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-ink-soft mb-1">
                Apellido *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="Ej: Pérez"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-soft mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="ejemplo@empresa.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ink-soft mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder="+591 7XXXXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-ink-soft mb-1">
                Rol *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
              >
                <option value="ADMIN">Administrador</option>
                <option value="TRANSPORTISTA">Transportista</option>
                <option value="ENCARGADO_ALMACEN">Encargado de Almacén</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-soft mb-1">
                Contraseña {!user && '*'}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
                minLength={6}
                className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                placeholder={user ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
              />
            </div>
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
                Usuario activo
              </span>
            </label>
            <p className="text-xs text-ink-muted mt-1 ml-6">
              Los usuarios inactivos no podrán iniciar sesión en el sistema
            </p>
          </div>

          {/* Campos específicos para Transportista */}
          {showDriverFields && (
            <div className="border-t border-edge pt-4 mt-4">
              <h4 className="text-lg font-semibold mb-3 text-ink">Información del Transportista</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-ink-soft mb-1">
                    Número de Licencia
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                    placeholder="Ej: 12345678"
                  />
                </div>

                <div>
                  <label htmlFor="licenseExpiry" className="block text-sm font-medium text-ink-soft mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    id="licenseExpiry"
                    name="licenseExpiry"
                    value={formData.licenseExpiry || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                  />
                </div>
              </div>

              <h5 className="text-md font-semibold mt-4 mb-2 text-ink">Contacto de Emergencia</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-ink-soft mb-1">
                    Nombre del Contacto
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                    placeholder="Ej: María Pérez"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyPhone" className="block text-sm font-medium text-ink-soft mb-1">
                    Teléfono de Emergencia
                  </label>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface text-ink border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-ink-muted"
                    placeholder="+591 7XXXXXXX"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-primary-soft border border-primary/20 rounded-lg p-3 mt-4">
            <p className="text-sm text-primary">
              <strong>Nota:</strong> Los usuarios con rol de Administrador tienen acceso completo al sistema.
              Los Transportistas y Encargados de Almacén tienen permisos limitados según su rol.
              Para asignar un Encargado a un almacén, debe hacerlo desde el formulario de creación/edición de almacenes.
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
              {loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
