import 'package:dio/dio.dart';
import '../../../../services/api/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/login_response_model.dart';
import '../models/user_model.dart';

/// Datasource remoto para autenticación
class AuthRemoteDatasource {
  final ApiClient _apiClient;

  AuthRemoteDatasource({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Login con email y password
  Future<LoginResponseModel> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.loginEndpoint,
        data: {
          'email': email,
          'password': password,
        },
      );

      return LoginResponseModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Credenciales inválidas');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Usuario no encontrado');
      }
      throw Exception('Error de conexión: ${e.message}');
    } catch (e) {
      throw Exception('Error inesperado: $e');
    }
  }

  /// Obtener información del usuario actual
  Future<UserModel> getCurrentUser() async {
    try {
      final response = await _apiClient.get(ApiConstants.profileEndpoint);
      return UserModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Sesión expirada');
      }
      throw Exception('Error al obtener usuario: ${e.message}');
    }
  }

  /// Logout (opcional, por si el backend requiere llamada)
  Future<void> logout() async {
    try {
      // Algunos backends requieren notificar el logout
      // await _apiClient.post(ApiConstants.logoutEndpoint);
    } catch (e) {
      // Ignorar errores en logout
    }
  }
}
