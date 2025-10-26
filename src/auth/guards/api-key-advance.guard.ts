import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createHash } from 'crypto';


@Injectable()
export class ClientApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  private hashKey(key: string) {
    return createHash('sha256').update(key).digest('hex');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const apiKeyHash = this.hashKey(apiKey);

    const client = await this.prisma.client.findUnique({
      where: { apiKeyHash },
    });
    console.log('Client found:', client);

    if (!client || !client.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Gắn client lên request để controller/service dùng
    req.client = { id: client.id, name: client.name, isActive: client.isActive };

    return true;
  }
}
