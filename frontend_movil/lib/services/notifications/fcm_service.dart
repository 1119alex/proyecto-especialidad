import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';

/// Manejador de mensajes en segundo plano (debe ser top-level)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  final logger = Logger();
  logger.i('Mensaje recibido en segundo plano: ${message.messageId}');
}

/// Servicio de notificaciones push con Firebase Cloud Messaging
class FcmService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final Logger _logger = Logger();

  /// Inicializar FCM y solicitar permisos
  Future<String?> initialize() async {
    try {
      // Solicitar permisos
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        _logger.i('Usuario otorgó permisos de notificación');
      } else if (settings.authorizationStatus ==
          AuthorizationStatus.provisional) {
        _logger.i('Usuario otorgó permisos provisionales');
      } else {
        _logger.w('Usuario denegó permisos de notificación');
        return null;
      }

      // Obtener FCM token
      final token = await _messaging.getToken();
      _logger.i('FCM Token: $token');

      // Configurar manejador de mensajes en segundo plano
      FirebaseMessaging.onBackgroundMessage(
        firebaseMessagingBackgroundHandler,
      );

      return token;
    } catch (e) {
      _logger.e('Error al inicializar FCM: $e');
      return null;
    }
  }

  /// Configurar listeners de notificaciones
  void setupNotificationHandlers({
    required Function(RemoteMessage) onMessageReceived,
    required Function(RemoteMessage) onNotificationTapped,
  }) {
    // Mensaje recibido cuando la app está en primer plano
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _logger.i('Mensaje recibido en primer plano: ${message.messageId}');
      onMessageReceived(message);
    });

    // Usuario toca la notificación (app en segundo plano)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _logger.i('Notificación abierta: ${message.messageId}');
      onNotificationTapped(message);
    });

    // Verificar si la app fue abierta desde una notificación
    _messaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        _logger.i('App abierta desde notificación: ${message.messageId}');
        onNotificationTapped(message);
      }
    });
  }

  /// Suscribirse a un topic
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      _logger.i('Suscrito al topic: $topic');
    } catch (e) {
      _logger.e('Error al suscribirse al topic $topic: $e');
    }
  }

  /// Desuscribirse de un topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      _logger.i('Desuscrito del topic: $topic');
    } catch (e) {
      _logger.e('Error al desuscribirse del topic $topic: $e');
    }
  }

  /// Suscribirse a topics según el rol del usuario
  Future<void> subscribeToRoleTopics(String userRole) async {
    // Topic general para todos
    await subscribeToTopic('all_users');

    // Topics específicos por rol
    switch (userRole) {
      case 'ADMIN':
        await subscribeToTopic('admins');
        await subscribeToTopic('all_transfers');
        break;
      case 'TRANSPORTISTA':
        await subscribeToTopic('transportistas');
        await subscribeToTopic('transfer_updates');
        break;
      case 'ENC_ORIGEN':
        await subscribeToTopic('origen_encargados');
        await subscribeToTopic('transfer_created');
        break;
      case 'ENC_DESTINO':
        await subscribeToTopic('destino_encargados');
        await subscribeToTopic('transfer_arriving');
        break;
    }
  }

  /// Desuscribirse de todos los topics de roles
  Future<void> unsubscribeFromAllRoleTopics() async {
    final topics = [
      'all_users',
      'admins',
      'transportistas',
      'origen_encargados',
      'destino_encargados',
      'all_transfers',
      'transfer_updates',
      'transfer_created',
      'transfer_arriving',
    ];

    for (final topic in topics) {
      await unsubscribeFromTopic(topic);
    }
  }

  /// Mostrar notificación local (cuando la app está en primer plano)
  void showLocalNotification(BuildContext context, RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    ScaffoldMessenger.of(context).showSnackBar(
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
        action: SnackBarAction(
          label: 'Ver',
          onPressed: () {
            // Manejar tap en la notificación
          },
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  /// Obtener tipo de notificación desde los datos
  NotificationType getNotificationType(RemoteMessage message) {
    final type = message.data['type'] as String?;

    switch (type) {
      case 'transfer_created':
        return NotificationType.transferCreated;
      case 'transfer_assigned':
        return NotificationType.transferAssigned;
      case 'transfer_in_transit':
        return NotificationType.transferInTransit;
      case 'transfer_arrived':
        return NotificationType.transferArrived;
      case 'transfer_completed':
        return NotificationType.transferCompleted;
      case 'transfer_cancelled':
        return NotificationType.transferCancelled;
      default:
        return NotificationType.general;
    }
  }

  /// Parsear datos de la notificación
  NotificationData parseNotificationData(RemoteMessage message) {
    return NotificationData(
      type: getNotificationType(message),
      title: message.notification?.title,
      body: message.notification?.body,
      transferId: message.data['transferId'] != null
          ? int.tryParse(message.data['transferId'].toString())
          : null,
      data: message.data,
    );
  }
}

/// Tipos de notificaciones
enum NotificationType {
  general,
  transferCreated,
  transferAssigned,
  transferInTransit,
  transferArrived,
  transferCompleted,
  transferCancelled,
}

/// Datos de notificación parseados
class NotificationData {
  final NotificationType type;
  final String? title;
  final String? body;
  final int? transferId;
  final Map<String, dynamic> data;

  const NotificationData({
    required this.type,
    this.title,
    this.body,
    this.transferId,
    required this.data,
  });
}
