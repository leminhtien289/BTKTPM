# Buổi 4 — Architecture Styles: Microservices & SOA
## Hệ thống: Online Food Delivery

---

## 1. Monolith → Microservices Migration Path

```
PHASE 1: Monolith
┌──────────────────────────────────────────────┐
│            Food Delivery Monolith             │
│  User | Restaurant | Menu | Order | Payment  │
│  Delivery | Notification | Analytics         │
│                                              │
│              Single DB (PostgreSQL)           │
└──────────────────────────────────────────────┘

PHASE 2: Modular Monolith (Strangler Fig bắt đầu)
┌──────────────────────────────────────────────┐
│              API Gateway                      │
└──┬───────────────────────┬───────────────────┘
   │                       │
┌──▼────────────┐    ┌─────▼──────────────────┐
│ Payment       │    │    Core Monolith        │
│ (tách ra trước│    │ User | Restaurant | Menu│
│  vì PCI-DSS)  │    │ Order | Delivery | Notif│
└───────────────┘    └────────────────────────┘

PHASE 3: Full Microservices
┌─────────────────────────────────────────────────────┐
│                    API Gateway                       │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬───────┘
   │      │      │      │      │      │      │
  User  Rest. Menu  Order Pay  Deliv. Notif. Analytics
  Svc   Svc   Svc   Svc   Svc  Svc    Svc    Svc
   │      │      │      │      │      │      │
  DB    DB    DB    DB    DB   DB     DB     DB
 (PG)  (PG) (PG)  (PG) (PG) (PG)  (Redis)(Cassandra)
```

---

## 2. Service Map

```
[Mobile App / Web]
        │
        ▼
  [API Gateway :8080]
   Authentication + Rate Limiting + Load Balancing
        │
   ┌────┴─────────────────────────────────────┐
   │                                          │
   ▼                                          ▼
[User Service :8081]              [Restaurant Service :8082]
 - POST /register                  - GET /restaurants
 - POST /login                     - GET /restaurants/:id/menu
 - GET /profile                    - POST /restaurants (admin)
 DB: users_db                      DB: restaurant_db
   │
   ▼
[Order Service :8083]
 - POST /orders           ──sync──▶ [Menu Service :8084]
 - GET /orders/:id                   - GET /menu/:id
 - PUT /orders/:id/cancel            - PUT /menu/:id/availability
 DB: orders_db             DB: menu_db
   │
   │──async (MQ)──▶ [Payment Service :8085]
   │                 - POST /payments
   │                 DB: payments_db
   │
   │──async (MQ)──▶ [Delivery Service :8086]
   │                 - POST /deliveries
   │                 - PUT /deliveries/:id/status
   │                 DB: delivery_db
   │
   └──async (MQ)──▶ [Notification Service :8087]
                     - Email / SMS / Push
                     No DB (stateless)
```

---

## 3. Context Map (Bounded Contexts)

```
┌──────────────────────┐     ┌──────────────────────┐
│   USER CONTEXT       │     │  RESTAURANT CONTEXT   │
│                      │     │                       │
│  - User Profile      │     │  - Restaurant Info    │
│  - Authentication    │     │  - Menu Management    │
│  - Address Book      │     │  - Operating Hours    │
│                      │     │  - Reviews & Ratings  │
│  Language: Customer, │     │  Language: Restaurant,│
│  Address, Session    │     │  MenuItem, Category   │
└──────────┬───────────┘     └──────────┬────────────┘
           │  Customer ID               │  RestaurantId
           └──────────┐  ┌─────────────┘
                      ▼  ▼
           ┌──────────────────────┐
           │    ORDER CONTEXT     │  ←──── Upstream (ACL*)
           │                      │
           │  - Order Lifecycle   │
           │  - Cart Management   │
           │  - Order Status      │
           │  Language: Order,    │
           │  OrderItem, Cart     │
           └──────────┬───────────┘
                      │  OrderId
           ┌──────────┴───────────────┐
           ▼                          ▼
┌──────────────────┐    ┌─────────────────────────┐
│ PAYMENT CONTEXT  │    │    DELIVERY CONTEXT      │
│                  │    │                          │
│ - Payment Method │    │ - Driver Assignment      │
│ - Transaction    │    │ - Route Optimization     │
│ - Refund         │    │ - Real-time Tracking     │
│ Language:        │    │ Language: Driver, Route, │
│ Payment, Invoice │    │ Shipment, Location       │
└──────────────────┘    └──────────────────────────┘

*ACL = Anti-Corruption Layer — Order Context không dùng trực tiếp
 model của User/Restaurant context, dùng local DTO thay thế.
```

---

## 4. Communication Diagram (Sync vs Async)

```
SYNCHRONOUS (REST) — dùng khi cần kết quả ngay:
─────────────────────────────────────────────
Client ──GET /menu──▶ API Gateway ──▶ Restaurant Service
                                           │
                                    DB Query (< 50ms)
                                           │
Client ◀──200 OK [menu items]─────────────┘

Client ──POST /order──▶ API Gateway ──▶ Order Service
                                            │
                                  ──sync──▶ Menu Service (validate items)
                                            │ (OK)
                                  ──sync──▶ User Service (validate address)
                                            │ (OK)
                                    Save order to DB
                                            │
Client ◀──201 Created {orderId: 123}───────┘


ASYNCHRONOUS (RabbitMQ/Kafka) — dùng khi không cần kết quả ngay:
─────────────────────────────────────────────────────────────────
Order Service ──publish──▶ [order.created] ──▶ Payment Service
                                                      │ (async xử lý)
                                         ──publish──▶ [payment.success]
                                                      │
                               Delivery Service ◀────┘ consume
                                      │
                         ──publish──▶ [delivery.assigned]
                                      │
                     Notification Svc ◀── consume
                              │
                    Send SMS/Email/Push (fire-and-forget)

Event Flow: order.created → payment.success → delivery.assigned → order.completed
                         ↘  payment.failed  → order.cancelled → notification.refund
```

---

## 5. Event Messaging Design

| Event | Producer | Consumers | Exchange Type |
|---|---|---|---|
| `order.created` | Order Service | Payment, Analytics | Direct |
| `payment.success` | Payment Service | Delivery, Notification, Order | Topic |
| `payment.failed` | Payment Service | Order, Notification | Topic |
| `delivery.assigned` | Delivery Service | Notification, Order | Direct |
| `delivery.completed` | Delivery Service | Order, Analytics | Direct |
| `user.registered` | User Service | Notification | Direct |

**Broker:** RabbitMQ với durable queues + dead letter exchange để xử lý failed messages.
