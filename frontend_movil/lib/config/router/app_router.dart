import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/providers/auth_provider.dart';
import '../../core/constants/app_constants.dart';

/// Rutas de la aplicación
class AppRoutes {
  // Auth
  static const String login = '/login';

  // Home/Dashboard
  static const String home = '/';

  // Transfers
  static const String transfers = '/transfers';
  static const String transferDetail = '/transfers/:id';
  static const String createTransfer = '/transfers/create';
  static const String scanQr = '/scan-qr';

  // Tracking
  static const String tracking = '/tracking/:transferId';

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
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: AppRoutes.home,
    redirect: (context, state) {
      final isAuthenticated = authState.value?.isAuthenticated ?? false;
      final isLoginRoute = state.matchedLocation == AppRoutes.login;

      // Si no está autenticado y no está en login, redirigir a login
      if (!isAuthenticated && !isLoginRoute) {
        return AppRoutes.login;
      }

      // Si está autenticado y está en login, redirigir a home
      if (isAuthenticated && isLoginRoute) {
        return AppRoutes.home;
      }

      return null;
    },
    routes: [
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

      // QR Scanner
      GoRoute(
        path: AppRoutes.scanQr,
        builder: (context, state) => const QrScannerScreen(),
      ),

      // Tracking
      GoRoute(
        path: AppRoutes.tracking,
        builder: (context, state) {
          final transferId = int.parse(state.pathParameters['transferId']!);
          return TrackingScreen(transferId: transferId);
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

// Placeholders para las pantallas (se crearán después)
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Login Screen')));
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Home Screen')));
}

class TransfersListScreen extends StatelessWidget {
  const TransfersListScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Transfers List')));
}

class TransferDetailScreen extends StatelessWidget {
  final int transferId;
  const TransferDetailScreen({super.key, required this.transferId});
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Transfer Detail: $transferId')));
}

class CreateTransferScreen extends StatelessWidget {
  const CreateTransferScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Create Transfer')));
}

class QrScannerScreen extends StatelessWidget {
  const QrScannerScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('QR Scanner')));
}

class TrackingScreen extends StatelessWidget {
  final int transferId;
  const TrackingScreen({super.key, required this.transferId});
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Tracking: $transferId')));
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
