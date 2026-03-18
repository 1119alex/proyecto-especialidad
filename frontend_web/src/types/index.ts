// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'TRANSPORTISTA' | 'ENC_ORIGEN' | 'ENC_DESTINO';
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Warehouse types
export interface Warehouse {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Vehicle types
export interface Vehicle {
  id: number;
  plate: string;
  model: string;
  capacity: number;
  available: boolean;
  driverProfileId?: number;
}

// Product types
export interface Product {
  id: number;
  name: string;
  sku: string;
  unit: string;
  description?: string;
}

// Transfer types
export type TransferStatus =
  | 'PENDIENTE'
  | 'ASIGNADA'
  | 'EN_PREPARACION'
  | 'EN_TRANSITO'
  | 'LLEGADA_DESTINO'
  | 'COMPLETADA'
  | 'COMPLETADA_CON_DISCREPANCIAS'
  | 'CANCELADA';

export interface TransferDetail {
  id: number;
  productId: number;
  product?: Product;
  quantitySent: number;
  quantityReceived?: number;
  hasDiscrepancy: boolean;
}

export interface Transfer {
  id: number;
  originId: number;
  origin?: Warehouse;
  destId: number;
  dest?: Warehouse;
  vehicleId?: number;
  vehicle?: Vehicle;
  createdBy: number;
  createdByUser?: User;
  status: TransferStatus;
  qrCode: string;
  createdAt: Date;
  completedAt?: Date;
  details?: TransferDetail[];
}

export interface CreateTransferDTO {
  originId: number;
  destId: number;
  details: {
    productId: number;
    quantitySent: number;
  }[];
}

export interface AssignVehicleDTO {
  vehicleId: number;
}

// Tracking types
export interface TrackingLog {
  id: number;
  transferId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

// Notification types
export type NotificationType =
  | 'ASIGNACION'
  | 'PREPARACION'
  | 'CONFIRMACION_CARGA'
  | 'LLEGADA';

export interface Notification {
  id: number;
  userId: number;
  transferId: number;
  message: string;
  type: NotificationType;
  sentAt: Date;
  read: boolean;
}

// Report types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  status?: TransferStatus;
  originId?: number;
  destId?: number;
}

export interface ReportSummary {
  totalTransfers: number;
  completedTransfers: number;
  activeTransfers: number;
  canceledTransfers: number;
  withDiscrepancies: number;
}
