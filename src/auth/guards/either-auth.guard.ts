import { JwtService } from '@nestjs/jwt';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from '../../../prisma/prisma.service';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class EitherAuthGuard implements CanActivate{
   constructor(
        private jwtService: JwtService,
        private config: ConfigService,
        private prisma: PrismaService,
    ) {}
      private async validateInternalKey(apiKey?: string): Promise<boolean> {
    if (!apiKey) return false;
    const internal = this.config.get<string>('INTERNAL_API_KEY');
    return !!(internal && apiKey === internal);
  }

  private async validateClientKey(apiKey?: string): Promise<{ ok: boolean; client?: any }> {
    if (!apiKey) return { ok: false };
    // No hashing - compare raw key directly with DB
    const client = await this.prisma.client.findUnique({ where: { apiKey: apiKey } });
    if (!client) return { ok: false };
    console.log('Client found:', client);
    return { ok: !!client.isActive, client };
  }

  private async validateJwt(token?: string): Promise<any | null> {
    if (!token) return null;
    try {
      const secret = this.config.get<string>('JWT_ACCESS_SECRET')!;
      const payload = await this.jwtService.verifyAsync(token, { secret });
      // Fetch user for attaching to req (optional)
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true }, // chọn field cần thiết
      });
      return user ?? null;
    } catch (err) {
      return null;
    }
  }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        // 1) internal key (exact match to ENV)
        const apiKeyHeader = (req.headers['x-api-key'] as string) || undefined;
        if (apiKeyHeader) {
        // first try internal
        if (await this.validateInternalKey(apiKeyHeader)) {
            req.authType = 'internal';
            return true;
        }
        // else try client key
        const { ok, client } = await this.validateClientKey(apiKeyHeader);
        if (ok) {
            req.authType = 'client';
            req.client = client;
            return true;
        }
        throw new UnauthorizedException('Invalid API key');
        }

        // 2) Bearer JWT
        const authHeader = req.get('Authorization') || '';
        const match = authHeader.match(/Bearer\s+(.+)/i);
        if (match) {
        const token = match[1];
        const user = await this.validateJwt(token);
        if (!user) throw new UnauthorizedException('Invalid or expired JWT');
        req.authType = 'jwt';
        req.user = user;
        return true;
        }

        // 3) none provided
        throw new UnauthorizedException('Missing API key or Bearer token');
  }



}