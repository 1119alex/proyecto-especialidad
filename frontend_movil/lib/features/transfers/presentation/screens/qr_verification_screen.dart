import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class QRVerificationScreen extends ConsumerStatefulWidget {
  final int transferId;
  final String transferCode;
  final String scannedCode;
  final String location; // 'origin' or 'destination'
  final String originName;
  final String destinationName;
  final int totalProducts;

  const QRVerificationScreen({
    super.key,
    required this.transferId,
    required this.transferCode,
    required this.scannedCode,
    required this.location,
    required this.originName,
    required this.destinationName,
    required this.totalProducts,
  });

  @override
  ConsumerState<QRVerificationScreen> createState() =>
      _QRVerificationScreenState();
}

class _QRVerificationScreenState extends ConsumerState<QRVerificationScreen> {
  bool isVerifying = true;
  bool verificationSuccess = false;
  String? errorMessage;
  bool isConfirming = false;

  @override
  void initState() {
    super.initState();
    _verifyQR();
  }

  Future<void> _verifyQR() async {
    setState(() {
      isVerifying = true;
    });

    try {
      // TODO: Call the backend API to verify QR
      // final result = await ref.read(transfersProvider.notifier)
      //     .verifyQR(widget.transferId, widget.scannedCode, widget.location);

      // Simulate API call
      await Future.delayed(const Duration(seconds: 2));

      // Mock success
      setState(() {
        isVerifying = false;
        verificationSuccess = true;
      });
    } catch (e) {
      setState(() {
        isVerifying = false;
        verificationSuccess = false;
        errorMessage = e.toString();
      });
    }
  }

  Future<void> _confirmLoad() async {
    setState(() {
      isConfirming = true;
    });

    try {
      // TODO: Call the backend API to confirm and update transfer status
      // if (widget.location == 'origin') {
      //   // Transportista confirms load at origin -> Start transit
      //   await ref.read(transfersProvider.notifier)
      //       .startTransit(widget.transferId);
      // } else {
      //   // At destination -> Navigate to reception screen
      // }

      // Simulate API call
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        if (widget.location == 'origin') {
          // Navigate to GPS tracking screen
          Navigator.of(context).pushReplacementNamed(
            '/gps-tracking',
            arguments: {
              'transferId': widget.transferId,
              'transferCode': widget.transferCode,
            },
          );
        } else {
          // Navigate to reception screen
          Navigator.of(context).pushReplacementNamed(
            '/reception',
            arguments: {
              'transferId': widget.transferId,
              'transferCode': widget.transferCode,
              'originName': widget.originName,
              'destinationName': widget.destinationName,
            },
          );
        }
      }
    } catch (e) {
      setState(() {
        isConfirming = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al confirmar: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
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
        title: const Text(
          'Verificación de Carga',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: isVerifying
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    color: Color(0xFF3B82F6),
                  ),
                  SizedBox(height: 24),
                  Text(
                    'Verificando código QR...',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            )
          : !verificationSuccess
              ? _buildErrorState()
              : _buildSuccessState(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: const Color(0xFF334155),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.error_outline,
                size: 100,
                color: Color(0xFFEF4444),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Código QR Inválido',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              errorMessage ?? 'El código QR no corresponde a esta transferencia',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Escanear de Nuevo',
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
    );
  }

  Widget _buildSuccessState() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          // Success Icon
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: const Color(0xFF334155),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFF10B981),
                width: 3,
              ),
            ),
            child: const Icon(
              Icons.check_circle,
              size: 100,
              color: Color(0xFF10B981),
            ),
          ),

          const SizedBox(height: 32),

          // Success Message
          const Text(
            'QR Verificado Exitosamente',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          // Transfer Details Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF334155),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      widget.transferCode,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Divider(color: Color(0xFF475569)),
                const SizedBox(height: 24),
                _buildDetailRow(
                  Icons.warehouse,
                  'Origen',
                  widget.originName,
                ),
                const SizedBox(height: 16),
                _buildDetailRow(
                  Icons.location_on,
                  'Destino',
                  widget.destinationName,
                ),
                const SizedBox(height: 16),
                _buildDetailRow(
                  Icons.inventory_2,
                  'Total de Productos',
                  '${widget.totalProducts} items',
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Info message based on location
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF3B82F6).withOpacity(0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline,
                  color: Color(0xFF3B82F6),
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    widget.location == 'origin'
                        ? 'Presiona "Confirmar Carga" para iniciar el viaje con seguimiento GPS'
                        : 'Presiona "Confirmar Llegada" para verificar los productos recibidos',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Confirm Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isConfirming ? null : _confirmLoad,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                disabledBackgroundColor: const Color(0xFF475569),
              ),
              child: isConfirming
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle, color: Colors.white),
                        const SizedBox(width: 12),
                        Text(
                          widget.location == 'origin'
                              ? 'Confirmar Carga e Iniciar Viaje'
                              : 'Confirmar Llegada',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
            ),
          ),

          const SizedBox(height: 16),

          // Cancel Button
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: isConfirming
                  ? null
                  : () => Navigator.of(context).pop(),
              child: const Text(
                'Cancelar',
                style: TextStyle(
                  color: Colors.white54,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(
          icon,
          color: const Color(0xFF3B82F6),
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
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
