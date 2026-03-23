import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../transfers/presentation/providers/transfers_provider.dart';
import '../../../transfers/domain/entities/transfer_entity.dart';

/// Pantalla principal del Encargado de Almacén
class WarehouseHomeScreen extends ConsumerStatefulWidget {
  const WarehouseHomeScreen({super.key});

  @override
  ConsumerState<WarehouseHomeScreen> createState() => _WarehouseHomeScreenState();
}

class _WarehouseHomeScreenState extends ConsumerState<WarehouseHomeScreen> {
  int _selectedIndex = 0;

  // Lista de pantallas para cada tab
  final List<Widget> _screens = [];

  @override
  void initState() {
    super.initState();
    _screens.addAll([
      const _DashboardTab(), // Inicio
      const _OutgoingTransfersTab(), // Salidas
      const SizedBox.shrink(), // QR Scanner (se maneja diferente)
      const _IncomingTransfersTab(), // Entradas
      const _ProfileTab(), // Perfil
    ]);
  }

  void _onItemTapped(int index) {
    // Si presiona el botón del centro (QR Scanner)
    if (index == 2) {
      // TODO: Navigate to QR Scanner
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('QR Scanner - Próximamente'),
          duration: Duration(seconds: 1),
          backgroundColor: Color(0xFF3B82F6),
        ),
      );
      return;
    }

    setState(() {
      _selectedIndex = index > 2 ? index - 1 : index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: _buildBottomNavigation(),
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
              // Inicio
              _buildNavItem(
                icon: Icons.home,
                label: 'Inicio',
                isActive: _selectedIndex == 0,
                onTap: () => _onItemTapped(0),
              ),

              // Salidas
              _buildNavItem(
                icon: Icons.exit_to_app,
                label: 'Salidas',
                isActive: _selectedIndex == 1,
                onTap: () => _onItemTapped(1),
              ),

              // QR Scanner (Centro - Destacado)
              _buildQRScannerButton(),

              // Entradas
              _buildNavItem(
                icon: Icons.input,
                label: 'Entradas',
                isActive: _selectedIndex == 2,
                onTap: () => _onItemTapped(3),
              ),

              // Perfil
              _buildNavItem(
                icon: Icons.person_outline,
                label: 'Perfil',
                isActive: _selectedIndex == 3,
                onTap: () => _onItemTapped(4),
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
          onTap: () => _onItemTapped(2),
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
}

/// Tab de Dashboard (Inicio)
class _DashboardTab extends ConsumerWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final transfersAsync = ref.watch(transfersProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      body: SafeArea(
        child: authState.when(
          data: (state) {
            // Obtener datos reales del usuario
            final userName = state.userName ?? 'Usuario';
            final warehouseName = state.warehouseName ?? 'Sin almacén asignado';

            return CustomScrollView(
              slivers: [
                // Header
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.all(24),
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
                              icon: const Icon(Icons.logout, color: Colors.white),
                              onPressed: () async {
                                await ref.read(authProvider.notifier).logout();
                                if (context.mounted) {
                                  context.go(AppRoutes.login);
                                }
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.2),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.warehouse,
                                color: Color(0xFF3B82F6),
                                size: 24,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Tu almacén',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 12,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      warehouseName,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Estadísticas
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: transfersAsync.when(
                      data: (transfers) {
                        // Filtrar transferencias del almacén del usuario
                        final warehouseId = state.warehouseId;
                        final warehouseTransfers = warehouseId != null
                            ? transfers.where((t) =>
                                t.originWarehouseId == warehouseId ||
                                t.destinationWarehouseId == warehouseId).toList()
                            : <TransferEntity>[];

                        final enPreparacion = warehouseTransfers
                            .where((t) => t.status == 'EN_PREPARACION')
                            .length;
                        final listasDespacho = warehouseTransfers
                            .where((t) => t.status == 'LISTA_DESPACHO')
                            .length;
                        final enTransito = warehouseTransfers
                            .where((t) => t.status == 'EN_TRANSITO')
                            .length;
                        final llegandoDestino = warehouseTransfers
                            .where((t) => t.status == 'LLEGADA_DESTINO')
                            .length;

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Resumen de Hoy',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _StatCard(
                                    title: 'En Preparación',
                                    value: enPreparacion.toString(),
                                    icon: Icons.inventory_2_outlined,
                                    color: const Color(0xFFFBBF24),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _StatCard(
                                    title: 'Listas',
                                    value: listasDespacho.toString(),
                                    icon: Icons.check_circle_outline,
                                    color: const Color(0xFF10B981),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _StatCard(
                                    title: 'En Camino',
                                    value: enTransito.toString(),
                                    icon: Icons.local_shipping_outlined,
                                    color: const Color(0xFF3B82F6),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _StatCard(
                                    title: 'Por Recibir',
                                    value: llegandoDestino.toString(),
                                    icon: Icons.move_to_inbox_outlined,
                                    color: const Color(0xFF8B5CF6),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        );
                      },
                      loading: () => const Center(
                        child: CircularProgressIndicator(
                          color: Color(0xFF3B82F6),
                        ),
                      ),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                  ),
                ),

                // Espacio final
                const SliverToBoxAdapter(
                  child: SizedBox(height: 24),
                ),
              ],
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
          ),
          error: (error, stack) => Center(
            child: Text(
              'Error: $error',
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }
}

/// Widget de tarjeta de estadística
class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF2A3544),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// Tab de Salidas (Transferencias Origen)
class _OutgoingTransfersTab extends ConsumerWidget {
  const _OutgoingTransfersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final transfersAsync = ref.watch(transfersProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: const Text(
          'Salidas',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: authState.when(
        data: (auth) {
          final warehouseId = auth.warehouseId;

          return transfersAsync.when(
            data: (transfers) {
              // Filtrar transferencias donde este almacén es el ORIGEN
              final outgoingTransfers = warehouseId != null
                  ? transfers
                      .where((t) => t.originWarehouseId == warehouseId)
                      .toList()
                  : <TransferEntity>[];

              if (outgoingTransfers.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.inbox_outlined,
                        size: 64,
                        color: Colors.white38,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'No hay transferencias de salida',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: outgoingTransfers.length,
                itemBuilder: (context, index) {
                  final transfer = outgoingTransfers[index];
                  return _TransferCard(transfer: transfer);
                },
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF3B82F6),
              ),
            ),
            error: (error, stack) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.redAccent,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error: $error',
                    style: const TextStyle(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
        ),
        error: (error, stack) => Center(
          child: Text(
            'Error de autenticación',
            style: const TextStyle(color: Colors.white70),
          ),
        ),
      ),
    );
  }
}

/// Widget de tarjeta de transferencia
class _TransferCard extends StatelessWidget {
  final TransferEntity transfer;

  const _TransferCard({required this.transfer});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: const Color(0xFF334155),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          context.push('/transfers/${transfer.id}');
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header con código y estado
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    transfer.transferCode,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  _buildStatusChip(transfer.status),
                ],
              ),
              const SizedBox(height: 12),
              // Origen y Destino
              Row(
                children: [
                  const Icon(
                    Icons.warehouse,
                    color: Colors.white70,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      transfer.originWarehouse?.name ?? 'Origen',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(
                    Icons.location_on,
                    color: Colors.white70,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      transfer.destinationWarehouse?.name ?? 'Destino',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              if (transfer.details != null && transfer.details!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.inventory_2,
                      color: Colors.white70,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${transfer.details!.length} producto(s)',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String label;

    switch (status) {
      case 'PENDIENTE':
        color = const Color(0xFF6B7280);
        label = 'Pendiente';
        break;
      case 'EN_PREPARACION':
        color = const Color(0xFFFBBF24);
        label = 'En Preparación';
        break;
      case 'LISTA_DESPACHO':
        color = const Color(0xFF3B82F6);
        label = 'Lista';
        break;
      case 'EN_TRANSITO':
        color = const Color(0xFF8B5CF6);
        label = 'En Tránsito';
        break;
      case 'LLEGADA_DESTINO':
        color = const Color(0xFF10B981);
        label = 'Llegada';
        break;
      case 'COMPLETADA':
        color = const Color(0xFF059669);
        label = 'Completada';
        break;
      case 'CANCELADA':
        color = const Color(0xFFEF4444);
        label = 'Cancelada';
        break;
      default:
        color = const Color(0xFF6B7280);
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color, width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Tab de Entradas (Transferencias Destino)
class _IncomingTransfersTab extends ConsumerWidget {
  const _IncomingTransfersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final transfersAsync = ref.watch(transfersProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: const Text(
          'Entradas',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: authState.when(
        data: (auth) {
          final warehouseId = auth.warehouseId;

          return transfersAsync.when(
            data: (transfers) {
              // Filtrar transferencias donde este almacén es el DESTINO
              final incomingTransfers = warehouseId != null
                  ? transfers
                      .where((t) => t.destinationWarehouseId == warehouseId)
                      .toList()
                  : <TransferEntity>[];

              if (incomingTransfers.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.inbox_outlined,
                        size: 64,
                        color: Colors.white38,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'No hay transferencias de entrada',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: incomingTransfers.length,
                itemBuilder: (context, index) {
                  final transfer = incomingTransfers[index];
                  return _TransferCard(transfer: transfer);
                },
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF3B82F6),
              ),
            ),
            error: (error, stack) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.redAccent,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error: $error',
                    style: const TextStyle(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
        ),
        error: (error, stack) => Center(
          child: Text(
            'Error de autenticación',
            style: const TextStyle(color: Colors.white70),
          ),
        ),
      ),
    );
  }
}

/// Tab de Perfil
class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: const Text(
          'Perfil',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: const Center(
        child: Text(
          'Perfil del Encargado\n(Próximamente)',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white70,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}
