# XLSX B7 — Microservice P2: Fault Tolerance

## Architecture Diagram

```
                            CLIENT
                              │
                    ┌─────────▼──────────┐
                    │    API GATEWAY      │ :8080
                    │  Rate Limiter       │ 100 req/min
                    │  Circuit Breaker    │ opossum
                    │  Time Limiter       │ 5s timeout
                    └──┬──┬──┬──┬──┬──┬──┘
         ┌─────────────┘  │  │  │  │  └───────────────┐
         ▼                │  │  │  │                   ▼
 ┌──────────────┐         │  │  │  │         ┌──────────────────┐
 │   PRODUCT    │ :8081   │  │  │  │         │    SHIPPING      │ :8086
 │   SERVICE    │         │  │  │  │         │    SERVICE       │
 └──────────────┘         │  │  │  │         └──────────────────┘
         ▼                │  │  │  │                   ▲
    [products.db]         ▼  │  │  ▼                   │
                 ┌──────────────┐ ┌──────────────┐     │
                 │   CUSTOMER   │ │  INVENTORY   │     │
                 │   SERVICE    │ │   SERVICE    │     │
                 │   :8082      │ │   :8085      │     │
                 └──────────────┘ └──────────────┘     │
                      ▼                  ▼              │
                 [customers.db]    [inventory.db]       │
                                                        │
                 ┌──────────────────────────────────────┘
                 │         ┌──────────────┐
                 │         │   PAYMENT    │ :8084
                 │         │   SERVICE    │
                 │         └──────────────┘
                 │              ▼
                 │         [payments.db]
                 │
         ┌───────▼──────┐
         │    ORDER     │ :8083  ◄── orchestrates saga
         │    SERVICE   │
         └──────────────┘
              ▼
         [orders.db]
```

## Order Creation Saga

```
POST /api/orders
      │
      ├─ 1. GET customer-service/:id      (validate)
      ├─ 2. GET product-service/:id       (validate + get price)
      ├─ 3. PUT inventory-service/reduce  (reserve stock)
      ├─ 4. INSERT orders (status=pending)
      ├─ 5. POST payment-service          (80% success / 20% fail)
      │      ├─ [success] status=confirmed
      │      │    └─ POST shipping-service (create shipment)
      │      └─ [fail]    status=payment_failed
      │                   └─ PUT inventory-service/restore
      └─ 6. UPDATE order final status
```

## Fault Tolerance Features (B7)

| Feature | Implementation | Config |
|---------|---------------|--------|
| Circuit Breaker | opossum per upstream | Open at 50% errors, reset 15s |
| Time Limiter | axios timeout | 4.5s per call |
| Rate Limiter | express-rate-limit | 100 req/min per IP |
| Retry (manual) | order saga retries payment | — |
| Fallback | CB fallback response | 503 + service name |
| Inventory rollback | restore on payment fail | automatic |

## New Services (B7)

| Service | Port | Responsibility |
|---------|------|---------------|
| payment-service  | 8084 | Process payments (80% success), refunds |
| inventory-service| 8085 | Track stock, reduce/restore on order events |
| shipping-service | 8086 | Track shipment status (pending→in_transit→delivered) |

## Run

```bash
cd Tuan07/Microservice-Ecommerce
docker-compose up --build

# In another terminal:
npm install && npm run check
```
