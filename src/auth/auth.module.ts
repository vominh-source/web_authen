import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { EitherAuthGuard } from './guards/either-auth.guard';

@Module({
  imports:[JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, PrismaService, EitherAuthGuard],
  exports: [EitherAuthGuard],
})
export class AuthModule {}
