import '../entities/user_entity.dart';

/// Repositorio de autenticación (interfaz)
abstract class AuthRepository {
  /// Login con email y password
  Future<({String token, UserEntity user})> login({
    required String email,
    required String password,
  });

  /// Logout
  Future<void> logout();

  /// Obtener usuario actual desde token
  Future<UserEntity?> getCurrentUser();

  /// Verificar si hay sesión activa
  Future<bool> hasActiveSession();
}
