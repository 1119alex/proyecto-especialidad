import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:logger/logger.dart';

import '../../config/drift/database.dart';
import '../../features/transfers/data/datasources/gps_tracking_datasource.dart';
import '../../features/transfers/presentation/providers/gps_tracking_provider.dart';
import '../../shared/providers/database_provider.dart';

/// Servicio de captura y sincronización eficiente de posiciones GPS.
///
/// Sustituye al timer fijo de 30 segundos con tres mecanismos:
/// 1. **Captura por distancia adaptativa**: el GPS emite posiciones en stream
///    y solo se registra un punto cuando el vehículo se movió lo suficiente
///    (umbral según velocidad: más denso en ciudad, más espaciado en carretera).
///    Detenido en un semáforo o cargando no genera registros.
/// 2. **Heartbeat**: si no hubo movimiento, cada [heartbeatInterval] se registra
///    un punto para confirmar que el tracking sigue activo.
/// 3. **Buffer offline + envío por lotes**: cada punto se guarda primero en
///    Drift (SQLite) y se envía al backend en lotes, reduciendo peticiones
///    HTTP. Sin conexión, los puntos quedan en cola y se sincronizan al
///    recuperar señal (RNF05).
class TrackingBufferService {
  final AppDatabase _db;
  final GPSTrackingDatasource _datasource;
  final Logger _logger = Logger();

  TrackingBufferService({
    required AppDatabase db,
    required GPSTrackingDatasource datasource,
  })  : _db = db,
        _datasource = datasource;

  static const int batchSize = 5;
  static const Duration flushInterval = Duration(seconds: 60);
  static const Duration heartbeatInterval = Duration(minutes: 2);

  StreamSubscription<Position>? _positionSub;
  StreamSubscription<ConnectivityResult>? _connectivitySub;
  Timer? _flushTimer;
  Timer? _heartbeatTimer;

  int? _activeTransferId;
  Position? _lastRecorded;
  DateTime? _lastRecordedAt;
  bool _flushing = false;

  /// Callback para que la UI reciba cada posición capturada
  void Function(Position position)? onPosition;

  /// Callback cuando el backend detecta la llegada por geocerca (RF11)
  void Function()? onGeofenceArrival;

  bool get isTracking => _activeTransferId != null;

  /// Umbral de distancia (metros) según la velocidad actual:
  /// detenido/ciudad → puntos densos; carretera → puntos espaciados.
  double _distanceThreshold(double speedMs) {
    if (speedMs < 3) return 20; // caminando / maniobrando
    if (speedMs < 14) return 60; // ciudad (~50 km/h)
    return 150; // carretera
  }

