import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User, UserRole } from '../types';
import MainLayout from '../components/layout/MainLayout';
import UserForm from '../components/users/UserForm';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      let data: User[];

      if (filter === 'TRANSPORTISTA') {
        data = await userService.getDrivers();
      } else if (filter === 'ENCARGADO_ALMACEN') {
        data = await userService.getWarehouseStaff();
      } else if (filter === 'ALL') {
        data = await userService.getAll();
      } else {
        // Filter by specific role (ADMIN)
        data = await userService.getAll();
        data = data.filter(u => u.role === filter);
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los usuarios');
      setUsers([]);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      await userService.delete(id);
      await loadUsers();
    } catch (err) {
      alert('Error al eliminar el usuario');
      console.error(err);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
    loadUsers();
  };

  const getRoleBadge = (role: UserRole) => {
    const roleColors = {
      ADMIN: 'bg-info-soft text-info',
      TRANSPORTISTA: 'bg-primary-soft text-primary',
      ENCARGADO_ALMACEN: 'bg-success-soft text-success',
    };

    const roleLabels = {
      ADMIN: 'Administrador',
      TRANSPORTISTA: 'Transportista',
      ENCARGADO_ALMACEN: 'Enc. Almacén',
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[role]}`}>
        {roleLabels[role]}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-ink">Usuarios</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-strong transition"
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-edge rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {([
              ['ALL', 'Todos'],
              ['ADMIN', 'Administradores'],
              ['TRANSPORTISTA', 'Transportistas'],
              ['ENCARGADO_ALMACEN', 'Encargados de Almacén'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === value
                    ? 'bg-primary text-white'
                    : 'bg-app text-ink-soft hover:bg-edge'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
            {/* Users Table */}
            <div className="bg-surface border border-edge rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-edge">
                <thead className="bg-app">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Rol
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
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-app transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-ink">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                          {user.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive
                                ? 'bg-success-soft text-success'
                                : 'bg-danger-soft text-danger'
                            }`}
                          >
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-primary hover:text-primary-strong mr-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-danger hover:opacity-80"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Form Modal */}
        {showForm && (
          <UserForm
            user={editingUser}
            onClose={handleFormClose}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Users;
