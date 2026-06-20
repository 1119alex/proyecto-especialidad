import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../transfers/presentation/widgets/transfer_detail_sheet.dart';
import '../../data/notification_model.dart';
import '../providers/notifications_provider.dart';

/// Pestaña/pantalla de Alertas: lista de notificaciones del usuario.
class AlertsScreen extends ConsumerWidget {
  const AlertsScreen({super.key, this.showAppBar = true});

  /// En el shell se muestra sin AppBar propio (lo aporta la pestaña);
  /// como ruta pusheada (encargado) sí lleva AppBar con back.
  final bool showAppBar;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);

    final body = RefreshIndicator(
      onRefresh: () => ref.read(notificationsProvider.notifier).refresh(),
      child: async.when(
        data: (items) {
          if (items.isEmpty) {
            return const _ScrollableState(
              child: EmptyStateView(
                title: 'Sin novedades',
                message: 'Tus notificaciones de viajes aparecerán aquí.',
                icon: Icons.notifications_none_rounded,
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _NotificationTile(item: items[i]),
          );
        },
        loading: () => const LoadingStateView(label: 'Cargando alertas...'),
        error: (e, _) => _ScrollableState(
          child: ErrorStateView(
            message: e.toString().replaceFirst('Exception: ', ''),
            onRetry: () => ref.read(notificationsProvider.notifier).refresh(),
          ),
        ),
      ),
    );

    if (!showAppBar) return SafeArea(bottom: false, child: body);
    return Scaffold(
      appBar: AppBar(title: const Text('Alertas')),
      body: SafeArea(bottom: false, child: body),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  const _NotificationTile({required this.item});
  final NotificationItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    final accent = item.isUrgent ? c.danger : theme.colorScheme.primary;

    return Material(
      color: item.isRead ? theme.colorScheme.surface : c.surfaceAlt,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          ref.read(notificationsProvider.notifier).markAsRead(item.id);
          if (item.transferId != null) {
            showTransferDetailSheet(context, item.transferId!);
          }
        },
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: theme.colorScheme.outline),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(item.icon, color: accent, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: item.isRead
                            ? FontWeight.w600
                            : FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.message,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: c.muted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item.relativeTime,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: c.muted,
                      ),
                    ),
                  ],
                ),
              ),
              if (!item.isRead) ...[
                const SizedBox(width: 8),
                Container(
                  width: 9,
                  height: 9,
                  margin: const EdgeInsets.only(top: 6),
                  decoration: BoxDecoration(
                    color: accent,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Envuelve un estado (vacío/error) para que el RefreshIndicator funcione.
class _ScrollableState extends StatelessWidget {
  const _ScrollableState({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: child,
        ),
      ),
    );
  }
}
