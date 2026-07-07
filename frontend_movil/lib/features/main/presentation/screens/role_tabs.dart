import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../auth/presentation/screens/profile_screen.dart';
import '../../../inventory/presentation/screens/inventory_screen.dart';
import '../../../notifications/presentation/screens/alerts_screen.dart';
import '../../../transfers/presentation/screens/transfers_list_screen.dart';
import '../../../transfers/presentation/screens/trip_history_screen.dart';
import '../../../warehouse/presentation/screens/warehouse_dashboard_screen.dart';
import '../../../warehouse/presentation/screens/warehouse_transfers_screen.dart';

bool _isEncargado(WidgetRef ref) =>
    ref.watch(authProvider).value?.userRole ==
    AppConstants.roleEncargadoAlmacen;

/// Pestaña 0 — Inicio (varía por rol).
class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _isEncargado(ref)
        ? const WarehouseDashboardScreen()
        : const TransfersListScreen();
  }
}

/// Pestaña 1 — Viajes (transportista) / Transferencias (encargado).
class SecondaryTab extends ConsumerWidget {
  const SecondaryTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (_isEncargado(ref)) return const WarehouseTransfersScreen();
    return const TripHistoryScreen();
  }
}

/// Pestaña 2 — Alertas (transportista) / Inventario (encargado).
class TertiaryTab extends ConsumerWidget {
  const TertiaryTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _isEncargado(ref) ? const InventoryScreen() : const AlertsScreen();
  }
}

/// Pestaña 3 — Perfil (común).
class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) => const ProfileScreen();
}
