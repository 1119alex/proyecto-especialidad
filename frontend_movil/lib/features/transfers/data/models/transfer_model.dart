import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/transfer_entity.dart';

part 'transfer_model.g.dart';

@JsonSerializable()
class TransferModel {
  final int id;
  @JsonKey(name: 'transferCode')
  final String transferCode;
  @JsonKey(name: 'originWarehouseId')
  final int originWarehouseId;
  @JsonKey(name: 'destinationWarehouseId')
  final int destinationWarehouseId;
  @JsonKey(name: 'vehicleId')
  final int? vehicleId;
  @JsonKey(name: 'driverId')
  final int? driverId;
  @JsonKey(name: 'createdByUserId')
  final int createdByUserId;
  final String status;
  @JsonKey(name: 'qrCode')
  final String? qrCode;
  @JsonKey(name: 'qrVerifiedAtOrigin')
  final DateTime? qrVerifiedAtOrigin;
  @JsonKey(name: 'qrVerifiedAtDestination')
  final DateTime? qrVerifiedAtDestination;
  @JsonKey(name: 'estimatedDepartureTime')
  final DateTime? estimatedDepartureTime;
  @JsonKey(name: 'estimatedArrivalTime')
  final DateTime? estimatedArrivalTime;
  @JsonKey(name: 'actualDepartureTime')
  final DateTime? actualDepartureTime;
  @JsonKey(name: 'actualArrivalTime')
  final DateTime? actualArrivalTime;
  @JsonKey(name: 'cancelledAt')
  final DateTime? cancelledAt;
  @JsonKey(name: 'cancelledByUserId')
  final int? cancelledByUserId;
  @JsonKey(name: 'cancellationReason')
  final String? cancellationReason;
  final String? notes;
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  @JsonKey(name: 'completedAt')
  final DateTime? completedAt;
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;

  // Relaciones expandidas (opcionales)
  @JsonKey(name: 'originWarehouse')
  final WarehouseModel? originWarehouse;
  @JsonKey(name: 'destinationWarehouse')
  final WarehouseModel? destinationWarehouse;
  final VehicleModel? vehicle;
  final DriverModel? driver;
  final List<TransferDetailModel>? details;

  TransferModel({
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

  factory TransferModel.fromJson(Map<String, dynamic> json) =>
      _$TransferModelFromJson(json);

  Map<String, dynamic> toJson() => _$TransferModelToJson(this);

  TransferEntity toEntity() {
    return TransferEntity(
      id: id,
      transferCode: transferCode,
      originWarehouseId: originWarehouseId,
      destinationWarehouseId: destinationWarehouseId,
      vehicleId: vehicleId,
      driverId: driverId,
      createdByUserId: createdByUserId,
      status: status,
      qrCode: qrCode,
      qrVerifiedAtOrigin: qrVerifiedAtOrigin,
      qrVerifiedAtDestination: qrVerifiedAtDestination,
      estimatedDepartureTime: estimatedDepartureTime,
      estimatedArrivalTime: estimatedArrivalTime,
      actualDepartureTime: actualDepartureTime,
      actualArrivalTime: actualArrivalTime,
      cancelledAt: cancelledAt,
      cancelledByUserId: cancelledByUserId,
      cancellationReason: cancellationReason,
      notes: notes,
      createdAt: createdAt,
      completedAt: completedAt,
      updatedAt: updatedAt,
      originWarehouse: originWarehouse?.toEntity(),
      destinationWarehouse: destinationWarehouse?.toEntity(),
      vehicle: vehicle?.toEntity(),
      driver: driver?.toEntity(),
      details: details?.map((d) => d.toEntity()).toList(),
    );
  }
}

@JsonSerializable()
class WarehouseModel {
  final int id;
  final String name;
  final String? address;

  WarehouseModel({
    required this.id,
    required this.name,
    this.address,
  });

  factory WarehouseModel.fromJson(Map<String, dynamic> json) =>
      _$WarehouseModelFromJson(json);

  Map<String, dynamic> toJson() => _$WarehouseModelToJson(this);

  WarehouseEntity toEntity() {
    return WarehouseEntity(
      id: id,
      name: name,
      address: address,
    );
  }
}

@JsonSerializable()
class VehicleModel {
  final int id;
  @JsonKey(name: 'licensePlate')
  final String licensePlate;
  final String? model;
  final String? type;

  VehicleModel({
    required this.id,
    required this.licensePlate,
    this.model,
    this.type,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) =>
      _$VehicleModelFromJson(json);

  Map<String, dynamic> toJson() => _$VehicleModelToJson(this);

  VehicleEntity toEntity() {
    return VehicleEntity(
      id: id,
      licensePlate: licensePlate,
      type: model ?? type ?? '',
    );
  }
}

@JsonSerializable()
class DriverModel {
  final int id;
  @JsonKey(name: 'firstName')
  final String firstName;
  @JsonKey(name: 'lastName')
  final String lastName;
  final String email;

  DriverModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
  });

  factory DriverModel.fromJson(Map<String, dynamic> json) =>
      _$DriverModelFromJson(json);

  Map<String, dynamic> toJson() => _$DriverModelToJson(this);

  String get fullName => '$firstName $lastName';

  UserEntity toEntity() {
    return UserEntity(
      id: id,
      name: fullName,
      email: email,
    );
  }
}

@JsonSerializable()
class TransferDetailModel {
  final int id;
  @JsonKey(name: 'transferId')
  final int transferId;
  @JsonKey(name: 'productId')
  final int productId;
  final ProductModel? product;
  @JsonKey(name: 'quantityExpected', fromJson: _quantityFromJson)
  final double quantityExpected;
  @JsonKey(name: 'quantityReceived', fromJson: _quantityFromJson)
  final double? quantityReceived;
  @JsonKey(name: 'hasDiscrepancy')
  final bool hasDiscrepancy;

  TransferDetailModel({
    required this.id,
    required this.transferId,
    required this.productId,
    this.product,
    required this.quantityExpected,
    this.quantityReceived,
    required this.hasDiscrepancy,
  });

  static double _quantityFromJson(dynamic value) {
    if (value == null) return 0.0;
    if (value is int) return value.toDouble();
    if (value is double) return value;
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  factory TransferDetailModel.fromJson(Map<String, dynamic> json) =>
      _$TransferDetailModelFromJson(json);

  Map<String, dynamic> toJson() => _$TransferDetailModelToJson(this);

  TransferDetailEntity toEntity() {
    return TransferDetailEntity(
      id: id,
      transferId: transferId,
      productId: productId,
      productSku: product?.sku ?? '',
      productName: product?.name ?? 'Producto desconocido',
      quantityExpected: quantityExpected,
      quantityReceived: quantityReceived,
      unit: product?.unit ?? 'UNIDAD',
      hasDiscrepancy: hasDiscrepancy,
      discrepancyReason: null,
      unitPrice: 0,
      notes: null,
    );
  }
}

@JsonSerializable()
class ProductModel {
  final int id;
  final String sku;
  final String name;
  final String unit;

  ProductModel({
    required this.id,
    required this.sku,
    required this.name,
    required this.unit,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) =>
      _$ProductModelFromJson(json);

  Map<String, dynamic> toJson() => _$ProductModelToJson(this);
}
