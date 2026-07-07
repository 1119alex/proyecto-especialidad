import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:logger/logger.dart';
import 'config/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/notifications/presentation/providers/notifications_provider.dart';
import 'services/api/api_client_provider.dart';
import 'services/notifications/fcm_service_provider.dart';
import 'shared/providers/auth_provider.dart';
import 'shared/providers/session_provider.dart';

/// Disponible solo si el proyecto tiene la configuración nativa de Firebase
/// (android/app/google-services.json descargado de Firebase Console).
bool firebaseAvailable = false;

/// Para mostrar notificaciones en primer plano desde fuera de un Scaffold
final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializar Firebase: si falta la configuración nativa, la app sigue
  // funcionando sin notificaciones push
  try {
    await Firebase.initializeApp();
    firebaseAvailable = true;
  } catch (e) {
    Logger().w(
      'Firebase no disponible (agregar google-services.json para push): $e',
    );
  }

  runApp(const ProviderScope(child: MainApp()));
}

class MainApp extends ConsumerStatefulWidget {
  const MainApp({super.key});

  @override
  ConsumerState<MainApp> createState() => _MainAppState();
}

class _MainAppState extends ConsumerState<MainApp> {
  bool _fcmConfigured = false;

  /// Inicializa FCM y registra el token del dispositivo en el backend.
  /// Se ejecuta cuando el usuario inicia sesión.
  Future<void> _setupPushNotifications() async {
    if (!firebaseAvailable || _fcmConfigured) return;
    _fcmConfigured = true;

    try {
      final fcmService = ref.read(fcmServiceProvider);
      final token = await fcmService.initialize();

      if (token != null) {
        // Asociar el token del dispositivo al usuario autenticado
        await ref.read(apiClientProvider).post(
          '/notifications/fcm-token',
          data: {'token': token},
        );
      }

      fcmService.setupNotificationHandlers(
        onMessageReceived: (message) {
          // Refrescar la lista/badge de alertas en vivo con la nueva notificación
          ref.invalidate(notificationsProvider);

          // App en primer plano: mostrar como snackbar
          final notification = message.notification;
          if (notification == null) return;

          scaffoldMessengerKey.currentState?.showSnackBar(
            SnackBar(
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title ?? 'Notificación',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  if (notification.body != null) ...[
                    const SizedBox(height: 4),
                    Text(notification.body!),
                  ],
                ],
              ),
              duration: const Duration(seconds: 4),
            ),
          );
        },
        onNotificationTapped: (message) {
          ref.invalidate(notificationsProvider);
          // Navegar al detalle de la transferencia referida
          final data = ref.read(fcmServiceProvider).parseNotificationData(
                message,
              );
          if (data.transferId != null) {
            ref.read(routerProvider).push('/transfers/${data.transferId}');
          }
        },
      );
    } catch (e) {
      _fcmConfigured = false; // permitir reintento en el siguiente login
      Logger().w('No se pudo configurar FCM: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    // Registrar el token FCM cuando hay sesión activa
    ref.listen(authProvider, (previous, next) {
      if (next.value?.isAuthenticated == true) {
        _setupPushNotifications();
      }
    });

    // Sesión expirada (401 en cualquier petición): cerrar sesión y al login
    ref.listen(sessionExpiredProvider, (previous, next) {
      if (previous == next) return;
      final auth = ref.read(authProvider).valueOrNull;
      if (auth?.isAuthenticated != true) return;
      _fcmConfigured = false;
      ref.read(authProvider.notifier).logout();
      router.go(AppRoutes.login);
      scaffoldMessengerKey.currentState
        ?..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('Tu sesión expiró. Inicia sesión nuevamente.'),
          ),
        );
    });

    return MaterialApp.router(
      title: 'LogiTrack',
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: scaffoldMessengerKey,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
