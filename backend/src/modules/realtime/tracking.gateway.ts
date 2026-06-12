import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { TrackingLog } from '../../entities/tracking-log.entity';
import { Notification } from '../../entities/notification.entity';

/**
 * Gateway de tiempo real del sistema.
 *
 * Los clientes se autentican con su JWT en el handshake. Cada conexión se
 * une automáticamente a su room personal (`user-{id}`, para notificaciones)
 * y puede suscribirse a rooms de transferencias (`transfer-{id}`) para
 * recibir el seguimiento GPS en vivo sin polling.
 */
@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: true },
})
export class TrackingGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new Error('Token no proporcionado');
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;

      // Room personal para notificaciones dirigidas al usuario
      if (payload.sub) {
        client.join(`user-${payload.sub}`);
      }
    } catch {
      this.logger.warn(`Conexión WS rechazada (token inválido): ${client.id}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join-transfer')
  handleJoinTransfer(
    @ConnectedSocket() client: Socket,
    @MessageBody() transferId: number,
  ): void {
    if (!transferId || Number.isNaN(Number(transferId))) return;
    client.join(`transfer-${Number(transferId)}`);
  }

  @SubscribeMessage('leave-transfer')
  handleLeaveTransfer(
    @ConnectedSocket() client: Socket,
    @MessageBody() transferId: number,
  ): void {
    if (!transferId || Number.isNaN(Number(transferId))) return;
    client.leave(`transfer-${Number(transferId)}`);
  }

  /** Emite puntos GPS recién guardados a los suscriptores de la transferencia */
  emitTrackingPoints(transferId: number, points: TrackingLog[]): void {
    if (!this.server || points.length === 0) return;

    this.server.to(`transfer-${transferId}`).emit('tracking:points', {
      transferId,
      points: points.map((p) => ({
        id: p.id,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        speed: p.speed != null ? Number(p.speed) : null,
        accuracy: p.accuracy != null ? Number(p.accuracy) : null,
        recordedAt: p.recordedAt,
      })),
    });
  }

  /** Emite un cambio de estado de la transferencia (ej. llegada por geocerca) */
  emitTransferEvent(
    transferId: number,
    event: { type: string; status: string },
  ): void {
    if (!this.server) return;

    this.server.to(`transfer-${transferId}`).emit('transfer:status', {
      transferId,
      ...event,
    });
  }

  /** Empuja una notificación a la room personal del usuario */
  emitNotification(userId: number, notification: Notification): void {
    if (!this.server) return;

    this.server.to(`user-${userId}`).emit('notification:new', {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      transferId: notification.transferId,
      sentAt: notification.sentAt,
    });
  }
}
