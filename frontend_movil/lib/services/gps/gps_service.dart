import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../core/constants/api_constants.dart';

/// Servicio de geolocalización
class GpsService {
  Stream<Position>? _positionStream;

  /// Verificar si los permisos de ubicación están otorgados
  Future<bool> checkPermissions() async {
    final status = await Permission.location.status;
    return status.isGranted;
  }

  /// Solicitar permisos de ubicación
  Future<bool> requestPermissions() async {
    final status = await Permission.location.request();
    return status.isGranted;
  }

  /// Verificar si el GPS está habilitado
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Obtener la posición actual
  Future<Position?> getCurrentPosition() async {
    try {
      // Verificar permisos
      final hasPermission = await checkPermissions();
      if (!hasPermission) {
        final granted = await requestPermissions();
        if (!granted) return null;
      }

      // Verificar que el servicio esté habilitado
      final serviceEnabled = await isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      // Obtener posición
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      return position;
    } catch (e) {
      // Error al obtener posición
      return null;
    }
  }

  /// Iniciar stream de posiciones (para tracking en tiempo real)
  Stream<Position> getPositionStream() {
    _positionStream ??= Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Actualizar cada 10 metros
        timeLimit: ApiConstants.gpsUpdateInterval,
      ),
    );

    return _positionStream!;
  }

  /// Calcular distancia entre dos puntos (en metros)
  double calculateDistance(
    double startLatitude,
    double startLongitude,
    double endLatitude,
    double endLongitude,
  ) {
    return Geolocator.distanceBetween(
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
    );
  }

  /// Verificar si una ubicación está cerca de un punto objetivo (dentro del radio en metros)
  bool isNearLocation({
    required double currentLat,
    required double currentLng,
    required double targetLat,
    required double targetLng,
    double radiusMeters = 100,
  }) {
    final distance = calculateDistance(
      currentLat,
      currentLng,
      targetLat,
      targetLng,
    );

    return distance <= radiusMeters;
  }

  /// Verificar estado completo del GPS
  Future<GpsStatus> getGpsStatus() async {
    final serviceEnabled = await isLocationServiceEnabled();
    final hasPermission = await checkPermissions();

    if (!serviceEnabled) {
      return GpsStatus.disabled;
    }

    if (!hasPermission) {
      return GpsStatus.noPermission;
    }

    return GpsStatus.enabled;
  }

  /// Abrir configuración de ubicación del dispositivo
  Future<void> openLocationSettings() async {
    await Geolocator.openLocationSettings();
  }

  /// Abrir configuración de permisos de la app
  Future<void> openAppSettings() async {
    await openAppSettings();
  }

  /// Detener stream de posiciones
  void dispose() {
    _positionStream = null;
  }
}

/// Estado del GPS
enum GpsStatus {
  enabled,
  disabled,
  noPermission,
}

/// Extensión para obtener mensaje del estado
extension GpsStatusExtension on GpsStatus {
  String get message {
    switch (this) {
      case GpsStatus.enabled:
        return 'GPS habilitado';
      case GpsStatus.disabled:
        return 'GPS deshabilitado. Por favor, habilítalo en la configuración.';
      case GpsStatus.noPermission:
        return 'Permisos de ubicación no otorgados. Por favor, otorga los permisos.';
    }
  }

  bool get isReady => this == GpsStatus.enabled;
}
