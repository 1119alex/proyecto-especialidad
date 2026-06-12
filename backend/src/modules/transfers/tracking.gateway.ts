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

/**
 * Gateway de seguimiento en tiempo real.
 *
 * Los clientes se autentican con su JWT en el handshake y se suscriben a la
 * room de una transferencia (`transfer-{id}`). Cada vez que el backend guarda
 * puntos GPS, los emite a la room, eliminando el polling del mapa web.
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

      client.data.user = this.jwtService.verify(token);
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
}
