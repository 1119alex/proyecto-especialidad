import api from './api';
import { Transfer, TransferStatus } from '../types';

export interface ReportFilters {
  from?: string;
  to?: string;
  status?: TransferStatus | '';
  originWarehouseId?: number;
  destinationWarehouseId?: number;
}

export interface TransfersReportSummary {
  total: number;
  byStatus: Record<string, number>;
  withDiscrepancies: number;
  averageTransitMinutes: number | null;
}

export interface TransfersReport {
  summary: TransfersReportSummary;
  transfers: Transfer[];
}

const buildParams = (filters: ReportFilters) => {
  const params: Record<string, string | number> = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.status) params.status = filters.status;
  if (filters.originWarehouseId) params.originWarehouseId = filters.originWarehouseId;
  if (filters.destinationWarehouseId)
    params.destinationWarehouseId = filters.destinationWarehouseId;
  return params;
};

export const reportService = {
  // Reporte de transferencias con resumen (RF14)
  getTransfersReport: async (filters: ReportFilters): Promise<TransfersReport> => {
    const response = await api.get<TransfersReport>('/reports/transfers', {
      params: buildParams(filters),
    });
    return response.data;
  },

  // Descarga del reporte en PDF
  downloadTransfersPdf: async (filters: ReportFilters): Promise<void> => {
    const response = await api.get('/reports/transfers/pdf', {
      params: buildParams(filters),
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-transferencias-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
