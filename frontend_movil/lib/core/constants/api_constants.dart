/// API Configuration Constants
class ApiConstants {
  ApiConstants._();

  // Base URLs
  static const String baseUrl = 'http://localhost:3000'; // TODO: Cambiar a URL de producción
  static const String baseUrlDev = 'http://localhost:3000';
  static const String baseUrlProd = 'https://api-production.com'; // TODO: Configurar

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

  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

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
