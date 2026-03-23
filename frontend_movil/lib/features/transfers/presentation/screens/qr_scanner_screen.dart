import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:go_router/go_router.dart';
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

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  Future<void> _onQRScanned(String qrCode) async {
    if (!isScanning || isVerifying) return;

    setState(() {
      isScanning = false;
      isVerifying = true;
    });

    try {
      // Verificar el QR con el backend
      await ref
          .read(qRVerifierProvider.notifier)
          .verifyQR(
            transferId: widget.transferId,
            qrCode: qrCode,
            location: widget.location,
          );

      // Obtener el resultado
      final verificationState = ref.read(qRVerifierProvider);

      if (!mounted) return;

      verificationState.when(
        data: (result) {
          if (result != null && result.success) {
            // Invalidar el provider de transfers para refrescar la lista
            ref.invalidate(transfersProvider);

            // Mostrar mensaje de éxito
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        result.message,
                        style: const TextStyle(fontSize: 15),
                      ),
                    ),
                  ],
                ),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 3),
              ),
            );

            // Regresar a la pantalla anterior después de un delay
            Future.delayed(const Duration(milliseconds: 1500), () {
              if (mounted) {
                context.pop();
              }
            });
          } else {
            // Error en la verificación
            _showError(result?.message ?? 'Error desconocido');
          }
        },
        loading: () {},
        error: (error, _) {
          _showError(error.toString());
        },
      );
    } catch (e) {
      if (mounted) {
        _showError(e.toString());
      }
    }
  }

  void _showError(String message) {
    if (!mounted) return;

    setState(() {
      isScanning = true;
      isVerifying = false;
    });

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
