import '../../domain/entities/transfer_entity.dart';
import '../../domain/repositories/transfers_repository.dart';
import '../datasources/transfers_remote_datasource.dart';

/// Implementación del repository de Transfers
class TransfersRepositoryImpl implements TransfersRepository {
  final TransfersRemoteDatasource _remoteDatasource;

  TransfersRepositoryImpl({
    required TransfersRemoteDatasource remoteDatasource,
  }) : _remoteDatasource = remoteDatasource;

  @override
  Future<List<TransferEntity>> getAllTransfers() async {
    final models = await _remoteDatasource.getAllTransfers();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<TransferEntity> getTransferById(int id) async {
    final model = await _remoteDatasource.getTransferById(id);
    return model.toEntity();
  }

  @override
  Future<List<TransferEntity>> getTransfersByStatus(String status) async {
    final models = await _remoteDatasource.getTransfersByStatus(status);
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<TransferEntity> createTransfer(Map<String, dynamic> data) async {
    final model = await _remoteDatasource.createTransfer(data);
    return model.toEntity();
  }

  @override
  Future<TransferEntity> updateTransfer(
      int id, Map<String, dynamic> data) async {
    final model = await _remoteDatasource.updateTransfer(id, data);
    return model.toEntity();
  }

  @override
  Future<TransferEntity> assignVehicleAndDriver({
    required int transferId,
    required int vehicleId,
    required int driverId,
  }) async {
    final model = await _remoteDatasource.assignVehicleAndDriver(
      transferId: transferId,
      vehicleId: vehicleId,
      driverId: driverId,
    );
    return model.toEntity();
  }

  @override
  Future<void> deleteTransfer(int id) async {
    await _remoteDatasource.deleteTransfer(id);
  }
}
