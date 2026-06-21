import 'package:dio/dio.dart';

/// Convierte cualquier error (sobre todo [DioException]) en un mensaje claro
/// en español para mostrar al usuario, en vez del texto técnico de Dio.
String friendlyError(Object error) {
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'La conexión tardó demasiado. Inténtalo de nuevo.';
      case DioExceptionType.connectionError:
        return 'Sin conexión. Verifica tu internet e inténtalo de nuevo.';
      default:
        break;
    }

    final code = error.response?.statusCode;
    if (code == 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (code == 403) return 'No tienes permiso para ver esto.';
    if (code == 404) return 'No se encontró lo solicitado.';
    if (code != null && code >= 500) {
      return 'Error del servidor. Inténtalo más tarde.';
    }

    // Mensaje que envíe el backend, si lo hay
    final data = error.response?.data;
    if (data is Map && data['message'] != null) {
      final m = data['message'];
      return m is List ? m.join('\n') : m.toString();
    }
    return 'No se pudo completar la solicitud.';
  }

  return error.toString().replaceFirst('Exception: ', '');
}
