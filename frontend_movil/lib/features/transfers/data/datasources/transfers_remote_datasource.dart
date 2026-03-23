import 'package:dio/dio.dart';
import '../../../../services/api/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/transfer_model.dart';

/// Datasource remoto para Transfers
class TransfersRemoteDatasource {
  final ApiClient _apiClient;

  TransfersRemoteDatasource({required ApiClient apiClient})
      : _apiClient = apiClient;

  /// Obtener todas las transferencias
  /// El backend filtra automáticamente según el rol del usuario autenticado
  Future<List<TransferModel>> getAllTransfers() async {
    try {
      final response = await _apiClient.get(ApiConstants.transfersEndpoint);

      final List<dynamic> data = response.data as List<dynamic>;
      return data
          .map((json) => TransferModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Sesión expirada. Por favor inicia sesión nuevamente');
      } else if (e.response?.statusCode == 403) {
        throw Exception('No tienes permisos para ver las transferencias');
      }
      throw Exception('Error al obtener transferencias: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Obtener una transferencia por ID
  Future<TransferModel> getTransferById(int id) async {
    try {
      final response =
          await _apiClient.get('${ApiConstants.transfersEndpoint}/$id');

      return TransferModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      } else if (e.response?.statusCode == 401) {
        throw Exception('Sesión expirada');
      } else if (e.response?.statusCode == 403) {
        throw Exception('No tienes permiso para ver esta transferencia');
      }
      throw Exception('Error al obtener transferencia: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Crear una nueva transferencia (Solo Admin)
  Future<TransferModel> createTransfer(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.transfersEndpoint,
        data: data,
      );

      return TransferModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        throw Exception('Datos inválidos: ${e.response?.data['message']}');
      } else if (e.response?.statusCode == 403) {
        throw Exception('No tienes permiso para crear transferencias');
      }
      throw Exception('Error al crear transferencia: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Actualizar una transferencia (Solo Admin)
  Future<TransferModel> updateTransfer(
      int id, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.patch(
        '${ApiConstants.transfersEndpoint}/$id',
        data: data,
      );

      return TransferModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      } else if (e.response?.statusCode == 403) {
        throw Exception('No tienes permiso para actualizar transferencias');
      }
      throw Exception('Error al actualizar transferencia: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Asignar vehículo y conductor a una transferencia (Solo Admin)
  Future<TransferModel> assignVehicleAndDriver({
    required int transferId,
    required int vehicleId,
    required int driverId,
  }) async {
    try {
      final response = await _apiClient.patch(
        '${ApiConstants.transfersEndpoint}/$transferId/assign',
        data: {
          'vehicleId': vehicleId,
          'driverId': driverId,
        },
      );

      return TransferModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Transferencia, vehículo o conductor no encontrado');
      } else if (e.response?.statusCode == 403) {
        throw Exception('No tienes permiso para asignar transferencias');
      }
      throw Exception('Error al asignar transferencia: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Eliminar una transferencia (Solo Admin)
  Future<void> deleteTransfer(int id) async {
    try {
      await _apiClient.delete('${ApiConstants.transfersEndpoint}/$id');
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      } else if (e.response?.statusCode == 403) {
        throw Exception('No tienes permiso para eliminar transferencias');
      }
      throw Exception('Error al eliminar transferencia: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Obtener transferencias filtradas por estado
  Future<List<TransferModel>> getTransfersByStatus(String status) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.transfersEndpoint,
        queryParameters: {'status': status},
      );

      final List<dynamic> data = response.data as List<dynamic>;
      return data
          .map((json) => TransferModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception('Error al filtrar transferencias: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Iniciar preparación de transferencia (ASIGNADA → EN_PREPARACION)
  Future<TransferModel> startPreparation(int transferId) async {
    try {
      final response = await _apiClient.patch(
        '${ApiConstants.transfersEndpoint}/$transferId/start-preparation',
      );
      return TransferModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        throw Exception(
            e.response?.data['message'] ?? 'Estado incorrecto para iniciar preparación');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      }
      throw Exception('Error al iniciar preparación: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Confirmar llegada al destino
  Future<TransferModel> arriveDestination(int id) async {
    try {
      print('📡 Enviando PATCH a: ${ApiConstants.transfersEndpoint}/$id/arrive-destination');

      final response = await _apiClient.patch(
        '${ApiConstants.transfersEndpoint}/$id/arrive-destination',
        data: {}, // Enviar objeto vacío
      );

      print('✅ Response: ${response.statusCode} - ${response.data}');

      return TransferModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      print('❌ DioException: ${e.message}');
      print('❌ Status: ${e.response?.statusCode}');
      print('❌ Data: ${e.response?.data}');

      if (e.response?.statusCode == 400) {
        throw Exception(e.response?.data['message'] ??
            'Estado incorrecto para confirmar llegada');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Transferencia no encontrada');
      }
      throw Exception('Error al confirmar llegada: ${e.message}');
    } catch (e) {
      print('❌ Error inesperado: $e');
      throw Exception('Error inesperado: $e');
    }
  }
}
