import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { User } from 'src/users/entities/user.entity';

interface JwtPayload {
  id: number;
  role: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    if (!payload?.id || !payload?.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const token = req.headers?.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const userRepo = this.dataSource.getRepository(User);


    const user = await userRepo.findOne({ where: { id: payload.id } });

    if (!user || !user.isActive) {
      throw new ForbiddenException('User is inactive or does not exist');
    }

    return {
      id: payload.id,
      role: payload.role,
    };
  }
}
