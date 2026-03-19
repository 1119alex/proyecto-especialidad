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
      } else if (filter === 'ENC_ORIGEN' || filter === 'ENC_DESTINO') {
        data = await userService.getWarehouseStaff();
        data = data.filter(u => u.role === filter);
      } else {
        data = await userService.getAll();
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
      ADMIN: 'bg-purple-100 text-purple-800',
      TRANSPORTISTA: 'bg-blue-100 text-blue-800',
      ENC_ORIGEN: 'bg-green-100 text-green-800',
      ENC_DESTINO: 'bg-orange-100 text-orange-800',
    };

    const roleLabels = {
      ADMIN: 'Administrador',
      TRANSPORTISTA: 'Transportista',
      ENC_ORIGEN: 'Enc. Origen',
      ENC_DESTINO: 'Enc. Destino',
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
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'ALL'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('ADMIN')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'ADMIN'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Administradores
            </button>
            <button
              onClick={() => setFilter('TRANSPORTISTA')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'TRANSPORTISTA'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Transportistas
            </button>
            <button
              onClick={() => setFilter('ENC_ORIGEN')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'ENC_ORIGEN'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Enc. Origen
            </button>
            <button
              onClick={() => setFilter('ENC_DESTINO')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'ENC_DESTINO'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Enc. Destino
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-primary hover:text-blue-900 mr-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
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
