# Buổi 9 — Contract Evolution & Versioning
## API: User Profile

---

## 1. API Evolution: v1 → v2 → v3

### v1 — Basic Profile

```http
GET /v1/users/{id}
POST /v1/users
PUT /v1/users/{id}
```

```json
// v1 Response: GET /v1/users/123
{
  "id": 123,
  "name": "Nguyen Van A",
  "username": "nguyenvana",
  "created_at": "2024-01-15T10:00:00Z"
}

// v1 Request: POST /v1/users
{
  "name": "Nguyen Van A",
  "username": "nguyenvana",
  "password": "hashed_password"
}
```

---

### v2 — Add Email (Breaking if required, Non-breaking if optional)

```http
GET /v2/users/{id}
POST /v2/users
PUT /v2/users/{id}
PATCH /v2/users/{id}          ← NEW: partial update
GET /v2/users/{id}/settings   ← NEW: separate settings endpoint
```

```json
// v2 Response: GET /v2/users/123
{
  "id": 123,
  "name": "Nguyen Van A",
  "username": "nguyenvana",
  "email": "nguyenvana@example.com",  // ← NEW (nullable for existing users)
  "email_verified": false,             // ← NEW
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2025-03-10T08:30:00Z"  // ← NEW
}

// v2 Request: POST /v2/users
{
  "name": "Nguyen Van A",
  "username": "nguyenvana",
  "password": "hashed_password",
  "email": "nguyenvana@example.com"   // ← NEW (optional for migration period)
}
```

---

### v3 — Add Address + Optional Fields

```http
GET /v3/users/{id}
POST /v3/users
PUT /v3/users/{id}
PATCH /v3/users/{id}
GET /v3/users/{id}/addresses        ← NEW: address collection
POST /v3/users/{id}/addresses       ← NEW
PUT /v3/users/{id}/addresses/{aid}  ← NEW
DELETE /v3/users/{id}/addresses/{aid} ← NEW
GET /v3/users?fields=id,name,email  ← NEW: sparse fieldsets
```

```json
// v3 Response: GET /v3/users/123
{
  "id": 123,
  "name": "Nguyen Van A",
  "username": "nguyenvana",
  "email": "nguyenvana@example.com",
  "email_verified": true,
  "phone": "+84901234567",            // ← NEW (optional)
  "avatar_url": "https://cdn.../123.jpg",  // ← NEW (optional)
  "bio": "Software Engineer",         // ← NEW (optional)
  "addresses": [                      // ← NEW (optional, default empty)
    {
      "id": 1,
      "type": "home",
      "street": "123 Le Loi",
      "city": "Ho Chi Minh City",
      "country": "VN",
      "is_default": true
    }
  ],
  "preferences": {                    // ← NEW (optional, default {})
    "language": "vi",
    "timezone": "Asia/Ho_Chi_Minh",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  },
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2025-05-16T10:00:00Z"
}
```

---

## 2. Backward Compatibility Matrix

| Field / Feature | v1 client | v2 client | v3 client | Notes |
|---|---|---|---|---|
| `id` | ✅ | ✅ | ✅ | Never removed |
| `name` | ✅ | ✅ | ✅ | Never removed |
| `username` | ✅ | ✅ | ✅ | Never removed |
| `created_at` | ✅ | ✅ | ✅ | Never removed |
| `email` | ❌ not present | ✅ | ✅ | Added in v2, nullable |
| `email_verified` | ❌ | ✅ | ✅ | Added in v2 |
| `updated_at` | ❌ | ✅ | ✅ | Added in v2 |
| `phone` | ❌ | ❌ | ✅ optional | Added in v3 |
| `avatar_url` | ❌ | ❌ | ✅ optional | Added in v3 |
| `addresses` | ❌ | ❌ | ✅ optional | Added in v3 |
| `preferences` | ❌ | ❌ | ✅ optional | Added in v3 |
| PATCH method | ❌ | ✅ | ✅ | Added in v2 |
| Sparse fieldsets | ❌ | ❌ | ✅ | Added in v3 |

**Rules enforced:**
- v1 và v2 endpoints vẫn hoạt động sau khi v3 ra mắt (sunset policy: 12 tháng)
- Thêm field mới là non-breaking (additive change)
- Xóa field hoặc đổi kiểu dữ liệu là breaking change → increment major version
- Required field mới là breaking change → phải optional hoặc có default

---

## 3. Migration Plan

### Phase 1: Parallel Run (Tháng 1–3)

```
v1 API ──────────────────────────────────────────────────────► [deprecated]
v2 API ──────────────────────────────────────────────────────► [current]
v3 API ──── Release ──────────────────────────────────────────► [new]

Actions:
- Deploy v3 cùng với v1, v2 (chạy song song)
- Thêm header: Deprecation: true cho v1 responses
- Thêm header: Sunset: 2027-05-16 cho v1 responses
- Notify tất cả API consumers qua email + changelog
```

### Phase 2: Migration Period (Tháng 3–9)

```
v1 API ──── Warn all requests ────────────────────────────────► [sunset]
v2 API ──────────────────────────────────────────────────────► [current]
v3 API ──────────────────────────────────────────────────────► [preferred]

Actions:
- Monitor v1 usage: nếu < 5% request → accelerate sunset
- Cung cấp migration guide + code samples cho developers
- API Gateway ghi log tất cả v1 callers để contact trực tiếp
- Internal services migrate trước (lead by example)
```

### Phase 3: Sunset v1 (Tháng 9–12)

```
v1 API ──── Return 410 Gone ─────────────────────────────────► [removed]
v2 API ──────────────────────────────────────────────────────► [current]
v3 API ──────────────────────────────────────────────────────► [preferred]

Actions:
- v1 endpoint trả về 410 Gone với body:
  {"error": "API v1 deprecated", "migrate_to": "/v3/users", "docs": "..."}
- Remove v1 code từ codebase
- Remove v1 từ API gateway routing
```

### Database Migration Strategy (v1 → v3 schema)

```sql
-- Non-breaking: chỉ ADD COLUMN, không DROP hay RENAME
ALTER TABLE users ADD COLUMN email VARCHAR(255);           -- v2
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN phone VARCHAR(20);            -- v3
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;

-- Separate table for addresses (non-breaking addition)
CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(20),
    street TEXT,
    city VARCHAR(100),
    country CHAR(2),
    is_default BOOLEAN DEFAULT FALSE
);

-- Separate table for preferences
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    language CHAR(2) DEFAULT 'vi',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    notif_email BOOLEAN DEFAULT TRUE,
    notif_sms BOOLEAN DEFAULT FALSE,
    notif_push BOOLEAN DEFAULT TRUE
);

-- Migrate existing v1 data: backfill updated_at
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
```
