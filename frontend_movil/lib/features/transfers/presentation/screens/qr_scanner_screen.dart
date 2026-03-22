import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'qr_verification_screen.dart';

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

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  void _onQRScanned(String qrCode) {
    if (!isScanning) return;

    setState(() {
      isScanning = false;
    });

    // TODO: Fetch transfer details from API to get full information
    // final transfer = await ref.read(transfersProvider.notifier).getTransferById(widget.transferId);

    // Navigate to verification screen
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => QRVerificationScreen(
          transferId: widget.transferId,
          transferCode: 'TRF-${widget.transferId.toString().padLeft(3, '0')}', // Mock
          scannedCode: qrCode,
          location: widget.location,
          originName: 'Almacén Origen', // TODO: Get from API
          destinationName: 'Almacén Destino', // TODO: Get from API
          totalProducts: 5, // TODO: Get from API
        ),
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
              ? 'Verificar Origen'
              : 'Verificar Destino',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
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
                        ? 'Apunta la cámara al código QR de la carga'
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
    );
  }
}
