// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transfer_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TransferModel _$TransferModelFromJson(Map<String, dynamic> json) =>
    TransferModel(
      id: (json['id'] as num).toInt(),
      transferCode: json['transferCode'] as String,
      originWarehouseId: (json['originWarehouseId'] as num).toInt(),
      destinationWarehouseId: (json['destinationWarehouseId'] as num).toInt(),
      vehicleId: (json['vehicleId'] as num?)?.toInt(),
      driverId: (json['driverId'] as num?)?.toInt(),
      createdByUserId: (json['createdByUserId'] as num).toInt(),
      status: json['status'] as String,
      qrCode: json['qrCode'] as String?,
      qrVerifiedAtOrigin: json['qrVerifiedAtOrigin'] == null
          ? null
          : DateTime.parse(json['qrVerifiedAtOrigin'] as String),
      qrVerifiedAtDestination: json['qrVerifiedAtDestination'] == null
          ? null
          : DateTime.parse(json['qrVerifiedAtDestination'] as String),
      estimatedDepartureTime: json['estimatedDepartureTime'] == null
          ? null
          : DateTime.parse(json['estimatedDepartureTime'] as String),
      estimatedArrivalTime: json['estimatedArrivalTime'] == null
          ? null
          : DateTime.parse(json['estimatedArrivalTime'] as String),
      actualDepartureTime: json['actualDepartureTime'] == null
          ? null
          : DateTime.parse(json['actualDepartureTime'] as String),
      actualArrivalTime: json['actualArrivalTime'] == null
          ? null
          : DateTime.parse(json['actualArrivalTime'] as String),
      cancelledAt: json['cancelledAt'] == null
          ? null
          : DateTime.parse(json['cancelledAt'] as String),
      cancelledByUserId: (json['cancelledByUserId'] as num?)?.toInt(),
      cancellationReason: json['cancellationReason'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      originWarehouse: json['originWarehouse'] == null
          ? null
          : WarehouseModel.fromJson(
              json['originWarehouse'] as Map<String, dynamic>),
      destinationWarehouse: json['destinationWarehouse'] == null
          ? null
          : WarehouseModel.fromJson(
              json['destinationWarehouse'] as Map<String, dynamic>),
      vehicle: json['vehicle'] == null
          ? null
          : VehicleModel.fromJson(json['vehicle'] as Map<String, dynamic>),
      driver: json['driver'] == null
          ? null
          : DriverModel.fromJson(json['driver'] as Map<String, dynamic>),
      details: (json['details'] as List<dynamic>?)
          ?.map((e) => TransferDetailModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$TransferModelToJson(TransferModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'transferCode': instance.transferCode,
      'originWarehouseId': instance.originWarehouseId,
      'destinationWarehouseId': instance.destinationWarehouseId,
      'vehicleId': instance.vehicleId,
      'driverId': instance.driverId,
      'createdByUserId': instance.createdByUserId,
      'status': instance.status,
      'qrCode': instance.qrCode,
      'qrVerifiedAtOrigin': instance.qrVerifiedAtOrigin?.toIso8601String(),
      'qrVerifiedAtDestination':
          instance.qrVerifiedAtDestination?.toIso8601String(),
      'estimatedDepartureTime':
          instance.estimatedDepartureTime?.toIso8601String(),
      'estimatedArrivalTime': instance.estimatedArrivalTime?.toIso8601String(),
      'actualDepartureTime': instance.actualDepartureTime?.toIso8601String(),
      'actualArrivalTime': instance.actualArrivalTime?.toIso8601String(),
      'cancelledAt': instance.cancelledAt?.toIso8601String(),
      'cancelledByUserId': instance.cancelledByUserId,
      'cancellationReason': instance.cancellationReason,
      'notes': instance.notes,
      'createdAt': instance.createdAt.toIso8601String(),
      'completedAt': instance.completedAt?.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'originWarehouse': instance.originWarehouse?.toJson(),
      'destinationWarehouse': instance.destinationWarehouse?.toJson(),
      'vehicle': instance.vehicle?.toJson(),
      'driver': instance.driver?.toJson(),
      'details': instance.details?.map((e) => e.toJson()).toList(),
    };

WarehouseModel _$WarehouseModelFromJson(Map<String, dynamic> json) =>
    WarehouseModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      address: json['address'] as String?,
    );

Map<String, dynamic> _$WarehouseModelToJson(WarehouseModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'address': instance.address,
    };

VehicleModel _$VehicleModelFromJson(Map<String, dynamic> json) => VehicleModel(
      id: (json['id'] as num).toInt(),
      licensePlate: json['licensePlate'] as String,
      model: json['model'] as String?,
      type: json['type'] as String?,
    );

Map<String, dynamic> _$VehicleModelToJson(VehicleModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'licensePlate': instance.licensePlate,
      'model': instance.model,
      'type': instance.type,
    };

DriverModel _$DriverModelFromJson(Map<String, dynamic> json) => DriverModel(
      id: (json['id'] as num).toInt(),
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      email: json['email'] as String,
    );

Map<String, dynamic> _$DriverModelToJson(DriverModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'email': instance.email,
    };

TransferDetailModel _$TransferDetailModelFromJson(Map<String, dynamic> json) =>
    TransferDetailModel(
      id: (json['id'] as num).toInt(),
      transferId: (json['transferId'] as num).toInt(),
      productId: (json['productId'] as num).toInt(),
      product: json['product'] == null
          ? null
          : ProductModel.fromJson(json['product'] as Map<String, dynamic>),
      quantityExpected: (json['quantityExpected'] as num).toDouble(),
      quantityReceived: (json['quantityReceived'] as num?)?.toDouble(),
      hasDiscrepancy: json['hasDiscrepancy'] as bool,
    );

Map<String, dynamic> _$TransferDetailModelToJson(
        TransferDetailModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'transferId': instance.transferId,
      'productId': instance.productId,
      'product': instance.product?.toJson(),
      'quantityExpected': instance.quantityExpected,
      'quantityReceived': instance.quantityReceived,
      'hasDiscrepancy': instance.hasDiscrepancy,
    };

ProductModel _$ProductModelFromJson(Map<String, dynamic> json) => ProductModel(
      id: (json['id'] as num).toInt(),
      sku: json['sku'] as String,
      name: json['name'] as String,
      unit: json['unit'] as String,
    );

Map<String, dynamic> _$ProductModelToJson(ProductModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'sku': instance.sku,
      'name': instance.name,
      'unit': instance.unit,
    };
