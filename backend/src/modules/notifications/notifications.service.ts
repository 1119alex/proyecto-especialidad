import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';
import {
  NotificationType,
  NotificationPriority,
} from '../../common/enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { TrackingGateway } from '../realtime/tracking.gateway';

export interface NotifyParams {
  type: NotificationType;
  title: string;
  message: string;
  transferId?: number;
  priority?: NotificationPriority;
}

/**
 * Servicio de notificaciones (RF06).
 *
 * Cada notificación se persiste en la tabla `notifications`, se empuja por
 * WebSocket a la room personal del usuario (`user-{id}`) y, si el usuario
 * tiene un token FCM registrado y Firebase está configurado, se envía como
 * push al dispositivo móvil.
 *
 * Firebase es opcional: sin credenciales en el entorno el servicio sigue
 * funcionando con persistencia + WebSocket, y deja constancia en el log.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private pushEnabled = false;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WarehouseStaffProfile)
    private readonly staffProfileRepository: Repository<WarehouseStaffProfile>,
    private readonly configService: ConfigService,
    private readonly trackingGateway: TrackingGateway,
  ) {
    this.initFirebase();
  }

  private initFirebase(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail = this.configService.get<string>(
      'FIREBASE_CLIENT_EMAIL',
    );

    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn(
        'Credenciales de Firebase no configuradas: las notificaciones push ' +
          'están deshabilitadas (se mantienen persistencia y WebSocket)',
      );
      return;
    }

    try {
      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            // Railway/dotenv almacenan los saltos de línea escapados
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      this.pushEnabled = true;
      this.logger.log('Firebase Cloud Messaging inicializado');
    } catch (error) {
      this.logger.error(`No se pudo inicializar Firebase: ${error}`);
    }
  }

  // ===== REGISTRO DE TOKEN =====

  async registerFcmToken(userId: number, token: string): Promise<void> {
    await this.userRepository.update(userId, { fcmToken: token });
  }

  // ===== CONSULTA =====

  async findForUser(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { sentAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notificación ${id} no encontrada`);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  // ===== ENVÍO =====

  /** Notifica a un usuario: persiste + WebSocket + push FCM si hay token */
  async notifyUser(userId: number, params: NotifyParams): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
      });
      if (!user) return;

      const notification = this.notificationRepository.create({
        userId,
        transferId: params.transferId,
        type: params.type,
        priority: params.priority ?? NotificationPriority.NORMAL,
        title: params.title,
        message: params.message,
        fcmToken: user.fcmToken ?? undefined,
      });

      const saved = await this.notificationRepository.save(notification);

      // Tiempo real hacia la web/app si está conectada
      this.trackingGateway.emitNotification(userId, saved);

      // Push al dispositivo móvil
      if (this.pushEnabled && user.fcmToken) {
        try {
          await getMessaging().send({
            token: user.fcmToken,
            notification: {
              title: params.title,
              body: params.message,
            },
            data: {
              type: params.type,
              transferId: params.transferId?.toString() ?? '',
              notificationId: saved.id.toString(),
            },
          });
          saved.fcmSent = true;
          saved.fcmSentAt = new Date();
          await this.notificationRepository.save(saved);
        } catch (error) {
          this.logger.warn(
            `Push FCM fallido para usuario ${userId}: ${error}`,
          );
        }
      }
    } catch (error) {
      // Las notificaciones nunca deben romper el flujo principal
      this.logger.error(`Error al notificar al usuario ${userId}: ${error}`);
    }
  }

  /** Notifica a todos los administradores activos */
  async notifyAdmins(params: NotifyParams): Promise<void> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN, isActive: true },
    });

    await Promise.all(admins.map((a) => this.notifyUser(a.id, params)));
  }

  /** Notifica al personal asignado a un almacén */
  async notifyWarehouseStaff(
    warehouseId: number,
    params: NotifyParams,
  ): Promise<void> {
    const staff = await this.staffProfileRepository.find({
      where: { warehouseId },
    });

    await Promise.all(staff.map((s) => this.notifyUser(s.userId, params)));
  }
}
