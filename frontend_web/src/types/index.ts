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
  | 'LISTA_DESPACHO'
  | 'EN_TRANSITO'
  | 'LLEGADA_DESTINO'
  | 'COMPLETADA'
  | 'COMPLETADA_CON_DISCREPANCIA'
  | 'CANCELADA';

export interface TransferDetail {
  id: number;
  transferId: number;
  productId: number;
  product?: Product;
  quantityExpected: number;
  quantityReceived?: number;
  hasDiscrepancy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transfer {
  id: number;
  transferCode: string;
  originWarehouseId: number;
  originWarehouse?: Warehouse;
  destinationWarehouseId: number;
  destinationWarehouse?: Warehouse;
  vehicleId?: number;
  vehicle?: Vehicle;
  driverId?: number;
  driver?: User;
  status: TransferStatus;
  qrCode?: string;
  qrVerifiedAtOrigin?: Date;
  qrVerifiedAtDestination?: Date;
  estimatedDepartureTime?: Date;
  estimatedArrivalTime?: Date;
  actualDepartureTime?: Date;
  actualArrivalTime?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledByUserId?: number;
  cancelledBy?: User;
  createdByUserId: number;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  details: TransferDetail[];
}

export interface CreateTransferDto {
  originWarehouseId: number;
  destinationWarehouseId: number;
  vehicleId?: number;
  driverId?: number;
  estimatedDepartureTime?: string;
  estimatedArrivalTime?: string;
  details: {
    productId: number;
    quantity: number;
  }[];
}

export interface UpdateTransferDto {
  originWarehouseId?: number;
  destinationWarehouseId?: number;
  vehicleId?: number;
  driverId?: number;
  estimatedDepartureTime?: string;
  estimatedArrivalTime?: string;
  status?: TransferStatus;
  cancellationReason?: string;
}

// Tracking types
export interface TrackingLog {
  id: number;
  transferId: number;
  latitude: number;
  longitude: number;
  speed?: number;
  accuracy?: number;
  recordedAt: Date;
  createdAt: Date;
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
