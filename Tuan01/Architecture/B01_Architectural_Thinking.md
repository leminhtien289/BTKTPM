# Buổi 1 — Architectural Thinking & Trade-offs
## Hệ thống: E-Commerce Mini

---

## 1. Utility Tree

| Characteristic | Description | Business Value | Technical Risk | Priority |
|---|---|---|---|---|
| Availability | Hệ thống hoạt động 99.9% uptime | Cao | Trung bình | H/H |
| Scalability | Xử lý tăng đột biến người dùng (Flash sale) | Cao | Cao | H/H |
| Performance | Response < 200ms cho API chính | Cao | Trung bình | H/M |
| Security | Xác thực, phân quyền, mã hóa dữ liệu thanh toán | Cao | Cao | H/H |
| Modifiability | Thêm tính năng mà không ảnh hưởng module khác | Trung bình | Trung bình | M/M |
| Testability | Unit test coverage > 80%, CI tự động chạy | Trung bình | Thấp | M/L |
| Deployability | Deploy mà không downtime (rolling update) | Cao | Trung bình | H/M |
| Elasticity | Tự động scale in/out theo traffic | Trung bình | Cao | M/H |
| Maintainability | Team mới đọc code trong < 1 ngày | Trung bình | Thấp | M/L |
| Cost | Chi phí vận hành phù hợp ngân sách startup | Cao | Thấp | H/L |

> **Priority notation:** H = High, M = Medium, L = Low. Format: Business Value / Technical Risk

**Top 3 driving characteristics:** Availability, Scalability, Security

---

## 2. Architectural Decision Records (ADRs)

---

### ADR-001: SQL vs NoSQL cho Product Catalog

**Status:** Accepted

**Context:**
Product catalog cần lưu trữ dữ liệu sản phẩm với attributes biến động (electronics có specs khác clothing). Hệ thống cần query theo nhiều tiêu chí (giá, category, rating).

**Decision:**
Dùng **PostgreSQL** (SQL) cho order/user/payment data + **MongoDB** (NoSQL) cho product catalog.

**Consequences:**
- ✅ PostgreSQL đảm bảo ACID cho transaction tài chính
- ✅ MongoDB cho phép schema linh hoạt cho product attributes
- ❌ Phải quản lý 2 database engine (operational complexity tăng)
- ❌ Join cross-database không native → cần application-level join

---

### ADR-002: Synchronous vs Asynchronous Communication

**Status:** Accepted

**Context:**
Các service cần giao tiếp: Order → Inventory (check stock), Order → Payment, Payment → Notification. Một số cần kết quả ngay, một số không.

**Decision:**
- **Sync (REST/gRPC):** Order → Inventory (check stock), Order → Payment (cần biết thành công/thất bại ngay)
- **Async (Message Queue):** Payment → Notification (email/SMS không cần realtime), Order → Analytics

**Consequences:**
- ✅ Async giảm coupling, tăng resilience
- ✅ Sync đơn giản hơn cho critical path
- ❌ Async tăng complexity (cần message broker, dead letter queue)
- ❌ Distributed transaction khó debug

---

### ADR-003: Monolith vs Microservices

**Status:** Accepted

**Context:**
Team 5 người, giai đoạn đầu sản phẩm. Cần phát triển nhanh nhưng không muốn technical debt lớn.

**Decision:**
**Modular Monolith** giai đoạn đầu, tách microservices khi cần (Payment, Inventory).

**Consequences:**
- ✅ Deploy đơn giản, development speed cao
- ✅ Không cần distributed systems expertise ngay
- ❌ Scale toàn bộ app dù chỉ 1 module cần scale
- ❌ Khi tách microservices sau này cần refactor database

---

### ADR-004: Caching Strategy

**Status:** Accepted

**Context:**
Product listing là endpoint nặng nhất (phần lớn traffic là đọc). Database bị bottleneck khi flash sale.

**Decision:**
**Cache-aside pattern với Redis.** Cache product list (TTL 60s) và individual product (TTL 300s). Invalidate khi có update.

**Consequences:**
- ✅ Giảm DB load 80%+ cho read traffic
- ✅ Redis single-threaded, predictable performance
- ❌ Stale data trong TTL window (chấp nhận được)
- ❌ Cache stampede khi nhiều key expire cùng lúc → cần jitter TTL

---

### ADR-005: Deployment Model

**Status:** Accepted

**Context:**
MVP cần deploy nhanh. Infrastructure budget hạn chế. Team chưa có K8s expertise.

**Decision:**
**Docker Compose** cho development/staging. **Single-server Docker** cho production MVP. Migrate lên K8s khi MAU > 10,000.

**Consequences:**
- ✅ Setup nhanh, chi phí thấp
- ✅ Dễ rollback (docker pull previous image)
- ❌ Single point of failure ở production server
- ❌ Manual scaling → không đáp ứng được spike bất ngờ

---

## 3. Trade-off Summary Table

| Decision | Option A | Option B | Chọn | Lý do chính |
|---|---|---|---|---|
| Database | SQL only | SQL + NoSQL | SQL + NoSQL | Product schema linh hoạt cần NoSQL |
| Communication | All sync | Sync + Async | Mixed | Critical path sync, notification async |
| Architecture | Microservices | Modular Monolith | Modular Monolith | Team nhỏ, speed > scale |
| Caching | No cache | Redis cache-aside | Redis | 80% traffic là read |
| Deployment | K8s từ đầu | Docker Compose | Docker Compose | Overkill cho MVP |
