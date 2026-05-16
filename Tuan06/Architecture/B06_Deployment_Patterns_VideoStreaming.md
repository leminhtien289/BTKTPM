# Buổi 6 — Architecture Patterns for Deployment
## Hệ thống: Video Streaming Service

---

## 1. Deployment Model 1: Single Deployable Unit

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                  │
└──────────────────────────┬──────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  App Server  │  │  App Server  │  │  App Server  │
│  (Instance1) │  │  (Instance2) │  │  (Instance3) │
│              │  │              │  │              │
│  - Auth      │  │  - Auth      │  │  - Auth      │
│  - Video API │  │  - Video API │  │  - Video API │
│  - User Mgmt │  │  - User Mgmt │  │  - User Mgmt │
│  - Search    │  │  - Search    │  │  - Search    │
│  - Recommend │  │  - Recommend │  │  - Recommend │
│  - Analytics │  │  - Analytics │  │  - Analytics │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       └─────────────────┼─────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  Redis Cache │  │  S3 / MinIO  │
│  (Primary)   │  │              │  │  (Video CDN) │
└──────────────┘  └──────────────┘  └──────────────┘
      │
┌──────────────┐
│  PostgreSQL  │
│  (Replica)   │
└──────────────┘
```

**Deployment:** `docker run -p 8080:8080 video-streaming-app:latest`

---

## 2. Deployment Model 2: Modular Monolith

```
┌──────────────────────────────────────────────────────┐
│                  API Gateway / BFF                    │
└────┬───────────────────────────────────┬─────────────┘
     │                                   │
     ▼                                   ▼
┌────────────────────────────────────────────────────┐
│             Video Streaming Application             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ User Module  │  │ Video Module │  │ Search   │  │
│  │ (auth, prof) │  │ (upload,CDN) │  │ Module   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Recommend    │  │ Analytics    │  │ Notify   │  │
│  │ Module       │  │ Module       │  │ Module   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
│                                                      │
│          [Module API Contracts — enforced]           │
└────────────────────────────────────────────────────┘
     │              │               │
     ▼              ▼               ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│  User DB │  │ Video DB │  │  Analytics   │
│ (PgSQL)  │  │  (PgSQL) │  │  DB (Kafka+  │
└──────────┘  └──────────┘  │  ClickHouse) │
                             └──────────────┘

Video CDN: [CloudFront / Nginx + HLS streaming]
```

**Deployment:** Từng module có Dockerfile riêng, deploy cùng compose file nhưng có thể scale độc lập.

---

## 3. Deployment Model 3: Microservices

```
                    [CDN — CloudFront]
                           │
                    [API Gateway :443]
                    Auth + Rate Limit
                           │
     ┌─────────┬──────────┬┴──────────┬────────────┐
     ▼         ▼          ▼           ▼            ▼
  [User     [Video    [Search     [Recommend  [Analytics
  Svc:8081] Svc:8082] Svc:8083]  Svc:8084]  Svc:8085]
     │         │          │           │            │
  [User     [Video    [Elastic-   [ML Model   [Kafka +
   DB]      Storage]  search]     Store]     ClickHouse]
            │
     [Video Processing Pipeline]
     Upload ──▶ Transcode ──▶ Thumbnail ──▶ CDN
     (Svc:8086)  (Worker)     (Worker)

Async Events via Kafka:
  video.uploaded ──▶ Transcode Worker
  video.published ──▶ Search Indexer, Notification Svc
  user.watched    ──▶ Analytics, Recommendation Engine

Service Mesh: Istio (mTLS, traffic management, observability)
```

---

## 4. Operational Risk Assessment

| Rủi ro | Single Unit | Modular Monolith | Microservices |
|---|---|---|---|
| **Deployment downtime** | Cao — deploy toàn bộ | Thấp — rolling update | Rất thấp — canary deploy |
| **Single point of failure** | Cao | Trung bình | Thấp (nếu có HA) |
| **Operational complexity** | Thấp | Trung bình | Rất cao |
| **Scaling flexibility** | Thấp — scale all-or-nothing | Trung bình — scale per module | Cao — scale từng service |
| **Debugging & tracing** | Dễ | Trung bình | Khó — cần distributed tracing |
| **Database management** | Dễ — 1 DB | Trung bình — 3-4 DB | Khó — nhiều DB engine khác nhau |
| **Team coordination** | Không cần | Thấp | Cao — service ownership |
| **Cost** | Thấp | Trung bình | Cao (infra + tooling) |
| **Time to first deploy** | Nhanh (1-2 tuần) | Trung bình (4-6 tuần) | Chậm (3-6 tháng) |
| **Video transcode bottleneck** | Ảnh hưởng toàn app | Ảnh hưởng 1 module | Cô lập hoàn toàn |

---

## 5. Khuyến nghị

**Giai đoạn đầu (0–10K users):** Modular Monolith
- Triển khai nhanh, vận hành đơn giản
- Tách biệt data store theo module ngay từ đầu (dễ tách sau)
- Video processing tách riêng thành worker process độc lập

**Giai đoạn tăng trưởng (10K–500K users):** Tách dần microservices
- Tách Video Service trước (heavy workload, cần scale riêng)
- Tách Recommendation Engine (ML pipeline độc lập)
- Giữ User + Auth như module trong monolith

**Scale lớn (> 500K users):** Full Microservices + Service Mesh
- Đầu tư vào Kubernetes, Istio, distributed tracing (Jaeger)
- CDN multi-region cho video streaming
