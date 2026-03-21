import '../entities/transfer_entity.dart';

/// Repository interface para Transfers (Domain Layer)
abstract class TransfersRepository {
  /// Obtener todas las transferencias
  Future<List<TransferEntity>> getAllTransfers();

  /// Obtener una transferencia por ID
  Future<TransferEntity> getTransferById(int id);

  /// Obtener transferencias por estado
  Future<List<TransferEntity>> getTransfersByStatus(String status);

  /// Crear una nueva transferencia
  Future<TransferEntity> createTransfer(Map<String, dynamic> data);

  /// Actualizar una transferencia
  Future<TransferEntity> updateTransfer(int id, Map<String, dynamic> data);

  /// Asignar vehículo y conductor
  Future<TransferEntity> assignVehicleAndDriver({
    required int transferId,
    required int vehicleId,
    required int driverId,
  });

  /// Eliminar una transferencia
  Future<void> deleteTransfer(int id);
}
