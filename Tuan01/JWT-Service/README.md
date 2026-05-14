# JWT Service — Node.js + RSA

## Cấu trúc

```
jwt-service/
├── keys/                  # RSA key pair (auto-generated, không commit lên git)
│   ├── private.pem
│   └── public.pem
├── middlewares/
│   └── authenticate.js    # Middleware xác thực Bearer token
├── routes/
│   ├── auth.js            # POST /auth/login, /refresh, /logout
│   └── api.js             # GET /api/me, /api/admin (protected)
├── scripts/
│   └── generateKeys.js    # Tạo RSA key pair
├── utils/
│   └── jwt.js             # signAccessToken, signRefreshToken, verifyToken
├── index.js
├── package.json
└── Dockerfile
```

## Chạy local

```bash
npm install
node scripts/generateKeys.js   # Tạo RSA keys (chỉ cần chạy 1 lần)
npm run dev
```

## Chạy Docker

```bash
docker build -t jwt-service .
docker run -p 4000:4000 jwt-service
```

## Test với curl

### 1. Đăng nhập
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "tien", "password": "12345678"}'
```

Response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": "15m"
}
```

### 2. Gọi protected endpoint
```bash
curl http://localhost:4000/api/me \
  -H "Authorization: Bearer <accessToken>"
```

Response:
```json
{
  "message": "Authenticated successfully",
  "user": { "userId": 1, "username": "tien", "role": "admin" },
  "tokenIssuedAt": "2025-05-13T...",
  "tokenExpiresAt": "2025-05-13T..."
}
```

### 3. Gọi không có token → 401
```bash
curl http://localhost:4000/api/me
# → {"error": "Missing or invalid Authorization header"}
```

### 4. Đổi refresh token → access token mới
```bash
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'
```

### 5. Logout (thu hồi refresh token)
```bash
curl -X POST http://localhost:4000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'
```

### 6. Admin-only endpoint
```bash
# Dùng token của user "tien" (role: admin) → OK
curl http://localhost:4000/api/admin \
  -H "Authorization: Bearer <adminToken>"

# Dùng token của user "user" (role: user) → 403 Forbidden
curl http://localhost:4000/api/admin \
  -H "Authorization: Bearer <userToken>"
```

## Giải thích kỹ thuật

| | Access Token | Refresh Token |
|---|---|---|
| **Expire** | 15 phút | 7 ngày |
| **Chứa** | userId, username, role | userId |
| **Dùng để** | Xác thực request | Lấy access token mới |
| **Lưu ở** | Client (memory/header) | Client + Server store |
| **Algorithm** | RS256 (RSA) | RS256 (RSA) |

**Tại sao dùng RSA thay vì HS256?**
- RS256: ký bằng private key, verify bằng public key
- Public key có thể chia sẻ cho các service khác để verify token mà không cần biết private key
- Phù hợp cho kiến trúc microservices (mỗi service tự verify, không cần gọi auth service)
