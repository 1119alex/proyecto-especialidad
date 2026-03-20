import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'dart:convert';

/// Servicio para escanear y generar códigos QR
class QrService {
  /// Generar widget de código QR
  Widget generateQrWidget({
    required String data,
    double size = 200,
    Color? backgroundColor,
    Color? foregroundColor,
  }) {
    return QrImageView(
      data: data,
      version: QrVersions.auto,
      size: size,
      backgroundColor: backgroundColor ?? Colors.white,
      eyeStyle: QrEyeStyle(
        eyeShape: QrEyeShape.square,
        color: foregroundColor ?? Colors.black,
      ),
      dataModuleStyle: QrDataModuleStyle(
        dataModuleShape: QrDataModuleShape.square,
        color: foregroundColor ?? Colors.black,
      ),
    );
  }

  /// Generar código QR para una transferencia
  Widget generateTransferQr({
    required int transferId,
    required String status,
    double size = 200,
  }) {
    final data = jsonEncode({
      'type': 'transfer',
      'id': transferId,
      'status': status,
      'timestamp': DateTime.now().toIso8601String(),
    });

    return generateQrWidget(data: data, size: size);
  }

  /// Generar código QR para un producto
  Widget generateProductQr({
    required int productId,
    required String sku,
    double size = 200,
  }) {
    final data = jsonEncode({
      'type': 'product',
      'id': productId,
      'sku': sku,
      'timestamp': DateTime.now().toIso8601String(),
    });

    return generateQrWidget(data: data, size: size);
  }

  /// Parsear datos del QR escaneado
  QrData? parseQrData(String rawData) {
    try {
      final json = jsonDecode(rawData) as Map<String, dynamic>;
      final type = json['type'] as String?;

      if (type == null) return null;

      switch (type) {
        case 'transfer':
          return TransferQrData(
            id: json['id'] as int,
            status: json['status'] as String?,
            timestamp: json['timestamp'] != null
                ? DateTime.parse(json['timestamp'] as String)
                : null,
          );

        case 'product':
          return ProductQrData(
            id: json['id'] as int,
            sku: json['sku'] as String,
            timestamp: json['timestamp'] != null
                ? DateTime.parse(json['timestamp'] as String)
                : null,
          );

        default:
          return null;
      }
    } catch (e) {
      // Si no es un JSON válido, intentar parsearlo como texto plano
      return TextQrData(text: rawData);
    }
  }

  /// Validar formato del QR
  bool isValidQrFormat(String data) {
    try {
      final json = jsonDecode(data) as Map<String, dynamic>;
      return json.containsKey('type') && json.containsKey('id');
    } catch (e) {
      return false;
    }
  }
}

/// Datos base de un QR
abstract class QrData {
  const QrData();
}

/// Datos de QR de transferencia
class TransferQrData extends QrData {
  final int id;
  final String? status;
  final DateTime? timestamp;

  const TransferQrData({
    required this.id,
    this.status,
    this.timestamp,
  });
}

/// Datos de QR de producto
class ProductQrData extends QrData {
  final int id;
  final String sku;
  final DateTime? timestamp;

  const ProductQrData({
    required this.id,
    required this.sku,
    this.timestamp,
  });
}

/// Datos de QR de texto plano
class TextQrData extends QrData {
  final String text;

  const TextQrData({required this.text});
}

/// Widget helper para escanear QR
class QrScannerWidget extends StatefulWidget {
  final Function(String) onDetect;
  final String? overlayText;

  const QrScannerWidget({
    super.key,
    required this.onDetect,
    this.overlayText,
  });

  @override
  State<QrScannerWidget> createState() => _QrScannerWidgetState();
}

class _QrScannerWidgetState extends State<QrScannerWidget> {
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
  );

  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        MobileScanner(
          controller: controller,
          onDetect: (capture) {
            if (_isProcessing) return;

            final List<Barcode> barcodes = capture.barcodes;
            if (barcodes.isEmpty) return;

            final String? code = barcodes.first.rawValue;
            if (code == null) return;

            setState(() => _isProcessing = true);
            widget.onDetect(code);

            // Resetear después de 2 segundos para permitir otro escaneo
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) {
                setState(() => _isProcessing = false);
              }
            });
          },
        ),
        if (widget.overlayText != null)
          Positioned(
            top: 50,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.black54,
              child: Text(
                widget.overlayText!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        // Overlay de marco de escaneo
        Center(
          child: Container(
            width: 250,
            height: 250,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white, width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}
