import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../services/gps/tracking_buffer_service.dart';
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
  Timer? _elapsedTimer;
  Position? _currentPosition;
  double _currentSpeed = 0.0;
  int _elapsedMinutes = 0;
  double _totalDistance = 0.0;
  final String _trackingStatus = 'Activo';
  bool _isTracking = false;

  @override
  void initState() {
    super.initState();
    _trackingService = ref.read(trackingBufferServiceProvider);
    _initializeTracking();
  }

  @override
  void dispose() {
    _elapsedTimer?.cancel();
    // No se detiene el tracking: sigue activo aunque se salga de la pantalla
    // (el servicio captura por distancia y sincroniza por lotes). Solo se
    // desengancha la UI; el tracking termina al confirmar la llegada.
    _trackingService.onPosition = null;
    super.dispose();
  }

  Future<void> _initializeTracking() async {
    // Check location permissions
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

    // Start tracking
    await _startTracking();
  }

  Future<void> _startTracking() async {
    setState(() {
      _isTracking = true;
    });

    // Update elapsed time every minute
    _elapsedTimer = Timer.periodic(const Duration(minutes: 1), (timer) {
      if (_isTracking && mounted) {
        setState(() {
          _elapsedMinutes++;
        });
      }
    });

    // Captura adaptativa por distancia + buffer offline + envío por lotes
    await _trackingService.start(
      widget.transferId,
      onPosition: _onPositionUpdate,
      onGeofenceArrival: _onGeofenceArrival,
    );
  }

  /// El backend detectó la llegada al destino por geocerca (RF11)
  void _onGeofenceArrival() {
    if (!mounted) return;

    setState(() {
      _isTracking = false;
    });

    ref.invalidate(transfersProvider);
    ref.invalidate(transferDetailProvider(widget.transferId));

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.location_on, color: Colors.white),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                '¡Llegada al destino detectada automáticamente! '
                'El almacén ya fue notificado.',
                style: TextStyle(fontSize: 15),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 4),
      ),
    );

    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) {
        Navigator.of(context).pop();
      }
    });
  }

  void _onPositionUpdate(Position position) {
    if (!mounted) return;

    setState(() {
      if (_currentPosition != null) {
        final distance = Geolocator.distanceBetween(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
          position.latitude,
          position.longitude,
        );
        _totalDistance += distance / 1000; // Convert to km
      }

      _currentPosition = position;
      _currentSpeed = position.speed * 3.6; // Convert m/s to km/h
    });
  }

  void _showPermissionDeniedDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Permiso de Ubicación'),
        content: const Text(
          'Esta aplicación necesita acceso a tu ubicación para el seguimiento GPS.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
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
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Llegada'),
        content: const Text('¿Has llegado al destino?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
            ),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      // Detener el tracking enviando los puntos pendientes antes de cerrar
      setState(() {
        _isTracking = false;
      });
      await _trackingService.stop();

      final datasource = ref.read(transfersRemoteDatasourceProvider);
      await datasource.arriveDestination(widget.transferId);

      if (!mounted) return;

      // Invalidar providers para refrescar
      ref.invalidate(transfersProvider);
      ref.invalidate(transferDetailProvider(widget.transferId));

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  '¡Llegada confirmada! Ahora puedes escanear el QR en el almacén destino.',
                  style: TextStyle(fontSize: 15),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 4),
        ),
      );

      // Volver a la pantalla anterior después de un delay
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (mounted) {
          Navigator.of(context).pop();
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al confirmar llegada: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint(
      '🏗️ Building GPS Tracking Screen - Transfer ID: ${widget.transferId}',
    );
    final progressPercentage = 0.58; // Mock progress

    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Tracking GPS',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFFBBF24),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              'EN TRÁNSITO',
              style: TextStyle(
                color: Color(0xFF1E293B),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Map container (placeholder for actual map)
          Expanded(
            flex: 2,
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF334155),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF475569), width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: _currentPosition == null
                    ? Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF059669), Color(0xFF047857)],
                          ),
                        ),
                        child: const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircularProgressIndicator(
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                              SizedBox(height: 16),
                              Text(
                                'Obteniendo ubicación...',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : Stack(
                        children: [
                          FlutterMap(
                            options: MapOptions(
                              initialCenter: LatLng(
                                _currentPosition!.latitude,
                                _currentPosition!.longitude,
                              ),
                              initialZoom: 15.0,
                              minZoom: 10.0,
                              maxZoom: 18.0,
                            ),
                            children: [
                              TileLayer(
                                urlTemplate:
                                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.logitrack.app',
                              ),
                              MarkerLayer(
                                markers: [
                                  // Current position marker
                                  Marker(
                                    point: LatLng(
                                      _currentPosition!.latitude,
                                      _currentPosition!.longitude,
                                    ),
                                    width: 60,
                                    height: 60,
                                    child: Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFFBBF24),
                                        shape: BoxShape.circle,
                                        boxShadow: [
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
                                        size: 28,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          // Location info overlay
                          Positioned(
                            top: 16,
                            left: 16,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFF1E293B,
                                ).withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Posición actual',
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 10,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Lat: ${_currentPosition!.latitude.toStringAsFixed(6)}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                  Text(
                                    'Lng: ${_currentPosition!.longitude.toStringAsFixed(6)}',
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
                      ),
              ),
            ),
          ),

          // Stats section
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.all(16),
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Speed and Time stats
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.speed,
                            label: 'Velocidad',
                            value: '${_currentSpeed.toStringAsFixed(0)} km/h',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.access_time,
                            label: 'Tiempo',
                            value: '$_elapsedMinutes min',
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Distance and Status stats
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.route,
                            label: 'Distancia',
                            value: '${_totalDistance.toStringAsFixed(1)} km',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.check_circle,
                            label: 'Estado',
                            value: _trackingStatus,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Progress bar
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Progreso del recorrido',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              '${(progressPercentage * 100).toInt()}%',
                              style: const TextStyle(
                                color: Color(0xFF3B82F6),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: progressPercentage,
                            backgroundColor: const Color(0xFF475569),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              Color(0xFF3B82F6),
                            ),
                            minHeight: 8,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Confirm arrival button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _confirmArrival,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Confirmar Llegada',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
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
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF334155),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFF3B82F6), size: 20),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(color: Colors.white54, fontSize: 11),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
