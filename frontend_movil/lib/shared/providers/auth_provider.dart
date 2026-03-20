import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../services/api/api_client_provider.dart';
import 'secure_storage_provider.dart';
import '../../core/constants/api_constants.dart';
import '../../features/auth/data/models/login_response_model.dart';

part 'auth_provider.g.dart';

/// Estado de autenticación
class AuthState {
  final bool isAuthenticated;
  final String? token;
  final String? userRole;
  final int? userId;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.token,
    this.userRole,
    this.userId,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    String? token,
    String? userRole,
    int? userId,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      token: token ?? this.token,
      userRole: userRole ?? this.userRole,
      userId: userId ?? this.userId,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

/// Provider de autenticación
@riverpod
class Auth extends _$Auth {
  @override
  Future<AuthState> build() async {
    // Intentar cargar la sesión guardada
    final storageManager = ref.read(secureStorageManagerProvider.notifier);
    final token = await storageManager.getToken();

    if (token != null) {
      final role = await storageManager.getUserRole();
      final userIdStr = await storageManager.getUserId();
      final userId = userIdStr != null ? int.tryParse(userIdStr) : null;

      return AuthState(
        isAuthenticated: true,
        token: token,
        userRole: role,
        userId: userId,
      );
    }

    return const AuthState();
  }

  /// Login
  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();

    state = await AsyncValue.guard(() async {
      final apiClient = ref.read(apiClientProvider);
      final storageManager = ref.read(secureStorageManagerProvider.notifier);

      final response = await apiClient.post(
        ApiConstants.loginEndpoint,
        data: {
          'email': email,
          'password': password,
        },
      );

      // Parsear la respuesta usando el modelo
      final loginResponse = LoginResponseModel.fromJson(
        response.data as Map<String, dynamic>,
      );

      // Guardar en secure storage
      await storageManager.saveToken(loginResponse.accessToken);
      await storageManager.saveUserRole(loginResponse.user.role);
      await storageManager.saveUserId(loginResponse.user.id.toString());

      return AuthState(
        isAuthenticated: true,
        token: loginResponse.accessToken,
        userRole: loginResponse.user.role,
        userId: loginResponse.user.id,
      );
    });
  }

  /// Logout
  Future<void> logout() async {
    final storageManager = ref.read(secureStorageManagerProvider.notifier);
    await storageManager.clearAll();

    state = const AsyncValue.data(AuthState());
  }

  /// Verificar si el usuario tiene un rol específico
  bool hasRole(String role) {
    return state.value?.userRole == role;
  }

  /// Verificar si el usuario tiene alguno de los roles
  bool hasAnyRole(List<String> roles) {
    final userRole = state.value?.userRole;
    return userRole != null && roles.contains(userRole);
  }
}

/// Provider para verificar si el usuario está autenticado
@riverpod
bool isAuthenticated(IsAuthenticatedRef ref) {
  final authState = ref.watch(authProvider);
  return authState.value?.isAuthenticated ?? false;
}

/// Provider para obtener el rol del usuario
@riverpod
String? userRole(UserRoleRef ref) {
  final authState = ref.watch(authProvider);
  return authState.value?.userRole;
}

/// Provider para obtener el ID del usuario
@riverpod
int? userId(UserIdRef ref) {
  final authState = ref.watch(authProvider);
  return authState.value?.userId;
}
