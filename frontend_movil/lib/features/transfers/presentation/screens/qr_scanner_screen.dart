import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/errors/error_messages.dart';
import '../../../../main.dart' show scaffoldMessengerKey;
import '../providers/qr_provider.dart';
import '../providers/transfers_provider.dart';

class QRScannerScreen extends ConsumerStatefulWidget {
  final int transferId;
  final String location; // 'origin' or 'destination'

  const QRScannerScreen({
    super.key,
    required this.transferId,
    required this.location,
  });

  @override
  ConsumerState<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends ConsumerState<QRScannerScreen> {
  MobileScannerController cameraController = MobileScannerController();
  bool isScanning = true;
  bool isVerifying = false;
  String? lastScannedCode;

  /// Guard SÍNCRONO de re-entrada. mobile_scanner dispara onDetect muchas veces
  /// por segundo; sin este flag (puesto antes de cualquier await) dos detecciones
  /// corren en paralelo y llaman cameraController.stop() dos veces, lo que lanza
  /// "Bad state: Future already completed".
  bool _processing = false;

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  Future<void> _onQRScanned(String qrCode) async {
    if (_processing || lastScannedCode == qrCode) return;
    _processing = true;
    lastScannedCode = qrCode;

    // Detener el escáner inmediatamente (protegido: puede estar ya detenido)
    try {
      await cameraController.stop();
    } catch (_) {}

    if (!mounted) return;
    setState(() {
      isScanning = false;
      isVerifying = true;
    });

    try {
      // Verificar el QR con el backend. Se llama al datasource directamente:
      // el notifier QRVerifier era autoDispose sin oyentes y Riverpod lo
      // desechaba durante el await, lo que lanzaba "Bad state: Future already
      // completed" al volver la respuesta (aunque el backend SÍ verificaba).
      final res = await ref.read(qrDatasourceProvider).verifyQR(
            transferId: widget.transferId,
            qrCode: qrCode,
            location: widget.location,
          );

      if (!mounted) return;

      // El backend responde 200 con success=false cuando el QR no corresponde
      // o el estado no es el esperado. Hay que respetarlo: antes se mostraba
      // "verificado" siempre, ocultando el fallo real.
      if (!res.success) {
        _showError(res.message);
        return;
      }

      // Éxito: refrescar la lista/detalle. El detalle (pantalla anterior) se
      // recarga solo vía refreshAfter y muestra el siguiente paso: en destino
      // el botón pasa a "Confirmar recepción"; en origen queda EN_TRANSITO.
      ref.invalidate(transfersProvider);
      ref.invalidate(transferDetailProvider(widget.transferId));

      // El aviso va por el messenger global para que sobreviva al cierre de la
      // cámara (el ScaffoldMessenger local desaparece al hacer pop).
      final successMessage = widget.location == 'origin'
          ? 'QR verificado. La transferencia está en tránsito.'
          : 'QR verificado. Ahora confirma la recepción de la mercancía.';

      scaffoldMessengerKey.currentState?.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  successMessage,
                  style: const TextStyle(fontSize: 15),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
        ),
      );

      // Cerrar la cámara y volver a la pantalla anterior (el detalle).
      context.pop();
    } catch (e) {
      if (mounted) {
        _showError(friendlyError(e));
      }
    }
  }

  void _showError(String message) async {
    if (!mounted) return;

    setState(() {
      isScanning = true;
      isVerifying = false;
      lastScannedCode = null; // Resetear para permitir otro escaneo
      _processing = false; // Liberar el guard para reintentar
    });

    // Reiniciar el escáner
    try {
      await cameraController.start();
    } catch (e) {
      // Error al reiniciar escáner
    }

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Text(message, style: const TextStyle(fontSize: 15)),
            ),
          ],
        ),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          widget.location == 'origin'
              ? 'Escanear QR - Origen'
              : 'Escanear QR - Destino',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                flex: 3,
                child: Container(
                  margin: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: const Color(0xFF3B82F6),
                      width: 3,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(17),
                    child: MobileScanner(
                      controller: cameraController,
                      onDetect: (capture) {
                        final List<Barcode> barcodes = capture.barcodes;
                        for (final barcode in barcodes) {
                          if (barcode.rawValue != null) {
                            _onQRScanned(barcode.rawValue!);
                            break;
                          }
                        }
                      },
                    ),
                  ),
                ),
              ),
              Expanded(
                flex: 1,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.qr_code_scanner,
                        size: 48,
                        color: Color(0xFF3B82F6),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.location == 'origin'
                            ? 'Apunta la cámara al código QR que te mostró el encargado de almacén'
                            : 'Apunta la cámara al código QR de la transferencia',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Transferencia #${widget.transferId}',
                        style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Loading overlay
          if (isVerifying)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Color(0xFF3B82F6),
                      ),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Verificando código QR...',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
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
}
