import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../services/api/api_client_provider.dart';
import '../../data/notification_model.dart';

/// Estado de las notificaciones del usuario (lista + acciones).
final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<NotificationItem>>(
      NotificationsNotifier.new,
    );

/// Cantidad de no leídas (para el indicador en la barra).
final unreadCountProvider = Provider<int>((ref) {
  final list = ref.watch(notificationsProvider).valueOrNull ?? const [];
  return list.where((n) => !n.isRead).length;
});

class NotificationsNotifier extends AsyncNotifier<List<NotificationItem>> {
  @override
  Future<List<NotificationItem>> build() => _fetch();

  Future<List<NotificationItem>> _fetch() async {
    final res = await ref.read(apiClientProvider).get('/notifications');
    final data = (res.data as List).cast<Map<String, dynamic>>();
    return data.map(NotificationItem.fromJson).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> markAsRead(int id) async {
    final current = state.valueOrNull ?? const [];
    if (current.any((n) => n.id == id && n.isRead)) return;

    // Actualización optimista
    state = AsyncData([
      for (final n in current) n.id == id ? n.copyWith(isRead: true) : n,
    ]);

    try {
      await ref.read(apiClientProvider).patch('/notifications/$id/read');
    } catch (_) {
      // Si falla, recargamos para reflejar el estado real
      await refresh();
    }
  }
}