  Future<void> start(
    int transferId, {
    void Function(Position position)? onPosition,
    void Function()? onGeofenceArrival,
  }) async {
    if (_activeTransferId == transferId) {
      // Ya está rastreando esta transferencia: solo re-enganchar la UI
      this.onPosition = onPosition;
      this.onGeofenceArrival = onGeofenceArrival;
      return;
    }
    await stop();

    _activeTransferId = transferId;
    this.onPosition = onPosition;
    this.onGeofenceArrival = onGeofenceArrival;

    // Stream con filtro base fino; el filtrado adaptativo se aplica encima
    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen(_onPosition, onError: (Object e) {
      _logger.w('Error en stream GPS: $e');
    });

    // Heartbeat: punto de respaldo si no hay movimiento
    _heartbeatTimer = Timer.periodic(heartbeatInterval, (_) async {
      final last = _lastRecordedAt;
      if (last != null && DateTime.now().difference(last) < heartbeatInterval) {
        return;
      }
      final position = await Geolocator.getLastKnownPosition();
      if (position != null) {
        await _record(position);
      }
    });

    // Flush periódico del buffer
    _flushTimer = Timer.periodic(flushInterval, (_) => flush());

    // Flush inmediato al recuperar conectividad
    _connectivitySub = Connectivity().onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) {
        flush();
      }
    });

    // Punto inicial
    try {
      final initial = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      await _record(initial);
    } catch (e) {
      _logger.w('No se pudo obtener la posición inicial: $e');
    }
  }

  Future<void> _onPosition(Position position) async {
    if (_activeTransferId == null) return;

    final last = _lastRecorded;
    if (last != null) {
      final distance = Geolocator.distanceBetween(
        last.latitude,
        last.longitude,
        position.latitude,
        position.longitude,
      );
      if (distance < _distanceThreshold(position.speed)) {
        // Movimiento insuficiente: actualizar UI sin registrar
        onPosition?.call(position);
        return;
      }
    }

    await _record(position);
  }

  Future<void> _record(Position position) async {
    final transferId = _activeTransferId;
    if (transferId == null) return;

    _lastRecorded = position;
    _lastRecordedAt = DateTime.now();
    onPosition?.call(position);

    await _db.insertTrackingLog(
      TrackingLogsCompanion.insert(
        transferId: transferId,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: Value(position.speed * 3.6), // m/s → km/h
        accuracy: Value(position.accuracy),
        timestamp: DateTime.now(),
        needsSync: const Value(true),
      ),
    );

    final pending = await _db.countPendingTrackingLogs(transferId);
    if (pending >= batchSize) {
      await flush();
    }
  }

  /// Envía al backend todos los puntos pendientes en un solo request.
  /// Si falla (sin conexión, error de servidor), los puntos permanecen en
  /// Drift y se reintenta en el siguiente flush.
  Future<void> flush() async {
    final transferId = _activeTransferId;
    if (transferId == null || _flushing) return;
    _flushing = true;

    try {
      final pending = await _db.getPendingTrackingLogsByTransfer(transferId);
      if (pending.isEmpty) return;

      // Respetar el límite del backend (100 puntos por lote)
      const maxPerBatch = 100;
      for (var i = 0; i < pending.length; i += maxPerBatch) {
        final chunk = pending.skip(i).take(maxPerBatch).toList();

        final response = await _datasource.addGPSTrackingBatch(
          transferId: transferId,
          points: chunk
              .map((log) => {
                    'latitude': log.latitude,
                    'longitude': log.longitude,
                    'speed': log.speed,
                    'accuracy': log.accuracy,
                    'recordedAt': log.timestamp.toUtc().toIso8601String(),
                  })
              .toList(),
        );

        await _db.deleteTrackingLogsByIds(chunk.map((l) => l.id).toList());

        // El backend detectó la llegada por geocerca: avisar a la UI y
        // detener la captura (el estado ya es LLEGADA_DESTINO)
        if (response['arrivedByGeofence'] == true) {
          final arrivalCallback = onGeofenceArrival;

          // Los puntos restantes ya no son aceptados fuera de tránsito
          final remaining =
              await _db.getPendingTrackingLogsByTransfer(transferId);
          if (remaining.isNotEmpty) {
            await _db.deleteTrackingLogsByIds(
              remaining.map((l) => l.id).toList(),
            );
          }

          _flushing = false;
          await stop();
          arrivalCallback?.call();
          return;
        }
      }
    } catch (e) {
      _logger.w('Lote GPS no enviado, queda en cola local: $e');
    } finally {
      _flushing = false;
    }
  }

  /// Detiene la captura, intentando un último envío de lo pendiente
  Future<void> stop() async {
    await _positionSub?.cancel();
    await _connectivitySub?.cancel();
    _flushTimer?.cancel();
    _heartbeatTimer?.cancel();
    _positionSub = null;
    _connectivitySub = null;
    _flushTimer = null;
    _heartbeatTimer = null;

    if (_activeTransferId != null) {
      await flush();
    }

    _activeTransferId = null;
    _lastRecorded = null;
    _lastRecordedAt = null;
    onPosition = null;
    onGeofenceArrival = null;
  }
}

/// Provider del servicio de buffer de tracking (singleton)
final trackingBufferServiceProvider = Provider<TrackingBufferService>((ref) {
  final service = TrackingBufferService(
    db: ref.watch(databaseProvider),
    datasource: ref.watch(gpsTrackingDatasourceProvider),
  );
  ref.onDispose(() => service.stop());
  return service;
});
