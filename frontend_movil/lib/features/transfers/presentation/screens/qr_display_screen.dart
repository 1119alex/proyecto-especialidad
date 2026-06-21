import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../core/errors/error_messages.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../providers/qr_provider.dart';
import '../providers/transfers_provider.dart';

class QRDisplayScreen extends ConsumerStatefulWidget {
  final int transferId;
  final String transferCode;
  final String originName;
  final String destinationName;
  final int totalProducts;

  const QRDisplayScreen({
    super.key,
    required this.transferId,
    required this.transferCode,
    required this.originName,
    required this.destinationName,
    required this.totalProducts,
  });

  @override
  ConsumerState<QRDisplayScreen> createState() => _QRDisplayScreenState();
}

class _QRDisplayScreenState extends ConsumerState<QRDisplayScreen> {
  void _close() {
    // Recargar la transferencia con el nuevo estado al salir
    ref.invalidate(transferDetailProvider(widget.transferId));
    ref.invalidate(transfersProvider);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final qrAsync = ref.watch(transferQRProvider(widget.transferId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Código QR'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _close,
        ),
      ),
      body: SafeArea(
        child: qrAsync.when(
          loading: () => const LoadingStateView(label: 'Generando QR...'),
          error: (e, _) => ErrorStateView(
            title: 'Error al obtener el QR',
            message: friendlyError(e),
            onRetry: () =>
                ref.invalidate(transferQRProvider(widget.transferId)),
          ),
          data: (qrData) => _content(context, qrData.qrCode),
        ),
      ),
    );
  }

  Widget _content(BuildContext context, String code) {
    final theme = Theme.of(context);
    final c = theme.appColors;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Tarjeta de información
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: c.surfaceAlt,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Text(
                  widget.transferCode,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 14),
                Divider(color: theme.colorScheme.outline),
                const SizedBox(height: 14),
                _InfoRow(
                  icon: Icons.trip_origin,
                  label: 'Origen',
                  value: widget.originName,
                ),
                const SizedBox(height: 10),
                _InfoRow(
                  icon: Icons.location_on_outlined,
                  label: 'Destino',
                  value: widget.destinationName,
                ),
                const SizedBox(height: 10),
                _InfoRow(
                  icon: Icons.inventory_2_outlined,
                  label: 'Productos',
                  value: '${widget.totalProducts} ítems',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Muestra este código al transportista',
            textAlign: TextAlign.center,
            style: theme.textTheme.titleSmall?.copyWith(color: c.muted),
          ),
          const SizedBox(height: 18),
          // Recuadro del QR — SIEMPRE blanco para que sea escaneable
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: theme.colorScheme.outline),
            ),
            child: Column(
              children: [
                QrImageView(
                  data: code,
                  version: QrVersions.auto,
                  size: 250,
                  backgroundColor: Colors.white,
                  errorCorrectionLevel: QrErrorCorrectLevel.H,
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    code,
                    style: const TextStyle(
                      color: Color(0xFF1E293B),
                      fontSize: 12,
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: theme.colorScheme.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: theme.colorScheme.primary,
                  size: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'El transportista escanea este código para confirmar la '
                    'recogida de la carga.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
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
    return Row(
      children: [
        Icon(icon, color: theme.colorScheme.primary, size: 20),
        const SizedBox(width: 12),
        Text(
          '$label: ',
          style: theme.textTheme.bodyMedium?.copyWith(color: c.muted),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
