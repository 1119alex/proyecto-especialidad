import api from './api';
import {
  Warehouse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  User,
  InventoryItem,
  AdjustInventoryDto,
} from '../types';

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

  // Eliminar un almacén (el backend lo desactiva si tiene referencias)
  delete: async (id: number): Promise<{ deleted: boolean; message: string }> => {
    const response = await api.delete<{ deleted: boolean; message: string }>(
      `/warehouses/${id}`,
    );
    return response.data;
  },

  // Inventario del almacén
  getInventory: async (id: number): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>(`/warehouses/${id}/inventory`);
    return response.data;
  },

  // Agregar (ENTRADA) o fijar (AJUSTE) el stock de un producto según dto.mode
  adjustInventory: async (
    id: number,
    data: AdjustInventoryDto,
  ): Promise<InventoryItem> => {
    const response = await api.patch<InventoryItem>(
      `/warehouses/${id}/inventory`,
      data,
    );
    return response.data;
  },
};
