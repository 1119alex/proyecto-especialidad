import api from './api';
import { Vehicle, CreateVehicleDto, UpdateVehicleDto } from '../types';

export const vehicleService = {
  // Obtener todos los vehículos
  getAll: async (): Promise<Vehicle[]> => {
    const response = await api.get<Vehicle[]>('/vehicles');
    return response.data;
  },

  // Obtener vehículos disponibles
  getAvailable: async (): Promise<Vehicle[]> => {
    const response = await api.get<Vehicle[]>('/vehicles/available');
    return response.data;
  },

  // Obtener un vehículo por ID
  getById: async (id: number): Promise<Vehicle> => {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  // Crear un nuevo vehículo
  create: async (data: CreateVehicleDto): Promise<Vehicle> => {
    const response = await api.post<Vehicle>('/vehicles', data);
    return response.data;
  },

  // Actualizar un vehículo
  update: async (id: number, data: UpdateVehicleDto): Promise<Vehicle> => {
    const response = await api.patch<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  },

  // Eliminar un vehículo
  delete: async (id: number): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};
