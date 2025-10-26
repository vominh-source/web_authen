# JWT + API Key Authentication

Tài liệu này hướng dẫn cách dự án của bạn hỗ trợ cả 2 cơ chế xác thực: JWT (Bearer access token + refresh token) và API Key (x-api-key). Bao gồm:

- Cấu hình Swagger để hiện cả hai scheme (API key + Bearer JWT)
- Một `EitherAuthGuard` mẫu cho phép yêu cầu hợp lệ nếu **API key** hoặc **Bearer JWT** hợp lệ
- Cách gán guard và annotation vào controller
- Các lệnh test (curl) và troubleshooting

---

## Mục tiêu

Cho phép endpoint chấp nhận:

- Một `x-api-key` hợp lệ (từ `.env` hoặc bảng `client` trong DB)
- HOẶC một `Authorization: Bearer <access_token>` hợp lệ

Và hiển thị cả hai tuỳ chọn trong Swagger UI để dễ test.

---

## Cấu hình môi trường (ví dụ `.env`)

```
INTERNAL_API_KEY=my-super-secret-key-123
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
DATABASE_URL=... (prisma)
```

---

## Swagger (đã có trong `src/main.ts`)

Bạn đã thêm:

```ts
.addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header', description: 'Enter your API key' }, 'api-key')
.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter JWT token' }, 'bearer')
```

Trong Swagger UI (`/api`) sẽ có 2 ô Authorize: 1 cho API key và 1 cho Bearer token.

> Lưu ý: Authorize trong Swagger có thể nhập 1 hoặc cả 2. Nhưng server phải xử lý logic chấp nhận `api-key OR bearer`.

---

## EitherAuthGuard (gợi ý) — file: `src/auth/guards/either-auth.guard.ts`

Dán file này vào dự án để cho phép `API key OR JWT`:

```ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EitherAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async validateApiKey(apiKey?: string) {
    if (!apiKey) return false;
    // Option A: check against INTERNAL_API_KEY
    const internalKey = this.config.get<string>('INTERNAL_API_KEY');
    if (internalKey && apiKey === internalKey) return true;

    // Option B: check hashed key in DB (client table)
    try {
      const { createHash } = await import('crypto');
      const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
      const client = await this.prisma.client.findUnique({
        where: { apiKeyHash },
      });
      return !!(client && client.isActive);
    } catch (e) {
      return false;
    }
  }

  private async validateJwt(token?: string) {
    if (!token) return null;
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      return user ?? null;
    } catch (e) {
      return null;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // 1) Try API key first
    const apiKey = (req.headers['x-api-key'] as string) ?? undefined;
    if (apiKey) {
      const ok = await this.validateApiKey(apiKey);
      if (!ok) throw new UnauthorizedException('Invalid API key');
      // optionally set req.client = { ... }
      return true;
    }

    // 2) Try Bearer token
    const authHeader = req.get('Authorization') || '';
    const match = authHeader.match(/Bearer\s+(.+)/i);
    if (match) {
      const token = match[1];
      const user = await this.validateJwt(token);
      if (!user) throw new UnauthorizedException('Invalid or expired JWT');
      req.user = user; // attach user for controllers
      return true;
    }

    // 3) None provided
    throw new UnauthorizedException('Missing API key or Bearer token');
  }
}
```

- Điều chỉnh `PrismaService` path nếu cần.
- Bạn có thể tái sử dụng logic từ `ApiKeyGuard` hoặc `ClientApiKeyGuard` thay vì copy/paste.

---

## Gán guard + swagger annotations trong controller

Ví dụ `src/film/film.controller.ts`:

```ts
@ApiTags('films')
@ApiBearerAuth('bearer')
@ApiSecurity('api-key')
@UseGuards(EitherAuthGuard)
@Controller('film')
export class FilmController { ... }
```

- `@ApiBearerAuth('bearer')` và `@ApiSecurity('api-key')` giúp Swagger hiển thị cả 2 schemes.
- `EitherAuthGuard` sẽ chấp nhận request nếu một trong hai schemes hợp lệ.

---

## Flow test nhanh (cURL)

1. Signup / Signin → lấy access_token & refresh_token

```bash
curl -X POST http://localhost:3000/auth/signup -H 'Content-Type: application/json' -d '{"email":"a@b.com","password":"password","name":"A"}'
# hoặc signin
curl -X POST http://localhost:3000/auth/signin -H 'Content-Type: application/json' -d '{"email":"a@b.com","password":"password"}'
```

2. Gọi endpoint với Bearer token

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:3000/film
```

3. Gọi endpoint với API key header

```bash
curl -H "x-api-key: my-super-secret-key-123" http://localhost:3000/film
```

4. Refresh token (POST /auth/refresh) — gửi refresh token trong header `Authorization: Bearer <REFRESH_TOKEN>` (theo chiến lược của bạn hiện tại)

---

## Troubleshooting

- 401 Unauthorized khi dùng Swagger:
  - Kiểm tra bạn đã nhập đúng token (access token, không phải refresh token) vào ô Bearer.
  - Kiểm tra `JWT_ACCESS_SECRET` trong `.env` giống với secret dùng để sign token.
  - Nếu dùng API key: nhập key đúng vào ô API Key (x-api-key) của Swagger.
- Nếu TypeScript báo lỗi từ `node_modules` (ví dụ thư viện `effect`): đảm bảo `tsconfig.json` không compile node_modules (đã cấu hình `exclude: ["node_modules"]`) và `skipLibCheck: true`.
- Nếu dùng DB-checking cho API key: đảm bảo client table có `apiKeyHash` đúng thuật toán (sha256) và `isActive=true`.

---

## Next steps / Suggestions

- Nếu bạn muốn log loại auth (api-key vs jwt) có thể gán `req.authType = 'api-key'|'jwt'` trong guard.
- Thêm decorator `@CurrentUser()` lấy `req.user` để dùng trong controller.
- Thêm unit tests cho guard (happy path + invalid token + invalid key).

---

Nếu bạn muốn, tôi có thể tạo file `src/auth/guards/either-auth.guard.ts` trong dự án và cập nhật `src/film/film.controller.ts` để dùng guard này (tôi sẽ chạy build/test nhanh để đảm bảo không lỗi).
