import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class QRVerificationScreen extends ConsumerStatefulWidget {
  final int transferId;
  final String scannedCode;
  final String location; // 'origin' or 'destination'

  const QRVerificationScreen({
    super.key,
    required this.transferId,
    required this.scannedCode,
    required this.location,
  });

  @override
  ConsumerState<QRVerificationScreen> createState() =>
      _QRVerificationScreenState();
}

class _QRVerificationScreenState extends ConsumerState<QRVerificationScreen> {
  bool isVerifying = true;
  bool verificationSuccess = false;
  String? errorMessage;

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

      // Navigate to next step after 2 seconds
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.of(context).pop();
          // TODO: Navigate to appropriate screen based on location
        }
      });
    } catch (e) {
      setState(() {
        isVerifying = false;
        verificationSuccess = false;
        errorMessage = e.toString();
      });
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
          'Verificación QR',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Transfer Info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    const Text(
                      'TRANSFERENCIA',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'TRF-${widget.transferId.toString().padLeft(3, '0')}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.scannedCode,
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 48),

              // QR Code Display
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF3B82F6),
                    width: 3,
                  ),
                ),
                child: Column(
                  children: [
                    // QR Code representation (you can use qr_flutter package for real QR)
                    Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.black12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: isVerifying
                          ? const Center(
                              child: CircularProgressIndicator(
                                color: Color(0xFF3B82F6),
                              ),
                            )
                          : verificationSuccess
                              ? const Icon(
                                  Icons.check_circle,
                                  size: 120,
                                  color: Color(0xFF10B981),
                                )
                              : const Icon(
                                  Icons.error,
                                  size: 120,
                                  color: Color(0xFFEF4444),
                                ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      isVerifying
                          ? 'Verificando...'
                          : verificationSuccess
                              ? 'Verificado con éxito'
                              : 'Código inválido',
                      style: TextStyle(
                        color: isVerifying
                            ? Colors.black54
                            : verificationSuccess
                                ? const Color(0xFF10B981)
                                : const Color(0xFFEF4444),
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Status message
              Text(
                isVerifying
                    ? 'Apunta la cámara al código QR de la carga'
                    : verificationSuccess
                        ? widget.location == 'origin'
                            ? 'Carga verificada en origen'
                            : 'Carga verificada en destino'
                        : errorMessage ?? 'Error al verificar el código',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 48),

              // Action button
              if (!isVerifying && verificationSuccess)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check, color: Colors.white),
                        const SizedBox(width: 8),
                        Text(
                          widget.location == 'origin'
                              ? 'Carga Verificada'
                              : 'Continuar',
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

              if (!isVerifying && !verificationSuccess)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Intentar de nuevo',
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
      ),
    );
  }
}
