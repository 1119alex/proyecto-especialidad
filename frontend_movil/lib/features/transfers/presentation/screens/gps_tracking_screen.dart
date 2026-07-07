import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/errors/error_messages.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../services/gps/tracking_buffer_service.dart';
import '../../domain/entities/transfer_entity.dart';
import '../../domain/route_progress.dart';
import '../providers/transfers_provider.dart';

class GPSTrackingScreen extends ConsumerStatefulWidget {
  final int transferId;
  final String transferCode;
  final String status;

  const GPSTrackingScreen({
    super.key,
    required this.transferId,
    required this.transferCode,
    required this.status,
  });

  @override
  ConsumerState<GPSTrackingScreen> createState() => _GPSTrackingScreenState();
}

class _GPSTrackingScreenState extends ConsumerState<GPSTrackingScreen> {
  late final TrackingBufferService _trackingService;
  final MapController _mapController = MapController();
  Timer? _elapsedTimer;
  Position? _currentPosition;
  double _currentSpeed = 0.0;
  int _elapsedMinutes = 0;
  double _totalDistance = 0.0;
  final String _trackingStatus = 'Activo';
  bool _isTracking = false;
  bool _routeFitted = false;

  @override
  void initState() {
    super.initState();
    _trackingService = ref.read(trackingBufferServiceProvider);
    _initializeTracking();
  }

  @override
  void dispose() {
    _elapsedTimer?.cancel();
    _mapController.dispose();
    // No se detiene el tracking: sigue activo aunque se salga de la pantalla.
    _trackingService.onPosition = null;
    super.dispose();
  }

  /// Encuadra la cámara una sola vez para mostrar origen, destino y posición.
  void _maybeFitRoute(WarehouseEntity? origin, WarehouseEntity? dest) {
    if (_routeFitted || !mounted || _currentPosition == null) return;
    final points = <LatLng>[
      LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
      if (origin?.hasCoordinates ?? false)
        LatLng(origin!.latitude!, origin.longitude!),
      if (dest?.hasCoordinates ?? false)
        LatLng(dest!.latitude!, dest.longitude!),
    ];
    if (points.length < 2) return;
    try {
      _mapController.fitCamera(
        CameraFit.coordinates(
          coordinates: points,
          padding: const EdgeInsets.all(56),
          maxZoom: 15,
        ),
      );
      _routeFitted = true;
    } catch (_) {
      // El mapa aún no está listo: se reintenta en el siguiente frame.
    }
  }

