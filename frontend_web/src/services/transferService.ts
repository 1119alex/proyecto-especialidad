import api from './api';
import { Transfer, CreateTransferDto, UpdateTransferDto, TrackingLog } from '../types';

export const transferService = {
  // Obtener todas las transferencias
  getAll: async (): Promise<Transfer[]> => {
    const response = await api.get<Transfer[]>('/transfers');
    return response.data;
  },

  // Obtener una transferencia por ID
  getById: async (id: number): Promise<Transfer> => {
    const response = await api.get<Transfer>(`/transfers/${id}`);
    return response.data;
  },

  // Crear una nueva transferencia
  create: async (data: CreateTransferDto): Promise<Transfer> => {
    const response = await api.post<Transfer>('/transfers', data);
    return response.data;
  },

  // Actualizar una transferencia
  update: async (id: number, data: UpdateTransferDto): Promise<Transfer> => {
    const response = await api.patch<Transfer>(`/transfers/${id}`, data);
    return response.data;
  },

  // Asignar vehículo y conductor
  assignVehicleAndDriver: async (
    id: number,
    vehicleId: number,
    driverId: number
  ): Promise<Transfer> => {
    const response = await api.patch<Transfer>(`/transfers/${id}/assign`, {
      vehicleId,
      driverId,
    });
    return response.data;
  },

  // Eliminar una transferencia
  delete: async (id: number): Promise<void> => {
    await api.delete(`/transfers/${id}`);
  },

  // === GESTIÓN DE ESTADOS ===

  // Iniciar preparación
  startPreparation: async (id: number): Promise<Transfer> => {
    const response = await api.patch<Transfer>(`/transfers/${id}/start-preparation`);
    return response.data;
  },

  // Iniciar tránsito
  startTransit: async (id: number): Promise<Transfer> => {
    const response = await api.patch<Transfer>(`/transfers/${id}/start-transit`);
    return response.data;
  },

  // Marcar llegada a destino
  arriveDestination: async (id: number): Promise<Transfer> => {
    const response = await api.patch<Transfer>(`/transfers/${id}/arrive-destination`);
    return response.data;
  },

  // Completar transferencia
  complete: async (
    id: number,
    receivedQuantities?: { productId: number; quantity: number }[]
  ): Promise<Transfer> => {
    const response = await api.patch<Transfer>(`/transfers/${id}/complete`, {
      receivedQuantities,
    });
    return response.data;
  },

  // Cancelar transferencia
  cancel: async (id: number, reason: string): Promise<Transfer> => {
    const response = await api.patch<Transfer>(`/transfers/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // === CÓDIGO QR ===

  // Obtener código QR
  getQRCode: async (id: number): Promise<{ qrCode: string; qrImage: string }> => {
    const response = await api.get<{ qrCode: string; qrImage: string }>(
      `/transfers/${id}/qr`
    );
    return response.data;
  },

  // Verificar código QR
  verifyQR: async (
    id: number,
    qrCode: string,
    location: 'origin' | 'destination'
  ): Promise<{ success: boolean; message: string; transfer?: Transfer }> => {
    const response = await api.post<{ success: boolean; message: string; transfer?: Transfer }>(
      `/transfers/${id}/verify-qr`,
      { qrCode, location }
    );
    return response.data;
  },

  // === SEGUIMIENTO GPS ===

  // Agregar punto de seguimiento GPS
  addGPSTracking: async (
    id: number,
    data: { latitude: number; longitude: number; speed?: number; accuracy?: number }
  ): Promise<TrackingLog> => {
    const response = await api.post<TrackingLog>(`/transfers/${id}/tracking`, data);
    return response.data;
  },

  // Obtener historial de seguimiento
  getTrackingHistory: async (id: number): Promise<TrackingLog[]> => {
    const response = await api.get<TrackingLog[]>(`/transfers/${id}/tracking`);
    return response.data;
  },

  // Obtener última ubicación
  getLatestTracking: async (id: number): Promise<TrackingLog | null> => {
    const response = await api.get<TrackingLog | null>(`/transfers/${id}/tracking/latest`);
    return response.data;
  },
};
