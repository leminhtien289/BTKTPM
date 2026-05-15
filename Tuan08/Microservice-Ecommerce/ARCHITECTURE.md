# XLSX B8 — Microservice P3: Auth + ELK Logging

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
┌──────────────────────────────────────────────────────┐
│                   API GATEWAY :8080                  │
│  Rate Limiter (100/min)   Circuit Breaker (opossum)  │
│  JWT Middleware           Request Logger → Logstash  │
│  Auth DB (SQLite)                                    │
└──────┬──────┬──────┬──────┬──────┬──────────────────┘
       │      │      │      │      │
  :8081  :8082  :8083  :8084  :8085  :8086
product customer order payment inventory shipping
   │       │       │      │       │        │
   └───────┴───────┴──────┴───────┴────────┘
                         │
                         ▼ (log events)
                  ┌──────────────┐
                  │   LOGSTASH   │ :5000
                  │  (HTTP input)│
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ELASTICSEARCH │ :9200
                  │  index:      │
                  │microservice- │
                  │logs-YYYY.MM.dd│
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    KIBANA    │ :5601
                  │  Dashboard   │
                  └──────────────┘
```

## New in B8

| Feature | Where | Detail |
|---------|-------|--------|
| JWT Register | `POST /auth/register` | bcrypt hash, SQLite users table |
| JWT Login | `POST /auth/login` | returns Bearer token, 1h expiry |
| JWT Middleware | api-gateway `/api/*` | verifies every upstream request |
| Request Logger | api-gateway middleware | logs method/path/status/duration |
| ELK Logging | all 6 services | fire-and-forget HTTP → Logstash |
| Elasticsearch | port 9200 | index `microservice-logs-YYYY.MM.dd` |
| Kibana | port 5601 | view logs at http://localhost:5601 |

## Auth Flow

```
1. POST /auth/register  {name, email, password}
   → 201 {user: {id, name, email, role}}

2. POST /auth/login  {email, password}
   → 200 {token: "eyJ...", expiresIn: "1h", user: {...}}

3. GET /api/products
   Authorization: Bearer eyJ...
   → 200 [...]       (valid token)
   → 401 Unauthorized (missing/invalid token)
```

## Kibana Setup (after docker-compose up)

1. Open http://localhost:5601
2. Stack Management → Index Patterns → Create
3. Pattern: `microservice-logs-*` → Timestamp field: `@timestamp`
4. Discover → select index → view logs

## Run

```bash
cd Tuan08/Microservice-Ecommerce
docker-compose up --build

# Wait ~60s for Elasticsearch + Kibana to start, then:
npm install && npm run check
```
