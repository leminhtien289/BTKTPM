# Buổi 5 — Event-Driven Architecture
## Workflow: Đặt đơn thực phẩm

---

## 1. Event Choreography Flow

Không có trung tâm điều phối — mỗi service lắng nghe event và tự quyết định hành động tiếp theo.

```
Customer                                                       Services
   │
   │──POST /orders──▶  Order Service
                            │
                     Save order (PENDING)
                            │
                     publish ──▶ [order.placed]
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                   ▼
            Inventory Svc       Payment Svc          Analytics Svc
            (consume)           (consume)            (consume)
                    │                  │
          Reserve stock          Charge payment
                    │                  │
          publish ──▶ [stock.reserved] │
                                  publish ──▶ [payment.processed]
                                                    │
                                        ┌───────────┴──────────────┐
                                        ▼ (success)                ▼ (failed)
                                  Delivery Svc             Order Svc (consume)
                                  (consume)                     │
                                        │               Update status (CANCELLED)
                               Assign driver                     │
                                        │             publish [order.cancelled]
                               publish ──▶ [driver.assigned]           │
                                        │                   Notification Svc
                              Order Svc (consume)           Send failure SMS
                                        │
                              Update status (CONFIRMED)
                                        │
                              Notification Svc (consume)
                              Send confirmation SMS

Timeline: order.placed → stock.reserved + payment.processed → driver.assigned → order.confirmed
```

---

## 2. Event Orchestration Flow

Một **Orchestrator** trung tâm điều phối toàn bộ saga.

```
Customer
   │
   │──POST /orders──▶  API Gateway ──▶  Order Orchestrator
                                               │
                                         ┌─────▼──────┐
                                         │   SAGA      │
                                         │ ORCHESTRATOR│
                                         └─────┬──────┘
                                               │
                                    ┌──────────▼──────────┐
                              STEP 1: Check Inventory
                                    │
                           ──call──▶ Inventory Service
                                    │
                              ◀──OK (reserved)──
                                    │
                                    ▼
                              STEP 2: Process Payment
                                    │
                           ──call──▶ Payment Service
                                    │
                              ◀──OK (charged)──
                                    │
                                    ▼
                              STEP 3: Assign Delivery
                                    │
                           ──call──▶ Delivery Service
                                    │
                              ◀──OK (driver assigned)──
                                    │
                                    ▼
                              STEP 4: Send Notification
                                    │
                           ──call──▶ Notification Service
                                    │
                                    ▼
                              Update Order (CONFIRMED)
                                    │
                      ◀──201 {orderId, status: confirmed}──

COMPENSATION (nếu Payment FAIL tại STEP 2):
Orchestrator ──rollback──▶ Inventory Service (release stock)
Orchestrator ──▶ Notification Service (send failure SMS)
Orchestrator ──▶ Update Order (CANCELLED)
```

---

## 3. So sánh Choreography vs Orchestration

| Tiêu chí | Choreography | Orchestration |
|---|---|---|
| **Coupling** | Loose — services không biết nhau | Tight — services biết orchestrator |
| **Complexity** | Cao — khó trace flow | Thấp — flow rõ ràng ở 1 nơi |
| **Scalability** | Cao — thêm service chỉ cần subscribe event | Trung bình — orchestrator là bottleneck |
| **Failure handling** | Phức tạp — cần saga pattern phân tán | Đơn giản — orchestrator quản lý compensation |
| **Debugging** | Khó — phải trace cross-service events | Dễ — log tập trung ở orchestrator |
| **Single point of failure** | Không có | Orchestrator là SPOF nếu không HA |
| **Testing** | Khó — cần test integration cross-service | Dễ — test orchestrator logic độc lập |
| **Phù hợp với** | Simple workflows, many independent consumers | Complex workflows với compensation logic |

---

## 4. Quyết định: Orchestration cho Food Ordering

**Chọn Orchestration vì:**

1. **Compensation logic phức tạp:** Nếu payment thất bại sau khi đã reserve stock → phải rollback. Orchestration quản lý saga rõ ràng hơn.

2. **Business visibility:** Product owner muốn xem trạng thái order theo từng bước → Orchestrator log đủ thông tin.

3. **Scaling requirement:** Food ordering không cần scale extreme (không phải IoT/streaming) → bottleneck orchestrator không thành vấn đề.

4. **Team size:** Team nhỏ → choreography khó debug và onboard developer mới.

**Khi nào dùng Choreography:** Notification và Analytics (fire-and-forget, không cần compensation) vẫn dùng Choreography — chỉ subscribe event từ orchestrator.

**Kiến trúc hybrid:**
- Critical path (order → payment → delivery): **Orchestration**
- Non-critical (analytics, logging, marketing): **Choreography**
