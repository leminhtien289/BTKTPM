# Buổi 7 — Architecture Decisions (ADRs)
## Hệ thống: Banking Mini

---

## ADR-001: Database Strategy

**Status:** Accepted  
**Date:** 2026-05-16  
**Deciders:** Architecture Team

**Context:**
Banking system cần lưu trữ account, transaction, và audit log. ACID compliance là bắt buộc. Transaction volume dự kiến 50,000 tx/ngày giai đoạn đầu.

**Decision:**
Dùng **PostgreSQL** làm primary database. Partition transaction table theo tháng. Dùng **read replica** cho reporting queries.

**Alternatives considered:**
- MySQL: Tương tự nhưng PostgreSQL có advisory locks tốt hơn cho concurrent transactions
- MongoDB: NoSQL không phù hợp — financial data cần strong consistency và join operations
- NewSQL (CockroachDB): Overkill cho scale hiện tại, thêm operational complexity

**Consequences:**
- ✅ ACID full compliance — đảm bảo tính toàn vẹn tài chính
- ✅ Mature ecosystem, dễ tìm DBA
- ✅ Row-level locking phù hợp concurrent balance updates
- ❌ Vertical scaling giới hạn — cần sharding khi > 100M transactions
- ❌ Schema migration cần downtime planning cẩn thận

---

## ADR-002: API Style

**Status:** Accepted  
**Date:** 2026-05-16

**Context:**
Banking API phục vụ: mobile app, web frontend, third-party fintech partners, internal microservices. Mỗi consumer có nhu cầu khác nhau.

**Decision:**
- **Internal services:** gRPC (binary, type-safe, streaming support)
- **External/Partner API:** REST + JSON với versioning (`/v1/`, `/v2/`)
- **Mobile/Web BFF:** REST với GraphQL cho flexible queries

**Alternatives considered:**
- All REST: Đơn giản nhưng không tối ưu cho internal service-to-service calls
- All gRPC: Không phù hợp cho browser clients (cần grpc-web proxy)
- GraphQL everywhere: N+1 query risk, phức tạp hơn cần thiết

**Consequences:**
- ✅ gRPC giảm latency 3-5x so với REST cho internal calls
- ✅ REST giữ backward compatibility tốt cho external partners
- ❌ Phải maintain 2 API styles — training cost cho team
- ❌ gRPC debugging khó hơn (không đọc được raw payload)

---

## ADR-003: Transaction Consistency Strategy

**Status:** Accepted  
**Date:** 2026-05-16

**Context:**
Chuyển tiền giữa 2 tài khoản phải atomic: debit account A và credit account B. Nếu dùng microservices, 2 account có thể ở 2 service/DB khác nhau.

**Decision:**
Dùng **Saga Pattern với Orchestration** cho distributed transactions. Local transaction trong PostgreSQL cho single-service operations. Implement **idempotency key** cho mọi payment API.

**Alternatives considered:**
- 2PC (Two-Phase Commit): Blocking protocol, single point of failure ở coordinator
- Event Sourcing: Tốt cho audit but phức tạp hơn cần thiết giai đoạn này
- Keep all accounts in same DB: Đơn giản nhất nhưng coupling cao

**Compensation steps:**
```
Transfer Saga:
  Step 1: Debit Account A (-100)
    → on fail: rollback (no-op, nothing happened)
  Step 2: Credit Account B (+100)
    → on fail: compensate → Credit Account A (+100) [reverse debit]
  Step 3: Create Transaction Log
    → on fail: compensate steps 1+2
```

**Consequences:**
- ✅ No blocking locks across services
- ✅ Idempotency key ngăn double-charge
- ❌ Eventual consistency — brief period khi debit done nhưng credit chưa xong
- ❌ Cần implement compensation logic cho mọi saga step

---

## ADR-004: Security Strategy

**Status:** Accepted  
**Date:** 2026-05-16

**Context:**
Banking system là target cao cho tấn công. Cần đáp ứng: PCI-DSS compliance, data encryption, audit trail, multi-factor authentication.

**Decision:**
1. **Authentication:** OAuth 2.0 + OIDC (Keycloak) với MFA bắt buộc cho admin
2. **Authorization:** RBAC (Role-Based) + ABAC (Attribute-Based) cho sensitive operations
3. **Data encryption:** TLS 1.3 in-transit, AES-256 at-rest cho PII
4. **API Security:** Rate limiting (100 req/min), IP whitelist cho partner APIs
5. **Audit log:** Immutable audit trail — append-only table, replicated to separate DB

**Alternatives considered:**
- Custom JWT implementation: Reinventing wheel, security risk
- API Key only: Không đủ cho PCI-DSS
- Row-level encryption: Quá chậm cho query-heavy tables

**Consequences:**
- ✅ PCI-DSS Level 1 compliant path
- ✅ Keycloak là battle-tested, hỗ trợ SAML/OIDC/MFA
- ❌ Keycloak adds operational complexity (HA setup, backup)
- ❌ ABAC rule engine có thể slow nếu nhiều attributes cần check

---

## ADR-005: Deployment Strategy

**Status:** Accepted  
**Date:** 2026-05-16

**Context:**
Banking system cần high availability (99.99% SLA). Downtime trực tiếp ảnh hưởng doanh thu và regulatory compliance. Team hiện tại có Kubernetes expertise.

**Decision:**
**Kubernetes trên 2 data centers** (active-active). Blue-green deployment cho zero-downtime release. Database: PostgreSQL với Patroni (auto-failover).

```
DC1 (Primary)          DC2 (Secondary)
┌──────────────┐       ┌──────────────┐
│  K8s Cluster │       │  K8s Cluster │
│  (3 masters) │◄─────►│  (3 masters) │
│  (6 workers) │ sync  │  (6 workers) │
└──────┬───────┘       └──────┬───────┘
       │                       │
┌──────▼───────┐       ┌──────▼───────┐
│  PgSQL       │──WAL──│  PgSQL       │
│  (Primary)   │──rep──│  (Standby)   │
└──────────────┘       └──────────────┘
```

**Alternatives considered:**
- Single datacenter + backup: RTO > 4h không chấp nhận được
- VM-based deployment: Chậm hơn, không có auto-scaling
- Serverless: Cold start không phù hợp banking latency SLA

**Consequences:**
- ✅ RTO < 30 giây (K8s self-healing + PgSQL auto-failover)
- ✅ Zero-downtime deployment với blue-green
- ❌ Chi phí infra x2 (dual DC)
- ❌ Cần team DevOps giỏi K8s và networking

---

## 6. Decision Drift & Mitigation

**Decision Drift** xảy ra khi implementation dần lệch khỏi documented decision mà không có quyết định chính thức.

| Dấu hiệu drift | Ví dụ | Cách phát hiện |
|---|---|---|
| Bypass API contract | Service A gọi trực tiếp DB của Service B | Architecture fitness function: scan for cross-DB queries |
| Inconsistent auth | Một endpoint không dùng Keycloak | Security scan trong CI pipeline |
| Schema leak | Domain model từ Service A dùng trong Service B | Dependency analysis tool (ArchUnit) |
| Sync thay Async | Thêm sync call vào notification (vốn async) | Trace analysis, latency spikes |

**Biện pháp ngăn chặn:**
1. **Architecture fitness functions** chạy trong CI pipeline (fail build nếu vi phạm)
2. **ADR review** bắt buộc khi có thay đổi kiến trúc — không merge PR nếu thiếu ADR update
3. **Architecture decision log** trong repo — ai thay đổi gì, khi nào, lý do gì
4. **Quarterly architecture review** — compare implementation với documented decisions
