/// API Configuration Constants
class ApiConstants {
  ApiConstants._();

  // Base URLs
  // IMPORTANTE:
  // - Para emulador Android: usar 10.0.2.2 (apunta a localhost de tu PC)
  // - Para dispositivo físico: usar tu IP local (ej: 192.168.1.100)
  // - Para iOS simulator: usar localhost o 127.0.0.1
  // - Para producción: usar el URL de Railway
  static const String baseUrl = 'https://proyecto-especialidad-production.up.railway.app/api/v1'; // Railway Production
  static const String baseUrlDev = 'http://10.0.2.2:3000/api/v1';
  static const String baseUrlProd = 'https://proyecto-especialidad-production.up.railway.app/api/v1';

  // API Endpoints
  static const String authEndpoint = '/auth';
  static const String transfersEndpoint = '/transfers';
  static const String vehiclesEndpoint = '/vehicles';
  static const String warehousesEndpoint = '/warehouses';
  static const String productsEndpoint = '/products';
  static const String usersEndpoint = '/users';

  // Auth Endpoints
  static const String loginEndpoint = '$authEndpoint/login';
  static const String registerEndpoint = '$authEndpoint/register-admin';
  static const String profileEndpoint = '$authEndpoint/profile';

  // Transfer Endpoints
  static const String assignTransferEndpoint = '/assign';
  static const String startTripEndpoint = '/start-trip';
  static const String endTripEndpoint = '/end-trip';
  static const String verifyQREndpoint = '/verify-qr';
  static const String trackingEndpoint = '/tracking';

  // Timeouts - Reducidos para mejor experiencia de usuario
  static const Duration connectionTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 10);

  // Retry configuration
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(seconds: 2);

  // GPS Tracking
  static const Duration gpsUpdateInterval = Duration(seconds: 10);
  static const double gpsAccuracyThreshold = 50.0; // metros

  // QR Code
  static const String qrCodePrefix = 'LOGITRACK-';
  static const int qrCodeVersion = 1;
}
