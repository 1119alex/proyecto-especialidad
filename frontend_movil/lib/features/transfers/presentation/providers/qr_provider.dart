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

// NOTA: la verificación de QR se hace llamando directamente al datasource
// (qrDatasourceProvider) desde los escáneres. Antes existía aquí un notifier
// QRVerifier (autoDispose) que nadie observaba: Riverpod lo desechaba durante
// el await de la petición y al asignar `state` lanzaba "Bad state: Future
// already completed" aunque el backend sí había verificado el QR.
