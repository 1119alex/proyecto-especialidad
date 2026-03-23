import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/providers/auth_provider.dart';
import '../../core/constants/app_constants.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/home_screen.dart';
import '../../features/transfers/presentation/screens/transfers_list_screen.dart';
import '../../features/transfers/presentation/screens/transfer_detail_screen.dart';
import '../../features/transfers/presentation/screens/qr_scanner_screen.dart';
import '../../features/transfers/presentation/screens/qr_display_screen.dart';
import '../../features/transfers/presentation/screens/qr_verification_screen.dart';
import '../../features/transfers/presentation/screens/gps_tracking_screen.dart';
import '../../features/transfers/presentation/screens/reception_screen.dart';
import '../../features/warehouse/presentation/screens/warehouse_home_screen.dart';

/// Rutas de la aplicación
class AppRoutes {
  // Auth
  static const String splash = '/splash';
  static const String login = '/login';

  // Home/Dashboard
  static const String home = '/';
  static const String warehouseHome = '/warehouse-home';

  // Transfers
  static const String transfers = '/transfers';
  static const String transferDetail = '/transfers/:id';
  static const String createTransfer = '/transfers/create';

  // QR
  static const String qrDisplay = '/qr-display';
  static const String qrScanner = '/qr-scanner';
  static const String qrVerification = '/qr-verification';

  // GPS & Reception
  static const String gpsTracking = '/gps-tracking';
  static const String reception = '/reception';

  // Profile
  static const String profile = '/profile';

  // Admin
  static const String adminPanel = '/admin';
  static const String manageUsers = '/admin/users';
  static const String manageWarehouses = '/admin/warehouses';
  static const String manageVehicles = '/admin/vehicles';
  static const String manageProducts = '/admin/products';

  // Settings
  static const String settings = '/settings';
}

/// Provider del router
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.splash,
    redirect: (context, state) {
      // Usar ref.read para evitar rebuilds innecesarios del router
      final authState = ref.read(authProvider);
      final isAuthenticated = authState.value?.isAuthenticated ?? false;
      final userRole = authState.value?.userRole;
      final isSplashRoute = state.matchedLocation == AppRoutes.splash;
      final isLoginRoute = state.matchedLocation == AppRoutes.login;

      // Permitir splash siempre
      if (isSplashRoute) {
        return null;
      }

      // Si no está autenticado y no está en login, redirigir a login
      if (!isAuthenticated && !isLoginRoute) {
        return AppRoutes.login;
      }

      // Si está autenticado y está en login, redirigir según rol
      if (isAuthenticated && isLoginRoute) {
        if (userRole == AppConstants.roleEncargadoAlmacen) {
          return AppRoutes.warehouseHome;
        } else {
          return AppRoutes.transfers;
        }
      }

      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),

      // Login
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),

      // Home
      GoRoute(
        path: AppRoutes.home,
        builder: (context, state) => const HomeScreen(),
      ),

      // Warehouse Home (Encargado de Almacén)
      GoRoute(
        path: AppRoutes.warehouseHome,
        builder: (context, state) => const WarehouseHomeScreen(),
      ),

      // Transfers
      GoRoute(
        path: AppRoutes.transfers,
        builder: (context, state) => const TransfersListScreen(),
      ),
      GoRoute(
        path: AppRoutes.transferDetail,
        builder: (context, state) {
          final id = int.parse(state.pathParameters['id']!);
          return TransferDetailScreen(transferId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.createTransfer,
        builder: (context, state) => const CreateTransferScreen(),
      ),

      // QR Display
      GoRoute(
        path: AppRoutes.qrDisplay,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return QRDisplayScreen(
            transferId: extra['transferId'] as int,
            transferCode: extra['transferCode'] as String,
            originName: extra['originName'] as String,
            destinationName: extra['destinationName'] as String,
            totalProducts: extra['totalProducts'] as int,
          );
        },
      ),

      // QR Scanner
      GoRoute(
        path: AppRoutes.qrScanner,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return QRScannerScreen(
            transferId: extra['transferId'] as int,
            location: extra['location'] as String,
          );
        },
      ),

      // GPS Tracking
      GoRoute(
        path: AppRoutes.gpsTracking,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return GPSTrackingScreen(
            transferId: extra['transferId'] as int,
            transferCode: extra['transferCode'] as String,
            status: extra['status'] as String,
          );
        },
      ),

      // Reception
      GoRoute(
        path: AppRoutes.reception,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return ReceptionScreen(
            transferId: extra['transferId'] as int,
            transferCode: extra['transferCode'] as String,
            originName: extra['originName'] as String,
            destinationName: extra['destinationName'] as String,
          );
        },
      ),

      // Profile
      GoRoute(
        path: AppRoutes.profile,
        builder: (context, state) => const ProfileScreen(),
      ),

      // Admin Routes (protegidas por rol)
      GoRoute(
        path: AppRoutes.adminPanel,
        redirect: (context, state) {
          final userRole = ref.read(authProvider).value?.userRole;
          if (userRole != AppConstants.roleAdmin) {
            return AppRoutes.home;
          }
          return null;
        },
        builder: (context, state) => const AdminPanelScreen(),
      ),
      GoRoute(
        path: AppRoutes.manageUsers,
        redirect: (context, state) {
          final userRole = ref.read(authProvider).value?.userRole;
          if (userRole != AppConstants.roleAdmin) {
            return AppRoutes.home;
          }
          return null;
        },
        builder: (context, state) => const ManageUsersScreen(),
      ),
      GoRoute(
        path: AppRoutes.manageWarehouses,
        redirect: (context, state) {
          final userRole = ref.read(authProvider).value?.userRole;
          if (userRole != AppConstants.roleAdmin) {
            return AppRoutes.home;
          }
          return null;
        },
        builder: (context, state) => const ManageWarehousesScreen(),
      ),
      GoRoute(
        path: AppRoutes.manageVehicles,
        redirect: (context, state) {
          final userRole = ref.read(authProvider).value?.userRole;
          if (userRole != AppConstants.roleAdmin) {
            return AppRoutes.home;
          }
          return null;
        },
        builder: (context, state) => const ManageVehiclesScreen(),
      ),
      GoRoute(
        path: AppRoutes.manageProducts,
        redirect: (context, state) {
          final userRole = ref.read(authProvider).value?.userRole;
          if (userRole != AppConstants.roleAdmin) {
            return AppRoutes.home;
          }
          return null;
        },
        builder: (context, state) => const ManageProductsScreen(),
      ),

      // Settings
      GoRoute(
        path: AppRoutes.settings,
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Página no encontrada',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(state.error?.toString() ?? 'Error desconocido'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.home),
              child: const Text('Ir al inicio'),
            ),
          ],
        ),
      ),
    ),
  );
});

// Placeholders para las pantallas pendientes de implementar

class CreateTransferScreen extends StatelessWidget {
  const CreateTransferScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Create Transfer')));
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Profile')));
}

class AdminPanelScreen extends StatelessWidget {
  const AdminPanelScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Admin Panel')));
}

class ManageUsersScreen extends StatelessWidget {
  const ManageUsersScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Manage Users')));
}

class ManageWarehousesScreen extends StatelessWidget {
  const ManageWarehousesScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Manage Warehouses')));
}

class ManageVehiclesScreen extends StatelessWidget {
  const ManageVehiclesScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Manage Vehicles')));
}

class ManageProductsScreen extends StatelessWidget {
  const ManageProductsScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Manage Products')));
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Settings')));
}
