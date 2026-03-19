/// Application Constants
class AppConstants {
  AppConstants._();

  // App Info
  static const String appName = 'LogiTrack';
  static const String appVersion = '1.0.0';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String userRoleKey = 'user_role';
  static const String refreshTokenKey = 'refresh_token';

  // User Roles (debe coincidir con el backend)
  static const String roleAdmin = 'ADMIN';
  static const String roleTransportista = 'TRANSPORTISTA';
  static const String roleEncargadoOrigen = 'ENC_ORIGEN';
  static const String roleEncargadoDestino = 'ENC_DESTINO';

  // Transfer Status
  static const String statusPendiente = 'PENDIENTE';
  static const String statusAsignada = 'ASIGNADA';
  static const String statusEnPreparacion = 'EN_PREPARACION';
  static const String statusEnTransito = 'EN_TRANSITO';
  static const String statusLlegada = 'LLEGADA';
  static const String statusCompletada = 'COMPLETADA';
  static const String statusCancelada = 'CANCELADA';

  // Sync Configuration
  static const Duration syncInterval = Duration(minutes: 5);
  static const int maxSyncRetries = 3;

  // Notification Channels
  static const String notificationChannelId = 'logitrack_notifications';
  static const String notificationChannelName = 'LogiTrack Notifications';
  static const String notificationChannelDescription = 'Notificaciones del sistema de transferencias';

  // Geocerca (metros)
  static const double geocercaRadius = 100.0;

  // Cache Configuration
  static const Duration cacheExpiration = Duration(hours: 1);
  static const int maxCacheSize = 50; // MB
}
