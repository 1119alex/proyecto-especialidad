import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../notifications/presentation/providers/notifications_provider.dart';

/// Especificación de un ítem de la barra inferior.
class _NavSpec {
  const _NavSpec(this.icon, this.activeIcon, this.label);
  final IconData icon;
  final IconData activeIcon;
  final String label;
}

/// Shell de navegación persistente.
///
/// La barra inferior se dibuja una sola vez y solo cambia el contenido
/// (`navigationShell`). Cambiar de pestaña ya no reconstruye la pantalla
/// completa ni "salta": cada rama conserva su estado y scroll.
///
/// El botón central (QR) NO es una pestaña: es una acción que abre el escáner.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _transportista = [
    _NavSpec(Icons.home_outlined, Icons.home_rounded, 'Inicio'),
    _NavSpec(
      Icons.local_shipping_outlined,
      Icons.local_shipping_rounded,
      'Viajes',
    ),
    _NavSpec(
      Icons.notifications_outlined,
      Icons.notifications_rounded,
      'Alertas',
    ),
    _NavSpec(Icons.person_outline_rounded, Icons.person_rounded, 'Perfil'),
  ];

  static const _encargado = [
    _NavSpec(Icons.home_outlined, Icons.home_rounded, 'Inicio'),
    _NavSpec(
      Icons.compare_arrows_rounded,
      Icons.compare_arrows_rounded,
      'Transfer.',
    ),
    _NavSpec(
      Icons.inventory_2_outlined,
      Icons.inventory_2_rounded,
      'Inventario',
    ),
    _NavSpec(Icons.person_outline_rounded, Icons.person_rounded, 'Perfil'),
  ];

  void _goBranch(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  /// Botón central: abre el escáner universal (resuelve la acción solo).
  void _onScan(BuildContext context) => context.push(AppRoutes.scan);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).value?.userRole;
    final isEncargado = role == AppConstants.roleEncargadoAlmacen;
    final items = isEncargado ? _encargado : _transportista;

    // Punto en la pestaña Alertas del transportista (índice 2) si hay no leídas.
    final unread = ref.watch(unreadCountProvider);
    final dotIndex = (!isEncargado && unread > 0) ? 2 : -1;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: _ShellBar(
        items: items,
        currentIndex: navigationShell.currentIndex,
        dotIndex: dotIndex,
        onSelect: _goBranch,
        onScan: () => _onScan(context),
      ),
    );
  }
}

class _ShellBar extends StatelessWidget {
  const _ShellBar({
    required this.items,
    required this.currentIndex,
    required this.dotIndex,
    required this.onSelect,
    required this.onScan,
  });

  final List<_NavSpec> items;
  final int currentIndex;
  final int dotIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onScan;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.outline)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              Expanded(child: _item(context, 0)),
              Expanded(child: _item(context, 1)),
              _ScanButton(onTap: onScan),
              Expanded(child: _item(context, 2)),
              Expanded(child: _item(context, 3)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _item(BuildContext context, int index) {
    final theme = Theme.of(context);
    final spec = items[index];
    final active = currentIndex == index;
    final color = active ? theme.colorScheme.primary : theme.appColors.muted;

    return InkWell(
      onTap: () => onSelect(index),
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                active ? spec.activeIcon : spec.icon,
                color: color,
                size: 24,
              ),
              if (index == dotIndex)
                Positioned(
                  right: -3,
                  top: -2,
                  child: Container(
                    width: 9,
                    height: 9,
                    decoration: BoxDecoration(
                      color: theme.appColors.danger,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: theme.colorScheme.surface,
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            spec.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color,
              fontSize: 11.5,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScanButton extends StatelessWidget {
  const _ScanButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Semantics(
        button: true,
        label: 'Escanear QR',
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [scheme.primary, scheme.secondary],
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: scheme.primary.withValues(alpha: 0.35),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Icon(
              Icons.qr_code_scanner_rounded,
              color: Colors.white,
              size: 29,
            ),
          ),
        ),
      ),
    );
  }
}
