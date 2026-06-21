import 'dart:math';

/// Progreso de ruta y ETA calculados a partir de coordenadas y velocidad.
class RouteProgress {
  const RouteProgress({
    required this.percent,
    required this.remainingKm,
    this.eta,
  });

  /// Avance 0..1 (proporción de la distancia origen→destino ya recorrida).
  final double percent;

  /// Distancia restante hasta el destino, en km.
  final double remainingKm;

  /// Tiempo estimado de llegada (null si la velocidad no es fiable).
  final Duration? eta;

  static const double _earthRadius = 6371000; // m

  static double _haversine(double lat1, double lon1, double lat2, double lon2) {
    double rad(double d) => d * pi / 180;
    final dLat = rad(lat2 - lat1);
    final dLon = rad(lon2 - lon1);
    final a =
        sin(dLat / 2) * sin(dLat / 2) +
        cos(rad(lat1)) * cos(rad(lat2)) * sin(dLon / 2) * sin(dLon / 2);
    return 2 * _earthRadius * asin(min(1.0, sqrt(a)));
  }

  /// Devuelve null si falta alguna coordenada.
  static RouteProgress? compute({
    double? originLat,
    double? originLng,
    double? destLat,
    double? destLng,
    double? curLat,
    double? curLng,
    double speedKmh = 0,
  }) {
    if (originLat == null ||
        originLng == null ||
        destLat == null ||
        destLng == null ||
        curLat == null ||
        curLng == null) {
      return null;
    }

    final totalM = _haversine(originLat, originLng, destLat, destLng);
    final remainingM = _haversine(curLat, curLng, destLat, destLng);

    if (totalM <= 0) {
      return const RouteProgress(percent: 1, remainingKm: 0);
    }

    final coveredM = (totalM - remainingM).clamp(0.0, totalM);
    final percent = (coveredM / totalM).clamp(0.0, 1.0);

    Duration? eta;
    if (speedKmh >= 5) {
      final hours = (remainingM / 1000) / speedKmh;
      eta = Duration(seconds: (hours * 3600).round());
    }

    return RouteProgress(
      percent: percent.toDouble(),
      remainingKm: remainingM / 1000,
      eta: eta,
    );
  }
}
