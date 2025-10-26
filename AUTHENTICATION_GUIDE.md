# Authentication System Guide

## 🚀 Cách chạy project

### Prerequisites

- Node.js (v18+)
- Neon database (đã setup sẵn)
- Git

### Setup & Run

```bash
# 1. Clone và install dependencies
git clone <repo-url>
cd authen
npm install

# 2. Database đã có sẵn trong .env
# DATABASE_URL đã được cấu hình cho Neon

# 3. Generate Prisma client và sync schema
npx prisma generate
npx prisma db push

# 4. Start app
npm run start
# App chạy tại: http://localhost:3000
# Swagger UI: http://localhost:3000/api
```

---

## 🔐 3 Loại Authentication

### 1. **Internal Key Guard** - Client nội bộ

**Use case**: Chỉ có vài client nội bộ (dưới 10), cần định danh các client này

**Implementation**: `ApiKeyGuard`

- Key được lưu trong `.env` file: `INTERNAL_API_KEY=my-super-secret-key-123`
- So sánh trực tiếp với config
- Không cần database lookup

### 2. **Client API Key Guard** - Client đăng ký

**Use case**: Có nhiều client, có thể đăng ký sử dụng dịch vụ bất kỳ lúc nào

**Implementation**: `ClientApiKeyGuard`

- Key được lưu trong database (`Client` table)
- Có thể enable/disable client (`isActive` field)
- Scale được cho nhiều client

### 3. **JWT Guard** - User authentication

**Use case**: Authentication cho end users, session management

**Implementation**: `JwtGuard` + `JwtRefreshGuard`

- Access token (15 phút) + Refresh token (7 ngày)
- User data trong database
- Secure session management

### 4. **Either Auth Guard** - Flexible (Combo)

**Use case**: Endpoint chấp nhận bất kỳ loại auth nào ở trên

**Implementation**: `EitherAuthGuard`

- Thử internal key → client key → JWT
- Nếu 1 trong 3 hợp lệ thì allow
- Attach `req.authType` và `req.user/req.client`

---

## 🧪 Test trên Swagger UI

### Setup

1. Mở http://localhost:3000/api
2. Click **Authorize** (góc phải)
3. Nhập auth cho scheme muốn test:

### Test Cases

- **Internal API Key**: Nhập `my-super-secret-key-123` vào ô "API Key"
- **Client API Key**: Nhập `service-a-key-123` (hoặc `service-a-key-456`, `service-a-key-789`) vào ô "API Key"
- **JWT Bearer**:
  1. Gọi POST `/auth/signup` trước
  2. Copy `access_token` từ response
  3. Nhập vào ô "Bearer Token"

### Test Film Endpoints

Sau khi authorize, thử:

- `GET /film` - Lấy danh sách films
- `POST /film` - Tạo film mới
- `GET /film/{id}` - Lấy film theo ID