  Future<void> _initializeTracking() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _showPermissionDeniedDialog();
        return;
      }
    }
    if (permission == LocationPermission.deniedForever) {
      _showPermissionDeniedDialog();
      return;
    }
    await _startTracking();
  }

  Future<void> _startTracking() async {
    setState(() => _isTracking = true);
    _elapsedTimer = Timer.periodic(const Duration(minutes: 1), (timer) {
      if (_isTracking && mounted) setState(() => _elapsedMinutes++);
    });
    await _trackingService.start(
      widget.transferId,
      onPosition: _onPositionUpdate,
      onGeofenceArrival: _onGeofenceArrival,
    );
  }

  void _onGeofenceArrival() {
    if (!mounted) return;
    setState(() => _isTracking = false);
    ref.invalidate(transfersProvider);
    ref.invalidate(transferDetailProvider(widget.transferId));

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          '¡Llegada al destino detectada! El almacén ya fue notificado.',
        ),
      ),
    );
    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) Navigator.of(context).pop();
    });
  }

  void _onPositionUpdate(Position position) {
    if (!mounted) return;
    setState(() {
      if (_currentPosition != null) {
        _totalDistance +=
            Geolocator.distanceBetween(
              _currentPosition!.latitude,
              _currentPosition!.longitude,
              position.latitude,
              position.longitude,
            ) /
            1000;
      }
      _currentPosition = position;
      _currentSpeed = position.speed * 3.6;
    });
  }

  void _showPermissionDeniedDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Permiso de ubicación'),
        content: const Text(
          'La app necesita acceso a tu ubicación para el seguimiento GPS.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmArrival() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmar llegada'),
        content: const Text('¿Has llegado al destino?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      setState(() => _isTracking = false);
      await _trackingService.stop();
      final datasource = ref.read(transfersRemoteDatasourceProvider);
      await datasource.arriveDestination(widget.transferId);
      if (!mounted) return;
      ref.invalidate(transfersProvider);
      ref.invalidate(transferDetailProvider(widget.transferId));

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            '¡Llegada confirmada! Ya puedes escanear el QR en destino.',
          ),
        ),
      );
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (mounted) Navigator.of(context).pop();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(friendlyError(e)),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;

    final transfer = ref
        .watch(transferDetailProvider(widget.transferId))
        .valueOrNull;
    final origin = transfer?.originWarehouse;
    final dest = transfer?.destinationWarehouse;
    if (_currentPosition != null) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _maybeFitRoute(origin, dest),
      );
    }
    final progress = _currentPosition == null
        ? null
        : RouteProgress.compute(
            originLat: origin?.latitude,
            originLng: origin?.longitude,
            destLat: dest?.latitude,
            destLng: dest?.longitude,
            curLat: _currentPosition!.latitude,
            curLng: _currentPosition!.longitude,
            speedKmh: _currentSpeed,
          );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Seguimiento GPS'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(child: StatusBadge(widget.status, dense: true)),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              flex: 2,
              child: Container(
                margin: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: c.surfaceAlt,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: theme.colorScheme.outline),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: _currentPosition == null
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircularProgressIndicator(),
                              SizedBox(height: 14),
                              Text('Obteniendo ubicación...'),
                            ],
                          ),
                        )
                      : _map(theme, origin, dest),
                ),
              ),
            ),
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              icon: Icons.speed_rounded,
                              label: 'Velocidad',
                              value: '${_currentSpeed.toStringAsFixed(0)} km/h',
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              icon: Icons.access_time_rounded,
                              label: 'Tiempo',
                              value: '$_elapsedMinutes min',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              icon: Icons.route_rounded,
                              label: 'Distancia',
                              value: '${_totalDistance.toStringAsFixed(1)} km',
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              icon: Icons.check_circle_outline,
                              label: 'Estado',
                              value: _trackingStatus,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _ProgressView(progress: progress),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: _confirmArrival,
                          icon: const Icon(Icons.check_rounded),
                          label: const Text('Confirmar llegada'),
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            backgroundColor: c.success,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _map(ThemeData theme, WarehouseEntity? origin, WarehouseEntity? dest) {
    final scheme = theme.colorScheme;
    final cur = LatLng(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
    );
    final originLL = (origin?.hasCoordinates ?? false)
        ? LatLng(origin!.latitude!, origin.longitude!)
        : null;
    final destLL = (dest?.hasCoordinates ?? false)
        ? LatLng(dest!.latitude!, dest.longitude!)
        : null;

    // Línea de ruta: origen → posición actual → destino (con lo disponible).
    final routePoints = <LatLng>[?originLL, cur, ?destLL];

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: cur,
            initialZoom: 14.0,
            minZoom: 5.0,
            maxZoom: 18.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.logitrack.app',
            ),
            if (routePoints.length >= 2)
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: routePoints,
                    color: scheme.primary.withValues(alpha: 0.65),
                    strokeWidth: 4,
                  ),
                ],
              ),
            MarkerLayer(
              markers: [
                if (originLL != null)
                  _endpointMarker(
                    point: originLL,
                    color: theme.appColors.danger,
                    icon: Icons.trip_origin,
                    label: 'Origen',
                  ),
                if (destLL != null)
                  _endpointMarker(
                    point: destLL,
                    color: scheme.secondary,
                    icon: Icons.location_on,
                    label: 'Destino',
                  ),
                Marker(
                  point: cur,
                  width: 56,
                  height: 56,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      shape: BoxShape.circle,
                      boxShadow: const [
                        BoxShadow(
                          color: Colors.black26,
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.navigation,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        Positioned(
          top: 12,
          left: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Posición actual',
                  style: TextStyle(color: Colors.white70, fontSize: 10),
                ),
                const SizedBox(height: 2),
                Text(
                  'Lat ${_currentPosition!.latitude.toStringAsFixed(5)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
                Text(
                  'Lng ${_currentPosition!.longitude.toStringAsFixed(5)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Marker _endpointMarker({
    required LatLng point,
    required Color color,
    required IconData icon,
    required String label,
  }) {
    return Marker(
      point: point,
      width: 96,
      height: 58,
      alignment: Alignment.topCenter,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: const [
                BoxShadow(color: Colors.black26, blurRadius: 6),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(height: 3),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.65),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressView extends StatelessWidget {
  const _ProgressView({required this.progress});
  final RouteProgress? progress;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    final pct = progress?.percent;
    final eta = progress?.eta;
    final arrival = eta == null ? null : DateTime.now().add(eta);
    String two(int n) => n.toString().padLeft(2, '0');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Progreso del recorrido',
              style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
            ),
            Text(
              pct == null ? '—' : '${(pct * 100).round()}%',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: pct,
            backgroundColor: c.surfaceAlt,
            minHeight: 8,
          ),
        ),
        if (progress != null) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.flag_outlined, size: 15, color: c.muted),
              const SizedBox(width: 6),
              Text(
                'Faltan ${progress!.remainingKm.toStringAsFixed(1)} km',
                style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
              ),
              const Spacer(),
              if (arrival != null)
                Text(
                  'Llega ~${two(arrival.hour)}:${two(arrival.minute)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),
        ] else ...[
          const SizedBox(height: 8),
          Text(
            'Calculando avance...',
            style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
          ),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: c.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: theme.colorScheme.primary, size: 20),
          const SizedBox(height: 8),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
