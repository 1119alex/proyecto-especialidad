import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';

/// Splash Screen - Pantalla de carga inicial
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    // Mínimo delay para mostrar el logo (solo animación visual)
    await Future.delayed(const Duration(milliseconds: 500));

    if (!mounted) return;

    // IMPORTANTE: Usar ref.read() para forzar la carga del provider
    // y luego esperar con .future para obtener el valor cuando esté listo
    final authState = await ref.read(authProvider.future);

    if (!mounted) return;

    if (authState.isAuthenticated) {
      // Hay sesión activa, redirigir según rol
      final userRole = authState.userRole;

      if (userRole == AppConstants.roleEncargadoAlmacen) {
        context.go(AppRoutes.warehouseHome);
      } else {
        context.go(AppRoutes.transfers);
      }
    } else {
      // No hay sesión, ir al login
      context.go(AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A2332), // Fondo oscuro del mockup
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.blue.shade400,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.local_shipping_rounded,
                size: 64,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            // Nombre de la app
            const Text(
              'LOGITRACK',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 48),
            // Loading indicator
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
            ),
          ],
        ),
      ),
    );
  }
}
