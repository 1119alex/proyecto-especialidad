import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../providers/qr_provider.dart';
import '../providers/transfers_provider.dart';
import '../widgets/reception_sheet.dart';
import '../../domain/entities/transfer_entity.dart';

/// Escáner UNIVERSAL: el usuario solo apunta y escanea. La app extrae el id
/// del QR firmado (`TRF-{id}-...`), resuelve la acción según rol + estado +
/// pertenencia, verifica con el backend y muestra el resultado como panel
/// in-place (sin saltar a otra pantalla).
class UniversalScannerScreen extends ConsumerStatefulWidget {
  const UniversalScannerScreen({super.key});

  @override
  ConsumerState<UniversalScannerScreen> createState() =>
      _UniversalScannerScreenState();
}

class _UniversalScannerScreenState
    extends ConsumerState<UniversalScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _busy = false;
  bool _torchOn = false;

  static final _idPattern = RegExp(r'TRF-(\d+)-');

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy) return;
    final raw = capture.barcodes
        .map((b) => b.rawValue)
        .firstWhere((v) => v != null, orElse: () => null);
    if (raw == null) return;
    await _handle(raw);
  }

  Future<void> _handle(String raw) async {
    setState(() => _busy = true);
    await _controller.stop();

    final match = _idPattern.firstMatch(raw);
    if (match == null) {
      return _result(
        _ScanResult.error(
          'Código no reconocido',
          'Este QR no es un código de despacho de LogiTrack.',
        ),
      );
    }
    final id = int.parse(match.group(1)!);

    try {
      final transfer = await ref.read(transferDetailProvider(id).future);
      final auth = ref.read(authProvider).value;
      final resolved = _resolve(transfer, auth?.userRole, auth?.warehouseId);

      if (resolved.location == null) {
        return _result(_ScanResult.error(resolved.title!, resolved.message!));
      }

      final res = await ref
          .read(qRVerifierProvider.notifier)
          .verifyQR(transferId: id, qrCode: raw, location: resolved.location!);

      if (!res.success) {
        return _result(_ScanResult.error('No se pudo verificar', res.message));
      }

      ref.invalidate(transfersProvider);
      ref.invalidate(transferDetailProvider(id));

      _result(
        _ScanResult.success(location: resolved.location!, transfer: transfer),
      );
    } catch (e) {
      _result(
        _ScanResult.error(
          'No se pudo usar este QR',
          e.toString().replaceFirst('Exception: ', ''),
        ),
      );
    }
  }

  _Resolved _resolve(TransferEntity t, String? role, int? warehouseId) {
    if (role == AppConstants.roleTransportista) {
      if (t.status == 'LISTA_DESPACHO') {
        return const _Resolved(location: 'origin');
      }
      return const _Resolved.invalid(
        'Aún no está listo',
        'Este viaje no está listo para recoger.',
      );
    }
    if (role == AppConstants.roleEncargadoAlmacen) {
      if (warehouseId != t.destinationWarehouseId) {
        return const _Resolved.invalid(
          'No es tu almacén',
          'Este QR corresponde a otro almacén de destino.',
        );
      }
      if (t.status == 'LLEGADA_DESTINO') {
        return const _Resolved(location: 'destination');
      }
      return const _Resolved.invalid(
        'Aún no llega',
        'La transferencia todavía no ha llegado a destino.',
      );
    }
    return const _Resolved.invalid(
      'Acción no disponible',
      'Tu rol no puede escanear este código.',
    );
  }

  Future<void> _result(_ScanResult result) async {
    if (!mounted) return;
    final action = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (_) => _ResultSheet(result: result),
    );

    if (!mounted) return;

    switch (action) {
      case 'reception':
        final t = result.transfer!;
        await showReceptionSheet(
          context,
          transferId: t.id,
          transferCode: t.transferCode,
          originName: t.originWarehouse?.name,
          destinationName: t.destinationWarehouse?.name,
        );
        if (mounted) context.pop(); // cerrar el escáner
        break;
      case 'retry':
        setState(() => _busy = false);
        await _controller.start();
        break;
      default:
        if (mounted) context.pop();
    }
  }

  Future<void> _manualEntry() async {
    final controller = TextEditingController();
    final code = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Ingresar código'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'TRF-...'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Verificar'),
          ),
        ],
      ),
    );
    if (code != null && code.isNotEmpty) {
      await _handle(code);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error, _) => _PermissionView(error: error),
          ),
          // Velo + marco de guía
          const _ScannerOverlay(),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(
                          Icons.close_rounded,
                          color: Colors.white,
                        ),
                        onPressed: () => context.pop(),
                        tooltip: 'Cerrar',
                      ),
                      const Text(
                        'Escanear QR',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      IconButton(
                        icon: Icon(
                          _torchOn
                              ? Icons.flash_on_rounded
                              : Icons.flash_off_rounded,
                          color: Colors.white,
                        ),
                        tooltip: 'Linterna',
                        onPressed: () {
                          _controller.toggleTorch();
                          setState(() => _torchOn = !_torchOn);
                        },
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Padding(
                  padding: const EdgeInsets.only(bottom: 28),
                  child: TextButton.icon(
                    onPressed: _manualEntry,
                    icon: const Icon(
                      Icons.keyboard_rounded,
                      color: Colors.white,
                    ),
                    label: const Text(
                      'Ingresar código manual',
                      style: TextStyle(color: Colors.white),
                    ),
                    style: TextButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF334155)),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_busy)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }
}

