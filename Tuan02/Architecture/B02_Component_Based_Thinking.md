# Buổi 2 — Component-Based Thinking
## Hệ thống: Course Management

---

## 1. Domain Decomposition (Domain-Driven)

Phân chia theo **nghiệp vụ / bounded context**:

```
Course Management System
│
├── User Domain
│   ├── Student Module
│   │   ├── Registration
│   │   ├── Profile Management
│   │   └── Learning History
│   └── Instructor Module
│       ├── Instructor Profile
│       └── Teaching History
│
├── Course Domain
│   ├── Course Catalog
│   │   ├── Course CRUD
│   │   ├── Curriculum Management
│   │   └── Content Upload
│   └── Enrollment Module
│       ├── Enroll/Drop Course
│       └── Waitlist Management
│
├── Learning Domain
│   ├── Content Delivery
│   │   ├── Video Streaming
│   │   ├── Quiz Engine
│   │   └── Progress Tracking
│   └── Assessment Module
│       ├── Assignment Submission
│       └── Grade Management
│
├── Payment Domain
│   ├── Order Processing
│   ├── Payment Gateway Integration
│   └── Refund Management
│
└── Notification Domain
    ├── Email Notifications
    ├── In-App Notifications
    └── Certificate Generation
```

---

## 2. Technical Partitioning (Layer-Driven)

Phân chia theo **lớp kỹ thuật**:

```
Course Management System
│
├── Presentation Layer
│   ├── Web Frontend (ReactJS)
│   ├── Mobile API (REST/GraphQL)
│   └── Admin Dashboard
│
├── Business Logic Layer
│   ├── User Service
│   ├── Course Service
│   ├── Enrollment Service
│   ├── Assessment Service
│   ├── Payment Service
│   └── Notification Service
│
├── Data Access Layer
│   ├── User Repository
│   ├── Course Repository
│   ├── Enrollment Repository
│   └── Payment Repository
│
├── Infrastructure Layer
│   ├── Database (PostgreSQL)
│   ├── File Storage (S3/MinIO)
│   ├── Cache (Redis)
│   └── Message Queue (RabbitMQ)
│
└── Cross-Cutting Concerns
    ├── Authentication / Authorization
    ├── Logging & Monitoring
    └── Error Handling
```

---

## 3. Tại sao hai cách cho kết quả khác nhau

| Tiêu chí | Domain Decomposition | Technical Partitioning |
|---|---|---|
| **Nguyên tắc phân chia** | Theo nghiệp vụ (what the system does) | Theo kỹ thuật (how the system works) |
| **Team ownership** | 1 team sở hữu toàn bộ 1 domain | 1 team sở hữu 1 layer (frontend, backend, DBA) |
| **Thay đổi feature** | Thay đổi trong 1 module | Thay đổi lan rộng nhiều layer |
| **Coupling** | Loose coupling giữa domains | Tight coupling theo chiều dọc (layer dependency) |
| **Microservices readiness** | Cao (mỗi domain → 1 service) | Thấp (cần tách theo domain khi scale) |
| **Quen thuộc với team** | Cần hiểu domain knowledge | Quen với MVC/N-tier truyền thống |

---

## 4. Quyết định: Chọn Domain Decomposition

**Lý do:**

1. **Scalability path rõ ràng:** Domain decomposition cho phép tách từng domain thành microservice độc lập khi cần (Payment service scale riêng, Video streaming scale riêng).

2. **Team autonomy:** Mỗi team có thể deploy độc lập không cần phối hợp với team khác.

3. **Business alignment:** Code phản ánh trực tiếp nghiệp vụ → onboarding nhanh hơn cho developer mới.

4. **Change locality:** Thêm tính năng "Instructor Dashboard" chỉ cần sửa Instructor Module, không ảnh hưởng Payment hay Notification.

**Ngoại lệ:** Giữ Technical Partitioning cho cross-cutting concerns (Auth, Logging) vì chúng phục vụ tất cả domains.
