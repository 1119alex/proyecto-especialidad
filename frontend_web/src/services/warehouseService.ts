import api from './api';
import { Warehouse, CreateWarehouseDto, UpdateWarehouseDto, User } from '../types';

export const warehouseService = {
  // Obtener todos los almacenes
  getAll: async (): Promise<Warehouse[]> => {
    const response = await api.get<Warehouse[]>('/warehouses');
    return response.data;
  },

  // Obtener un almacén por ID
  getById: async (id: number): Promise<Warehouse> => {
    const response = await api.get<Warehouse>(`/warehouses/${id}`);
    return response.data;
  },

  // Obtener encargados disponibles (sin asignar a ningún almacén)
  getAvailableManagers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/warehouses/managers/available');
    return response.data;
  },

  // Crear un nuevo almacén
  create: async (data: CreateWarehouseDto): Promise<Warehouse> => {
    const response = await api.post<Warehouse>('/warehouses', data);
    return response.data;
  },

  // Actualizar un almacén
  update: async (id: number, data: UpdateWarehouseDto): Promise<Warehouse> => {
    const response = await api.patch<Warehouse>(`/warehouses/${id}`, data);
    return response.data;
  },

  // Eliminar un almacén
  delete: async (id: number): Promise<void> => {
    await api.delete(`/warehouses/${id}`);
  },
};
