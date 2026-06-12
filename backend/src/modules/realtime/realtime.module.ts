import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  // JwtModule (exportado por AuthModule) para autenticar el handshake WS
  imports: [AuthModule],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class RealtimeModule {}
