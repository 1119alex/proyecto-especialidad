/// Entidad de dominio para Transfer
class TransferEntity {
  final int id;
  final String transferCode;
  final int originWarehouseId;
  final int destinationWarehouseId;
  final int? vehicleId;
  final int? driverId;
  final int createdByUserId;
  final String status;
  final String? qrCode;
  final DateTime? qrVerifiedAtOrigin;
  final DateTime? qrVerifiedAtDestination;
  final DateTime? estimatedDepartureTime;
  final DateTime? estimatedArrivalTime;
  final DateTime? actualDepartureTime;
  final DateTime? actualArrivalTime;
  final DateTime? cancelledAt;
  final int? cancelledByUserId;
  final String? cancellationReason;
  final String? notes;
  final DateTime createdAt;
  final DateTime? completedAt;
  final DateTime updatedAt;

  // Relaciones (opcional - datos expandidos)
  final WarehouseEntity? originWarehouse;
  final WarehouseEntity? destinationWarehouse;
  final VehicleEntity? vehicle;
  final UserEntity? driver;
  final List<TransferDetailEntity>? details;

  const TransferEntity({
    required this.id,
    required this.transferCode,
    required this.originWarehouseId,
    required this.destinationWarehouseId,
    this.vehicleId,
    this.driverId,
    required this.createdByUserId,
    required this.status,
    this.qrCode,
    this.qrVerifiedAtOrigin,
    this.qrVerifiedAtDestination,
    this.estimatedDepartureTime,
    this.estimatedArrivalTime,
    this.actualDepartureTime,
    this.actualArrivalTime,
    this.cancelledAt,
    this.cancelledByUserId,
    this.cancellationReason,
    this.notes,
    required this.createdAt,
    this.completedAt,
    required this.updatedAt,
    this.originWarehouse,
    this.destinationWarehouse,
    this.vehicle,
    this.driver,
    this.details,
  });

  TransferEntity copyWith({
    int? id,
    String? transferCode,
    int? originWarehouseId,
    int? destinationWarehouseId,
    int? vehicleId,
    int? driverId,
    int? createdByUserId,
    String? status,
    String? qrCode,
    DateTime? qrVerifiedAtOrigin,
    DateTime? qrVerifiedAtDestination,
    DateTime? estimatedDepartureTime,
    DateTime? estimatedArrivalTime,
    DateTime? actualDepartureTime,
    DateTime? actualArrivalTime,
    DateTime? cancelledAt,
    int? cancelledByUserId,
    String? cancellationReason,
    String? notes,
    DateTime? createdAt,
    DateTime? completedAt,
    DateTime? updatedAt,
    WarehouseEntity? originWarehouse,
    WarehouseEntity? destinationWarehouse,
    VehicleEntity? vehicle,
    UserEntity? driver,
    List<TransferDetailEntity>? details,
  }) {
    return TransferEntity(
      id: id ?? this.id,
      transferCode: transferCode ?? this.transferCode,
      originWarehouseId: originWarehouseId ?? this.originWarehouseId,
      destinationWarehouseId:
          destinationWarehouseId ?? this.destinationWarehouseId,
      vehicleId: vehicleId ?? this.vehicleId,
      driverId: driverId ?? this.driverId,
      createdByUserId: createdByUserId ?? this.createdByUserId,
      status: status ?? this.status,
      qrCode: qrCode ?? this.qrCode,
      qrVerifiedAtOrigin: qrVerifiedAtOrigin ?? this.qrVerifiedAtOrigin,
      qrVerifiedAtDestination:
          qrVerifiedAtDestination ?? this.qrVerifiedAtDestination,
      estimatedDepartureTime:
          estimatedDepartureTime ?? this.estimatedDepartureTime,
      estimatedArrivalTime: estimatedArrivalTime ?? this.estimatedArrivalTime,
      actualDepartureTime: actualDepartureTime ?? this.actualDepartureTime,
      actualArrivalTime: actualArrivalTime ?? this.actualArrivalTime,
      cancelledAt: cancelledAt ?? this.cancelledAt,
      cancelledByUserId: cancelledByUserId ?? this.cancelledByUserId,
      cancellationReason: cancellationReason ?? this.cancellationReason,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      originWarehouse: originWarehouse ?? this.originWarehouse,
      destinationWarehouse: destinationWarehouse ?? this.destinationWarehouse,
      vehicle: vehicle ?? this.vehicle,
      driver: driver ?? this.driver,
      details: details ?? this.details,
    );
  }
}

/// Entidad simplificada para Warehouse
class WarehouseEntity {
  final int id;
  final String name;
  final String? address;

  const WarehouseEntity({
    required this.id,
    required this.name,
    this.address,
  });
}

/// Entidad simplificada para Vehicle
class VehicleEntity {
  final int id;
  final String licensePlate;
  final String type;

  const VehicleEntity({
    required this.id,
    required this.licensePlate,
    required this.type,
  });
}

/// Entidad simplificada para User (driver)
class UserEntity {
  final int id;
  final String name;
  final String email;

  const UserEntity({
    required this.id,
    required this.name,
    required this.email,
  });
}

/// Entidad para Transfer Detail
class TransferDetailEntity {
  final int id;
  final int transferId;
  final int productId;
  final String productSku;
  final String productName;
  final double quantityExpected;
  final double? quantityReceived;
  final String unit;
  final bool hasDiscrepancy;
  final String? discrepancyReason;
  final double unitPrice;
  final String? notes;

  const TransferDetailEntity({
    required this.id,
    required this.transferId,
    required this.productId,
    required this.productSku,
    required this.productName,
    required this.quantityExpected,
    this.quantityReceived,
    required this.unit,
    required this.hasDiscrepancy,
    this.discrepancyReason,
    required this.unitPrice,
    this.notes,
  });
}
