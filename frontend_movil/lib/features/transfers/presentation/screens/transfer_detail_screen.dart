import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/transfers_provider.dart';
import '../../domain/entities/transfer_entity.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../core/constants/app_constants.dart';

/// Pantalla de detalle de una transferencia
class TransferDetailScreen extends ConsumerWidget {
  final int transferId;

  const TransferDetailScreen({
    super.key,
    required this.transferId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transferAsync = ref.watch(transferDetailProvider(transferId));

    return Scaffold(
      backgroundColor: const Color(0xFF1A2332),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2A3544),
        title: const Text(
          'DETALLE TRANSFERENCIA',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: transferAsync.when(
        data: (transfer) => _buildContent(context, ref, transfer),
        loading: () => const Center(
          child: CircularProgressIndicator(color: Colors.blue),
        ),
        error: (error, stack) => _buildErrorState(context, ref, error.toString()),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, TransferEntity transfer) {
    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(transferDetailProvider(transferId).notifier).refresh();
      },
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Código y Estado
            _buildHeaderSection(transfer),
            const SizedBox(height: 20),

            // Rutas
            _buildRouteSection(transfer),
            const SizedBox(height: 20),

            // Vehículo y Conductor
            if (transfer.vehicle != null || transfer.driver != null)
              _buildVehicleDriverSection(transfer),
            if (transfer.vehicle != null || transfer.driver != null)
              const SizedBox(height: 20),

            // QR Code
            if (transfer.qrCode != null) _buildQRSection(transfer),
            if (transfer.qrCode != null) const SizedBox(height: 20),

            // Tiempos
            _buildTimesSection(transfer),
            const SizedBox(height: 20),

            // Productos
            if (transfer.details != null && transfer.details!.isNotEmpty)
              _buildProductsSection(transfer),

            // Notas
            if (transfer.notes != null && transfer.notes!.isNotEmpty)
              _buildNotesSection(transfer),

            // Botones de acción
            const SizedBox(height: 20),
            _buildActionButtons(context, ref, transfer),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, WidgetRef ref, TransferEntity transfer) {
    final authState = ref.watch(authProvider);
    final userRole = authState.value?.userRole;
    final userWarehouseId = authState.value?.warehouseId;

    final List<Widget> buttons = [];

    // Botones para ENCARGADO_ALMACEN
    if (userRole == AppConstants.roleEncargadoAlmacen) {
      // Si soy el encargado del almacén de ORIGEN
      if (userWarehouseId == transfer.originWarehouseId) {
        // Iniciar preparación cuando está ASIGNADA
        if (transfer.status == 'ASIGNADA') {
          buttons.add(
            _buildActionButton(
              label: 'Iniciar Preparación de Carga',
              icon: Icons.inventory,
              color: const Color(0xFF10B981),
              onPressed: () => _startPreparation(context, ref, transfer.id),
            ),
          );
        }

        // Mostrar QR cuando está EN_PREPARACION o LISTA_DESPACHO
        if (transfer.status == 'EN_PREPARACION' || transfer.status == 'LISTA_DESPACHO') {
          buttons.add(
            _buildActionButton(
              label: 'Mostrar Código QR',
              icon: Icons.qr_code,
              color: const Color(0xFF3B82F6),
              onPressed: () {
                context.push('/qr-display', extra: {
                  'transferId': transfer.id,
                  'transferCode': transfer.transferCode,
                  'originName': transfer.originWarehouse?.name ?? 'Origen',
                  'destinationName': transfer.destinationWarehouse?.name ?? 'Destino',
                  'totalProducts': transfer.details?.length ?? 0,
                });
              },
            ),
          );
        }
      }

      // Si soy el encargado del almacén de DESTINO
      if (userWarehouseId == transfer.destinationWarehouseId) {
        // Escanear QR al recibir
        if (transfer.status == 'LLEGADA_DESTINO') {
          buttons.add(
            _buildActionButton(
              label: 'Escanear QR y Recibir',
              icon: Icons.qr_code_scanner,
              color: const Color(0xFF10B981),
              onPressed: () {
                context.push('/qr-scanner', extra: {
                  'transferId': transfer.id,
                  'location': 'destination',
                });
              },
            ),
          );
        }
      }
    }

    // Botones para TRANSPORTISTA
    if (userRole == AppConstants.roleTransportista) {
      // Escanear QR en origen
      if (transfer.status == 'LISTA_DESPACHO') {
        buttons.add(
          _buildActionButton(
            label: 'Escanear QR - Recoger Carga',
            icon: Icons.qr_code_scanner,
            color: const Color(0xFF3B82F6),
            onPressed: () {
              context.push('/qr-scanner', extra: {
                'transferId': transfer.id,
                'location': 'origin',
              });
            },
          ),
        );
      }

      // Ver seguimiento GPS
      if (transfer.status == 'EN_TRANSITO') {
        buttons.add(
          _buildActionButton(
            label: 'Ver Seguimiento GPS',
            icon: Icons.navigation,
            color: const Color(0xFFFBBF24),
            onPressed: () {
              context.push('/gps-tracking', extra: {
                'transferId': transfer.id,
                'transferCode': transfer.transferCode,
                'status': transfer.status,
              });
            },
          ),
        );
      }
    }

    if (buttons.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: buttons.map((btn) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: btn,
      )).toList(),
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 24),
        label: Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
      ),
    );
  }

  Future<void> _startPreparation(BuildContext context, WidgetRef ref, int transferId) async {
    // Mostrar diálogo de confirmación
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2A3544),
        title: const Text(
          'Iniciar Preparación',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          '¿Desea iniciar la preparación de esta transferencia? Esto generará el código QR para el transportista.',
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
              backgroundColor: const Color(0xFF10B981),
            ),
            child: const Text('Iniciar'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      // Mostrar indicador de carga
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(color: Colors.blue),
        ),
      );

      // Llamar al método para iniciar preparación
      await ref.read(transferDetailProvider(transferId).notifier).startPreparation();

      if (!context.mounted) return;

      // Cerrar indicador de carga
      Navigator.of(context).pop();

      // Mostrar mensaje de éxito
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Preparación iniciada. Ahora puede mostrar el código QR.',
                  style: TextStyle(fontSize: 15),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 3),
        ),
      );
    } catch (e) {
      if (!context.mounted) return;

      // Cerrar indicador de carga si está abierto
      Navigator.of(context).pop();

      // Mostrar error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  e.toString().replaceAll('Exception: ', ''),
                  style: const TextStyle(fontSize: 15),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  Widget _buildHeaderSection(TransferEntity transfer) {
    return Card(
      color: const Color(0xFF2A3544),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    transfer.transferCode,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                _buildStatusBadge(transfer.status),
              ],
            ),
            const SizedBox(height: 12),
            _buildInfoRow(
              Icons.calendar_today,
              'Creada',
              _formatDateTime(transfer.createdAt),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteSection(TransferEntity transfer) {
    return Card(
      color: const Color(0xFF2A3544),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'RUTA',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.green.shade700,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.location_on,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    Container(
                      width: 2,
                      height: 40,
                      color: Colors.white24,
                    ),
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.red.shade700,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.location_on,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),
                      Text(
                        transfer.originWarehouse?.name ?? 'Almacén Origen',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (transfer.originWarehouse?.address != null)
                        Text(
                          transfer.originWarehouse!.address!,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                      const SizedBox(height: 52),
                      Text(
                        transfer.destinationWarehouse?.name ??
                            'Almacén Destino',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (transfer.destinationWarehouse?.address != null)
                        Text(
                          transfer.destinationWarehouse!.address!,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVehicleDriverSection(TransferEntity transfer) {
    return Card(
      color: const Color(0xFF2A3544),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'VEHÍCULO Y CONDUCTOR',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 16),
            if (transfer.vehicle != null) ...[
              _buildInfoRow(
                Icons.local_shipping,
                'Vehículo',
                '${transfer.vehicle!.licensePlate} - ${transfer.vehicle!.type}',
              ),
              const SizedBox(height: 12),
            ],
            if (transfer.driver != null) ...[
              _buildInfoRow(
                Icons.person,
                'Conductor',
                transfer.driver!.name,
              ),
              if (transfer.driver!.email.isNotEmpty) ...[
                const SizedBox(height: 8),
                _buildInfoRow(
                  Icons.email,
                  'Email',
                  transfer.driver!.email,
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQRSection(TransferEntity transfer) {
    return Card(
      color: const Color(0xFF2A3544),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'CÓDIGO QR',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow(Icons.qr_code, 'Código QR', transfer.qrCode!),
            if (transfer.qrVerifiedAtOrigin != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.check_circle,
                'Verificado en origen',
                _formatDateTime(transfer.qrVerifiedAtOrigin!),
                iconColor: Colors.green,
              ),
            ],
            if (transfer.qrVerifiedAtDestination != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.check_circle,
                'Verificado en destino',
                _formatDateTime(transfer.qrVerifiedAtDestination!),
                iconColor: Colors.green,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTimesSection(TransferEntity transfer) {
    return Card(
      color: const Color(0xFF2A3544),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'TIEMPOS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 16),
            if (transfer.estimatedDepartureTime != null)
              _buildInfoRow(
                Icons.schedule,
                'Salida estimada',
                _formatDateTime(transfer.estimatedDepartureTime!),
              ),
            if (transfer.estimatedArrivalTime != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.schedule,
                'Llegada estimada',
                _formatDateTime(transfer.estimatedArrivalTime!),
              ),
            ],
            if (transfer.actualDepartureTime != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.check_circle,
                'Salida real',
                _formatDateTime(transfer.actualDepartureTime!),
                iconColor: Colors.green,
              ),
            ],
            if (transfer.actualArrivalTime != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.check_circle,
                'Llegada real',
                _formatDateTime(transfer.actualArrivalTime!),
                iconColor: Colors.green,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductsSection(TransferEntity transfer) {
    return Card(
      color: const Color(0xFF2A3544),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'PRODUCTOS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 16),
            ...transfer.details!.map((detail) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1A2332),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.inventory_2,
                          color: Colors.blue,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              detail.productName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'SKU: ${detail.productSku}',
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Cantidad: ${detail.quantityExpected} ${detail.unit}',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                              ),
                            ),
                            if (detail.quantityReceived != null)
                              Text(
                                'Recibido: ${detail.quantityReceived} ${detail.unit}',
                                style: TextStyle(
                                  color: detail.hasDiscrepancy
                                      ? Colors.orange
                                      : Colors.green,
                                  fontSize: 13,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildNotesSection(TransferEntity transfer) {
    return Card(
      color: const Color(0xFF2A3544),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'NOTAS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              transfer.notes!,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    IconData icon,
    String label,
    String value, {
    Color? iconColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          color: iconColor ?? Colors.blue,
          size: 20,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    String label;

    switch (status.toUpperCase()) {
      case 'PENDIENTE':
        bgColor = Colors.orange.shade700;
        label = 'PENDIENTE';
        break;
      case 'ASIGNADA':
        bgColor = Colors.amber.shade700;
        label = 'ASIGNADA';
        break;
      case 'EN_PREPARACION':
        bgColor = Colors.yellow.shade700;
        label = 'EN PREPARACIÓN';
        break;
      case 'LISTA_DESPACHO':
        bgColor = Colors.lime.shade700;
        label = 'LISTA DESPACHO';
        break;
      case 'EN_TRANSITO':
        bgColor = Colors.blue.shade700;
        label = 'EN TRÁNSITO';
        break;
      case 'LLEGADA_DESTINO':
        bgColor = Colors.indigo.shade700;
        label = 'LLEGADA DESTINO';
        break;
      case 'COMPLETADA':
        bgColor = Colors.green.shade700;
        label = 'COMPLETADA';
        break;
      case 'COMPLETADA_CON_DISCREPANCIA':
        bgColor = Colors.teal.shade700;
        label = 'COMPLETADA CON DISCREPANCIA';
        break;
      case 'CANCELADA':
        bgColor = Colors.red.shade700;
        label = 'CANCELADA';
        break;
      default:
        bgColor = Colors.grey.shade700;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 80, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'Error al cargar transferencia',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                ref.read(transferDetailProvider(transferId).notifier).refresh();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade600,
              ),
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
