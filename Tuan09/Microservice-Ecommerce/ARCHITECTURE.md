# XLSX B9 — Microservice P4: Redis Caching

## Architecture

```
  Client
    │
    ├─ POST /auth/register   ─┐
    ├─ POST /auth/login       ├─ PUBLIC (no JWT)
    └─ GET  /auth/me  ────────┘
    │
    ├─ GET/POST /api/*  ──── requireAuth ──►  JWT validated
    │                                             │
    ▼                                             ▼
┌──────────────────────────────────────────────────────────────┐
│                     API GATEWAY :8080                        │
│  Redis Rate Limiter (100/min, persistent)                    │
│  Circuit Breaker (opossum)   JWT Middleware                  │
│  Request Logger → Logstash   Auth DB (SQLite)                │
│  Redis Client (:6379) for rate-limit store                   │
└──────┬──────┬──────┬──────┬──────┬────────────────────────┘
       │      │      │      │      │
  :8081  :8082  :8083  :8084  :8085  :8086
product customer order payment inventory shipping
   │       │       │      │       │        │
   │       └───────┴──────┴───────┴────────┘
   │                     (log events → Logstash)
   ▼
┌──────────────────────────────┐
│   PRODUCT SERVICE :8081      │
│  Redis Cache-Aside Pattern   │
│  ┌──────────────────────┐   │
│  │     REDIS :6379      │   │
│  │  product:all  TTL30s │   │
│  │  product:{id} TTL60s │   │
│  └──────────┬───────────┘   │
│             │ MISS           │
│             ▼               │
│     SQLite products.db      │
└──────────────────────────────┘
                         │
                         ▼ (log events)
                  ┌──────────────┐
                  │   LOGSTASH   │ :5000
                  └──────┬───────┘
                         ▼
                  ┌──────────────┐
                  │ELASTICSEARCH │ :9200
                  └──────┬───────┘
                         ▼
                  ┌──────────────┐
                  │    KIBANA    │ :5601
                  └──────────────┘
```

## New in B9

| Feature | Where | Detail |
|---------|-------|--------|
| Redis Container | docker-compose | `redis:7-alpine`, port 6379, AOF persistence |
| Cache-Aside | product-service | `GET /products` (TTL 30s), `GET /products/:id` (TTL 60s) |
| Cache Invalidation | product-service | POST/PUT/DELETE clear affected keys |
| X-Cache Header | product-service → gateway | `HIT` or `MISS` forwarded to client |
| Redis Rate Limiter | api-gateway | Replaces in-memory store with Redis-backed (persists across restarts) |
| Redis Health | api-gateway `/health` | Reports Redis ping status |

## Cache Keys

| Key | TTL | Invalidated by |
|-----|-----|----------------|
| `product:all` | 30s | POST /products, PUT /products/:id, DELETE /products/:id |
| `product:{id}` | 60s | PUT /products/:id, DELETE /products/:id |

## Cache Flow

```
GET /api/products/1
  │
  ▼ api-gateway proxies to product-service
  │
  ▼ product-service checks Redis key "product:1"
    ├─ HIT  → X-Cache: HIT  → return cached JSON
    └─ MISS → query SQLite → store in Redis → X-Cache: MISS → return JSON

PUT /api/products/1  (update product)
  │
  ▼ product-service updates SQLite
  └─ DEL product:1, product:all  (invalidate cache)
```

## Run

```bash
cd Tuan09/Microservice-Ecommerce
docker-compose up --build

# Wait ~60s for Elasticsearch + Kibana to start, then:
npm install && npm run check
```

## Kibana Setup

1. Open http://localhost:5601
2. Stack Management → Index Patterns → Create
3. Pattern: `microservice-logs-*` → Timestamp field: `@timestamp`
4. Discover → select index → view logs
