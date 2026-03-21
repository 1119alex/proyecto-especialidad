// User types
export type UserRole = 'ADMIN' | 'TRANSPORTISTA' | 'ENCARGADO_ALMACEN';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  name?: string; // Computed field para compatibilidad
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
  licenseNumber?: string;
  licenseExpiry?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  warehouseId?: number;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  licenseNumber?: string;
  licenseExpiry?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  warehouseId?: number;
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
export interface WarehouseStaffProfile {
  id: number;
  userId: number;
  warehouseId: number;
  user?: User;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  isActive: boolean;
  staff?: WarehouseStaffProfile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWarehouseDto {
  code: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  managerId?: number;
  latitude: number;
  longitude: number;
  geofenceRadius?: number;
  isActive?: boolean;
}

export interface UpdateWarehouseDto {
  code?: string;
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  managerId?: number;
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number;
  isActive?: boolean;
}

// Vehicle types
export type VehicleStatus = 'DISPONIBLE' | 'EN_USO' | 'MANTENIMIENTO' | 'FUERA_SERVICIO';

export interface Vehicle {
  id: number;
  licensePlate: string;
  model: string;
  year?: number;
  capacity: number;
  status: VehicleStatus;
  isAvailable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleDto {
  licensePlate: string;
  model: string;
  year?: number;
  capacity: number;
  status?: VehicleStatus;
  isAvailable?: boolean;
  notes?: string;
}

export interface UpdateVehicleDto {
  licensePlate?: string;
  model?: string;
  year?: number;
  capacity?: number;
  status?: VehicleStatus;
  isAvailable?: boolean;
  notes?: string;
}

// Product types
export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  minStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category?: string;
  unit: string;
  minStock?: number;
  isActive?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  category?: string;
  unit?: string;
  minStock?: number;
  isActive?: boolean;
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
