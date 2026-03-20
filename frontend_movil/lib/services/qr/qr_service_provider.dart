import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'qr_service.dart';

part 'qr_service_provider.g.dart';

/// Provider del QR Service
@Riverpod(keepAlive: true)
QrService qrService(QrServiceRef ref) {
  return QrService();
}
