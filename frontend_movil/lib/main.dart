import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:firebase_core/firebase_core.dart';
import 'config/router/app_router.dart';
import 'core/theme/app_theme.dart';
// import 'services/notifications/fcm_service_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // TODO: Configurar Firebase después
  // Inicializar Firebase
  // await Firebase.initializeApp();

  runApp(const ProviderScope(child: MainApp()));
}

class MainApp extends ConsumerStatefulWidget {
  const MainApp({super.key});

  @override
  ConsumerState<MainApp> createState() => _MainAppState();
}

class _MainAppState extends ConsumerState<MainApp> {
  // TODO: Descomentar cuando se configure Firebase
  // @override
  // void initState() {
  //   super.initState();
  //   _initializeApp();
  // }

  // Future<void> _initializeApp() async {
  //   // Inicializar FCM
  //   final fcmService = ref.read(fcmServiceProvider);
  //   await fcmService.initialize();

  //   // Configurar handlers de notificaciones
  //   fcmService.setupNotificationHandlers(
  //     onMessageReceived: (message) {
  //       // Mostrar notificación local cuando la app está en primer plano
  //       if (mounted) {
  //         fcmService.showLocalNotification(context, message);
  //       }
  //     },
  //     onNotificationTapped: (message) {
  //       // Navegar a la pantalla correspondiente según el tipo de notificación
  //       final data = fcmService.parseNotificationData(message);
  //       if (data.transferId != null) {
  //         ref.read(routerProvider).go('/transfers/${data.transferId}');
  //       }
  //     },
  //   );
  // }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'LogiTrack',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
