import api from './api';
import { KardexResult, MovementFilters } from '../types';

export const inventoryService = {
  // Historial de movimientos de inventario (kardex) con filtros opcionales
  getMovements: async (filters: MovementFilters = {}): Promise<KardexResult> => {
    const params: Record<string, string | number> = {};
    if (filters.productId) params.productId = filters.productId;
    if (filters.warehouseId) params.warehouseId = filters.warehouseId;
    if (filters.movementType) params.movementType = filters.movementType;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const response = await api.get<KardexResult>('/inventory/movements', {
      params,
    });
    return response.data;
  },
};