// ===================== RESOLUCIÓN =====================

class _Resolved {
  const _Resolved({this.location}) : title = null, message = null;
  const _Resolved.invalid(this.title, this.message) : location = null;

  final String? location;
  final String? title;
  final String? message;
}

// ===================== RESULTADO =====================

class _ScanResult {
  const _ScanResult._({
    required this.ok,
    required this.title,
    required this.message,
    this.location,
    this.transfer,
  });

  factory _ScanResult.error(String title, String message) =>
      _ScanResult._(ok: false, title: title, message: message);

  factory _ScanResult.success({
    required String location,
    required TransferEntity transfer,
  }) => _ScanResult._(
    ok: true,
    title: location == 'origin' ? 'Recogida confirmada' : 'Llegada verificada',
    message: location == 'origin'
        ? 'El viaje inició tránsito.'
        : 'Revisa la mercancía y registra la recepción.',
    location: location,
    transfer: transfer,
  );

  final bool ok;
  final String title;
  final String message;
  final String? location;
  final TransferEntity? transfer;
}

class _ResultSheet extends StatelessWidget {
  const _ResultSheet({required this.result});
  final _ScanResult result;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    final isReception = result.ok && result.location == 'destination';

    final Color accent = result.ok ? c.success : c.danger;
    final IconData icon = result.ok
        ? (isReception ? Icons.inventory_2_rounded : Icons.check_rounded)
        : Icons.error_outline_rounded;

    return SafeArea(
      top: false,
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.outline,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            const SizedBox(height: 18),
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: accent, size: 30),
            ),
            const SizedBox(height: 14),
            Text(
              result.title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              result.message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(color: c.muted),
            ),
            if (result.transfer != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: c.surfaceAlt,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  result.transfer!.transferCode,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 22),
            if (isReception)
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => Navigator.pop(context, 'reception'),
                  icon: const Icon(Icons.fact_check_outlined, size: 20),
                  label: const Text('Iniciar recepción'),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                  ),
                ),
              )
            else if (result.ok)
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.pop(context, 'close'),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                  ),
                  child: const Text('Listo'),
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context, 'close'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                      ),
                      child: const Text('Cerrar'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.pop(context, 'retry'),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                      ),
                      child: const Text('Reintentar'),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

// ===================== OVERLAY / PERMISO =====================

class _ScannerOverlay extends StatelessWidget {
  const _ScannerOverlay();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 230,
        height: 230,
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFF3B82F6), width: 3),
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }
}

class _PermissionView extends StatelessWidget {
  const _PermissionView({required this.error});
  final MobileScannerException error;

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.no_photography_outlined,
              color: Colors.white70,
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              'Sin acceso a la cámara',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Permite el acceso a la cámara en los ajustes del teléfono '
              'para escanear códigos QR.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white60, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
