import 'package:dio/dio.dart';
import '../../../../services/api/api_client.dart';
import '../models/qr_response_model.dart';

/// Datasource remoto para operaciones de QR
class QRRemoteDatasource {
  final ApiClient _apiClient;

  QRRemoteDatasource({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Obtener/Generar QR de una transferencia
  Future<QRResponseModel> getQRCode(int transferId) async {
    try {
      final response = await _apiClient.get('/transfers/$transferId/qr');
      return QRResponseModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      }
      throw Exception('Error al obtener QR: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Verificar QR escaneado
  Future<QRVerifyResponseModel> verifyQR({
    required int transferId,
    required String qrCode,
    required String location, // 'origin' o 'destination'
  }) async {
    try {
      final response = await _apiClient.post(
        '/transfers/$transferId/verify-qr',
        data: {
          'qrCode': qrCode,
          'location': location,
        },
      );
      return QRVerifyResponseModel.fromJson(
          response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      } else if (e.response?.statusCode == 400) {
        throw Exception(
            e.response?.data['message'] ?? 'QR inválido o estado incorrecto');
      }
      throw Exception('Error al verificar QR: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }
}
