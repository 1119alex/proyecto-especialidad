import 'package:dio/dio.dart';
import '../../../../services/api/api_client.dart';

/// Datasource remoto para operaciones de GPS tracking
class GPSTrackingDatasource {
  final ApiClient _apiClient;

  GPSTrackingDatasource({required ApiClient apiClient})
      : _apiClient = apiClient;

  /// Envía datos de GPS al backend
  Future<void> addGPSTracking({
    required int transferId,
    required double latitude,
    required double longitude,
    double? speed,
    double? accuracy,
  }) async {
    try {
      await _apiClient.post(
        '/transfers/$transferId/tracking',
        data: {
          'latitude': latitude,
          'longitude': longitude,
          'speed': speed,
          'accuracy': accuracy,
        },
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        throw Exception(
            e.response?.data['message'] ?? 'Error al enviar ubicación GPS');
      }
      throw Exception('Error al enviar ubicación GPS: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Obtiene el historial de tracking de una transferencia
  Future<List<Map<String, dynamic>>> getTrackingHistory(int transferId) async {
    try {
      final response = await _apiClient.get(
        '/transfers/$transferId/tracking',
      );
      return List<Map<String, dynamic>>.from(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      }
      throw Exception('Error al obtener historial GPS: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Obtiene la última ubicación registrada
  Future<Map<String, dynamic>?> getLatestTracking(int transferId) async {
    try {
      final response = await _apiClient.get(
        '/transfers/$transferId/tracking/latest',
      );
      return response.data;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      }
      throw Exception('Error al obtener última ubicación: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }
}
