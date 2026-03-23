import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../services/api/api_client_provider.dart';
import '../../data/datasources/qr_remote_datasource.dart';
import '../../data/models/qr_response_model.dart';

part 'qr_provider.g.dart';

/// Provider del datasource de QR
@riverpod
QRRemoteDatasource qrDatasource(QrDatasourceRef ref) {
  final apiClient = ref.watch(apiClientProvider);
  return QRRemoteDatasource(apiClient: apiClient);
}

/// Provider para obtener/generar QR de una transferencia
@riverpod
Future<QRResponseModel> transferQR(TransferQRRef ref, int transferId) async {
  final datasource = ref.watch(qrDatasourceProvider);
  return datasource.getQRCode(transferId);
}

/// Provider para verificar QR
@riverpod
class QRVerifier extends _$QRVerifier {
  @override
  FutureOr<QRVerifyResponseModel?> build() {
    return null;
  }

  /// Verificar QR escaneado
  Future<void> verifyQR({
    required int transferId,
    required String qrCode,
    required String location,
  }) async {
    state = const AsyncValue.loading();

    try {
      final datasource = ref.read(qrDatasourceProvider);
      final result = await datasource.verifyQR(
        transferId: transferId,
        qrCode: qrCode,
        location: location,
      );

      state = AsyncValue.data(result);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
      rethrow;
    }
  }

  /// Reset state
  void reset() {
    state = const AsyncValue.data(null);
  }
}
