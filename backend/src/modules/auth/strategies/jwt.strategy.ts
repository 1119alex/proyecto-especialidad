import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../../entities/user.entity';

export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub: id } = payload;

    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['driverProfile', 'warehouseStaffProfile', 'warehouseStaffProfile.warehouse'],
    });

    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario inactivo');
    }

    return user;
  }
}
