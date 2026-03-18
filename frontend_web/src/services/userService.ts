import api from './api';
import { User, CreateUserDto, UpdateUserDto } from '../types';

export const userService = {
  // Obtener todos los usuarios
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  // Obtener solo transportistas
  getDrivers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/drivers');
    return response.data;
  },

  // Obtener personal de almacén
  getWarehouseStaff: async (warehouseId?: number): Promise<User[]> => {
    const params = warehouseId ? { warehouseId } : {};
    const response = await api.get<User[]>('/users/warehouse-staff', { params });
    return response.data;
  },

  // Obtener un usuario por ID
  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  // Crear un nuevo usuario
  create: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  // Actualizar un usuario
  update: async (id: number, data: UpdateUserDto): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  // Eliminar un usuario
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
