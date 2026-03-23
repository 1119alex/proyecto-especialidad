import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../providers/transfers_provider.dart';
import '../../domain/entities/transfer_entity.dart';

/// Pantalla de lista de transferencias
class TransfersListScreen extends ConsumerStatefulWidget {
  const TransfersListScreen({super.key});

  @override
  ConsumerState<TransfersListScreen> createState() =>
      _TransfersListScreenState();
}

class _TransfersListScreenState extends ConsumerState<TransfersListScreen> {
  String? _selectedFilter;

  @override
  Widget build(BuildContext context) {
    final transfersAsync = ref.watch(transfersProvider);
    final authState = ref.watch(authProvider);
    final userName = authState.value?.userName ?? 'Usuario';

    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header con saludo y viaje activo
            Container(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFF1E293B),
                    const Color(0xFF334155),
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Hola,',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            userName.split(' ')[0],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(
                          Icons.logout,
                          color: Colors.white,
                          size: 24,
                        ),
                        onPressed: () async {
                          // Mostrar diálogo de confirmación
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              backgroundColor: const Color(0xFF2A3544),
                              title: const Text(
                                'Cerrar Sesión',
                                style: TextStyle(color: Colors.white),
                              ),
                              content: const Text(
                                '¿Estás seguro de que deseas cerrar sesión?',
                                style: TextStyle(color: Colors.white70),
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.of(context).pop(false),
                                  child: const Text('Cancelar'),
                                ),
                                ElevatedButton(
                                  onPressed: () => Navigator.of(context).pop(true),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFEF4444),
                                  ),
                                  child: const Text('Cerrar Sesión'),
                                ),
                              ],
                            ),
                          );

                          if (confirmed == true && context.mounted) {
                            await ref.read(authProvider.notifier).logout();
                            if (context.mounted) {
                              context.go(AppRoutes.login);
                            }
                          }
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Estado actual del viaje
            _buildActiveTrip(transfersAsync),

            // Título de sección
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'MIS VIAJES',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  transfersAsync.when(
                    data: (transfers) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${transfers.length} viajes',
                        style: const TextStyle(
                          color: Color(0xFF3B82F6),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    loading: () => const SizedBox.shrink(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ],
              ),
            ),

            // Lista de transferencias
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                ),
                child: transfersAsync.when(
                  data: (transfers) {
                    // Aplicar filtro si existe
                    final filteredTransfers = _selectedFilter == null
                        ? transfers
                        : transfers
                            .where((t) => t.status == _selectedFilter)
                            .toList();

                    if (filteredTransfers.isEmpty) {
                      return _buildEmptyState();
                    }

                    return RefreshIndicator(
                      onRefresh: () async {
                        await ref.read(transfersProvider.notifier).refresh();
                      },
                      child: ListView.builder(
                        padding: const EdgeInsets.all(20),
                        itemCount: filteredTransfers.length,
                        itemBuilder: (context, index) {
                          final transfer = filteredTransfers[index];
                          return _buildTransferCard(context, transfer);
                        },
                      ),
                    );
                  },
                  loading: () => const Center(
                    child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
                  ),
                  error: (error, stack) => _buildErrorState(error.toString()),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNavigation(),
    );
  }

  Widget _buildActiveTrip(AsyncValue<List<TransferEntity>> transfersAsync) {
    return transfersAsync.when(
      data: (transfers) {
        // Buscar viaje activo (EN_TRANSITO)
        final activeTrip = transfers.firstWhere(
          (t) => t.status == 'EN_TRANSITO',
          orElse: () => transfers.firstWhere(
            (t) => t.status == 'LISTA_DESPACHO',
            orElse: () => transfers.first,
          ),
        );

        if (activeTrip.status == 'EN_TRANSITO') {
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF3B82F6),
                  Color(0xFF2563EB),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF3B82F6).withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.navigation,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'VIAJE ACTIVO',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            activeTrip.transferCode,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Destino',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            activeTrip.destinationWarehouse?.name ?? 'N/A',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _navigateToGPSTracking(context, activeTrip),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF3B82F6),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.map, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Ver en Mapa',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        } else if (activeTrip.status == 'LISTA_DESPACHO') {
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF334155),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFF10B981),
                width: 2,
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.qr_code_scanner,
                        color: Color(0xFF10B981),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'LISTO PARA RECOGER',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            activeTrip.transferCode,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Recoger en',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            activeTrip.originWarehouse?.name ?? 'N/A',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _navigateToQRScanner(context, activeTrip, 'origin'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.qr_code_scanner, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Escanear QR y Recoger',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildBottomNavigation() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // Inicio (Viajes)
              _buildNavItem(
                icon: Icons.home,
                label: 'Inicio',
                isActive: true,
                onTap: () {},
              ),

              // Viajes
              _buildNavItem(
                icon: Icons.local_shipping_outlined,
                label: 'Viajes',
                isActive: false,
                onTap: () {},
              ),

              // QR Scanner (Centro - Destacado)
              _buildQRScannerButton(),

              // Alertas
              _buildNavItem(
                icon: Icons.notifications_outlined,
                label: 'Alertas',
                isActive: false,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Alertas - Próximamente'),
                      duration: Duration(seconds: 1),
                    ),
                  );
                },
              ),

              // Perfil
              _buildNavItem(
                icon: Icons.person_outline,
                label: 'Perfil',
                isActive: false,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Perfil - Próximamente'),
                      duration: Duration(seconds: 1),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: isActive
                    ? const Color(0xFF3B82F6)
                    : const Color(0xFF94A3B8),
                size: 24,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isActive
                      ? const Color(0xFF3B82F6)
                      : const Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQRScannerButton() {
    return Container(
      width: 64,
      height: 64,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF3B82F6),
            Color(0xFF2563EB),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.4),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            // TODO: Navegar al QR Scanner cuando esté implementado
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('QR Scanner - Próximamente'),
                duration: Duration(seconds: 1),
                backgroundColor: Color(0xFF3B82F6),
              ),
            );
          },
          borderRadius: BorderRadius.circular(20),
          child: const Icon(
            Icons.qr_code_scanner,
            color: Colors.white,
            size: 32,
          ),
        ),
      ),
    );
  }


  Widget _buildTransferCard(BuildContext context, TransferEntity transfer) {
    // Determinar el color del borde izquierdo según el estado
    Color borderColor;
    switch (transfer.status.toUpperCase()) {
      case 'PENDIENTE':
        borderColor = const Color(0xFF9CA3AF); // Gris
        break;
      case 'EN_TRANSITO':
        borderColor = const Color(0xFFFBBF24); // Amarillo/Naranja
        break;
      case 'ASIGNADA':
        borderColor = const Color(0xFF3B82F6); // Azul
        break;
      case 'COMPLETADA':
        borderColor = const Color(0xFF10B981); // Verde
        break;
      default:
        borderColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(
            color: borderColor,
            width: 6,
          ),
        ),
      ),
      child: InkWell(
        onTap: () {
          context.push('${AppRoutes.transfers}/${transfer.id}');
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Código y Estado
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    transfer.transferCode,
                    style: const TextStyle(
                      color: Color(0xFF1E293B),
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  _buildStatusBadge(transfer.status),
                ],
              ),
              const SizedBox(height: 12),

              // Origen
              Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      color: Color(0xFFEF4444), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      transfer.originWarehouse?.name ?? 'Almacén Origen',
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Destino
              Row(
                children: [
                  const Icon(Icons.warehouse_outlined,
                      color: Color(0xFF64748B), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      transfer.destinationWarehouse?.name ?? 'Almacén Destino',
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Footer: Hora
              Row(
                children: [
                  const Icon(Icons.access_time,
                      color: Color(0xFF64748B), size: 16),
                  const SizedBox(width: 6),
                  Text(
                    _formatTime(transfer.createdAt),
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),

              // Action buttons based on role and status
              const SizedBox(height: 12),
              _buildActionButtons(context, transfer),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, TransferEntity transfer) {
    // TODO: Get user role from auth provider
    // final userRole = ref.read(authProvider).user?.role;
    final userRole = 'TRANSPORTISTA'; // Mock for now

    final buttons = <Widget>[];

    // Encargado de Almacén (Origen)
    if (userRole == 'ENCARGADO_ALMACEN') {
      if (transfer.status == 'EN_PREPARACION') {
        buttons.add(
          _buildActionButton(
            label: 'Mostrar QR',
            icon: Icons.qr_code,
            color: const Color(0xFF3B82F6),
            onPressed: () => _navigateToQRDisplay(context, transfer),
          ),
        );
      }
      if (transfer.status == 'LLEGADA_DESTINO') {
        buttons.add(
          _buildActionButton(
            label: 'Escanear QR',
            icon: Icons.qr_code_scanner,
            color: const Color(0xFF10B981),
            onPressed: () => _navigateToQRScanner(context, transfer, 'destination'),
          ),
        );
      }
    }

    // Transportista
    if (userRole == 'TRANSPORTISTA') {
      if (transfer.status == 'LISTA_DESPACHO') {
        buttons.add(
          _buildActionButton(
            label: 'Escanear QR Origen',
            icon: Icons.qr_code_scanner,
            color: const Color(0xFF3B82F6),
            onPressed: () => _navigateToQRScanner(context, transfer, 'origin'),
          ),
        );
      }
      if (transfer.status == 'EN_TRANSITO') {
        buttons.add(
          _buildActionButton(
            label: 'Ver Seguimiento GPS',
            icon: Icons.navigation,
            color: const Color(0xFFFBBF24),
            onPressed: () => _navigateToGPSTracking(context, transfer),
          ),
        );
        buttons.add(
          _buildActionButton(
            label: 'Confirmar Llegada',
            icon: Icons.check_circle,
            color: const Color(0xFF10B981),
            onPressed: () => _confirmArrival(context, transfer),
          ),
        );
      }
    }

    if (buttons.isEmpty) {
      return const SizedBox.shrink();
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: buttons,
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 36,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 16),
        label: Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }

  void _navigateToQRDisplay(BuildContext context, TransferEntity transfer) {
    // TODO: Navigate to QR display screen
    context.push('/qr-display', extra: {
      'transferId': transfer.id,
      'transferCode': transfer.transferCode,
      'qrCode': transfer.qrCode ?? 'TRF-${transfer.id}-${DateTime.now().millisecondsSinceEpoch}',
      'originName': transfer.originWarehouse?.name ?? 'N/A',
      'destinationName': transfer.destinationWarehouse?.name ?? 'N/A',
      'totalProducts': transfer.details?.length ?? 0,
    });
  }

  void _navigateToQRScanner(BuildContext context, TransferEntity transfer, String location) {
    // TODO: Navigate to QR scanner screen
    context.push('/qr-scanner', extra: {
      'transferId': transfer.id,
      'location': location,
    });
  }

  void _navigateToGPSTracking(BuildContext context, TransferEntity transfer) {
    // TODO: Navigate to GPS tracking screen
    context.push('/gps-tracking', extra: {
      'transferId': transfer.id,
      'transferCode': transfer.transferCode,
      'status': transfer.status,
    });
  }

  Future<void> _confirmArrival(BuildContext context, TransferEntity transfer) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2A3544),
        title: const Text(
          'Confirmar Llegada',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          '¿Has llegado al destino: ${transfer.destinationWarehouse?.name}?',
          style: const TextStyle(color: Colors.white70),
        ),
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

    if (confirmed == true) {
      // TODO: Update transfer status to LLEGADA_DESTINO
      // await ref.read(transfersProvider.notifier).arriveDestination(transfer.id);
      ref.read(transfersProvider.notifier).refresh();
    }
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status.toUpperCase()) {
      case 'PENDIENTE':
        bgColor = const Color(0xFFFEF3C7); // Amarillo claro
        textColor = const Color(0xFF92400E); // Texto amarillo oscuro
        label = 'PENDIENTE';
        break;
      case 'EN_TRANSITO':
        bgColor = const Color(0xFFFEF3C7); // Amarillo claro (según mockup)
        textColor = const Color(0xFF92400E);
        label = 'EN TRÁNSITO';
        break;
      case 'ASIGNADA':
        bgColor = const Color(0xFFDEF0FF); // Azul claro
        textColor = const Color(0xFF1E40AF);
        label = 'ASIGNADA';
        break;
      case 'COMPLETADA':
        bgColor = const Color(0xFFD1FAE5); // Verde claro
        textColor = const Color(0xFF065F46);
        label = 'COMPLETADA';
        break;
      case 'CANCELADA':
        bgColor = const Color(0xFFFEE2E2); // Rojo claro
        textColor = const Color(0xFF991B1B);
        label = 'CANCELADA';
        break;
      default:
        bgColor = const Color(0xFFF3F4F6);
        textColor = const Color(0xFF6B7280);
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_outlined, size: 80, color: Colors.white24),
          const SizedBox(height: 16),
          Text(
            _selectedFilter == null
                ? 'No hay transferencias'
                : 'No hay transferencias con estado "$_selectedFilter"',
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 16,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 80, color: Colors.red),
          const SizedBox(height: 16),
          Text(
            'Error al cargar transferencias',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ref.read(transfersProvider.notifier).refresh();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue.shade600,
            ),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }


  String _formatTime(DateTime date) {
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
