# Buổi 10 — Architectural Kata: Smart Inventory Management Platform
## IoT + API + Analytics

---

## 1. Architectural Characteristics

| Characteristic | Justification | Priority |
|---|---|---|
| **Scalability** | IoT sensors gửi data liên tục, có thể hàng nghìn thiết bị | H/H |
| **Reliability** | Mất dữ liệu inventory = lost sales, tồn kho sai | H/H |
| **Real-time processing** | Alert khi stock thấp cần < 5 giây | H/H |
| **Security** | IoT devices là attack surface, API cần auth | H/M |
| **Modifiability** | Thêm loại sensor/warehouse mới không rebuild core | M/M |
| **Observability** | Cần trace data từ sensor → alert → action | M/M |
| **Cost efficiency** | IoT data volume lớn, storage cost cần optimize | M/L |

---

## 2. Architecture Style: Event-Driven Microservices

**Lý do chọn:**
- **Event-driven** phù hợp với IoT: sensors emit events liên tục → stream processing
- **Microservices** cho phép scale IoT ingestion layer độc lập với Analytics layer
- **CQRS** tách read (reporting) khỏi write (IoT ingestion) → optimize từng path

---

## 3. Full Architecture Diagram

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        IoT EDGE LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [RFID Sensor]  [Weight Sensor]  [Barcode Scanner]  [Camera]
       │               │                 │               │
       └───────────────┴─────────────────┴───────────────┘
                               │
                    [MQTT Broker (Mosquitto)]
                         :1883 (devices)
                               │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     INGESTION LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                               ▼
                 [IoT Gateway Service :8081]
                  MQTT → Validate → Normalize
                               │
                    [Kafka Cluster (3 brokers)]
                    Topics:
                    - inventory.raw-events
                    - inventory.alerts
                    - inventory.audit
                               │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   PROCESSING LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
  [Inventory Processor]  [Alert Engine]   [Analytics Worker]
  consume raw-events      consume events   consume events
  update stock levels     check thresholds  aggregate metrics
  publish state changes   publish alerts    write to warehouse
            │                  │                  │
            ▼                  ▼                  ▼
    [PostgreSQL]         [Redis Pub/Sub]   [ClickHouse]
    (inventory DB)       (realtime alerts) (analytics DB)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        API LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    [API Gateway :443]
                    JWT Auth + Rate Limit
            ┌───────────┬──────────────┬──────────┐
            ▼           ▼              ▼          ▼
    [Inventory     [Alert Svc    [Analytics  [Notification
     Service]       :8082]        Service     Service
     :8083]                       :8084]      :8085]
     CRUD +         GET/ACK        Reports     Email/Slack
     Query          alerts         Dashboard   Webhook

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    PRESENTATION LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    [Web Dashboard]  [Mobile App]  [ERP Integration]
    Real-time chart  Push notif    REST webhook
```

---

## 4. Context & Module Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     INVENTORY CONTEXT                         │
│  - Product catalog (SKU, name, category, unit)               │
│  - Stock levels (quantity, location, reorder point)          │
│  - Warehouse management (zones, bins, locations)             │
│  Language: SKU, StockLevel, Warehouse, BinLocation           │
└──────────────────────────────────────────────────────────────┘
         ↑ (stock update events)    ↓ (current levels)
┌──────────────────────────────────────────────────────────────┐
│                      IoT CONTEXT                              │
│  - Device registry (device ID, type, location, status)       │
│  - Raw event stream (timestamp, device_id, reading, unit)    │
│  - Event normalization (map device events to inventory domain)│
│  Language: Device, SensorReading, EventBatch                 │
└──────────────────────────────────────────────────────────────┘
         ↓ (normalized events)
┌──────────────────────────────────────────────────────────────┐
│                     ALERTING CONTEXT                          │
│  - Alert rules (threshold, condition, severity)              │
│  - Active alerts (triggered, acknowledged, resolved)         │
│  - Alert history                                             │
│  Language: AlertRule, Alert, Threshold, AckAction            │
└──────────────────────────────────────────────────────────────┘
         ↓ (alert events)
┌──────────────────────────────────────────────────────────────┐
│                   ANALYTICS CONTEXT                           │
│  - Stock movement trends (daily/weekly/monthly)              │
│  - Turnover rate, dead stock, fast-moving items              │
│  - Forecasting (reorder predictions)                         │
│  Language: Metric, Trend, Forecast, ReportPeriod             │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. ADR-001: Message Broker Selection

**Status:** Accepted

**Context:**
IoT sensors có thể gửi hàng nghìn events/giây. Cần message broker có throughput cao, durable storage, và replay capability.

**Decision:** Kafka (Apache Kafka hoặc Confluent)

**Alternatives:** RabbitMQ (lower throughput, no native replay), Redis Streams (không đủ durability guarantee cho production IoT)

**Consequences:**
- ✅ Throughput 1M+ events/giây, horizontal scaling
- ✅ Log-based storage — replay events để rebuild state
- ✅ Multiple consumer groups (processor, analytics, audit đọc cùng topic)
- ❌ Operational complexity cao hơn RabbitMQ
- ❌ Message ordering chỉ guaranteed trong 1 partition

---

## 6. ADR-002: Time-Series Data Storage

**Status:** Accepted

**Context:**
Analytics cần query: "tổng lượng hàng nhập/xuất tuần này theo warehouse", "trend tồn kho theo SKU trong 3 tháng". Data volume: ~10M events/ngày.

**Decision:** ClickHouse cho analytics queries + PostgreSQL cho operational data (current stock levels)

**Alternatives:** TimescaleDB (PostgreSQL extension — tốt nhưng slower aggregations), InfluxDB (tốt cho metrics nhưng không phù hợp business analytics)

**Consequences:**
- ✅ ClickHouse: columnar storage, aggregation query 100x faster than row-based
- ✅ PostgreSQL: operational data với ACID, joins, transactions
- ❌ 2 database systems — data sync cần careful design
- ❌ ClickHouse không hỗ trợ UPDATE/DELETE tốt → append-only design required

---

## 7. ADR-003: IoT Device Authentication

**Status:** Accepted

**Context:**
Hàng trăm IoT sensors cần authenticate khi gửi data. Certificate management phức tạp. Devices có thể bị compromised.

**Decision:** X.509 certificates cho device authentication + mutual TLS (mTLS) cho MQTT connection. Certificate rotation tự động qua device management service.

**Alternatives:** API Key per device (dễ bị leak), Username/Password (không scalable cho IoT), JWT (overhead cho thiết bị nhỏ)

**Consequences:**
- ✅ Mỗi device có identity riêng → revoke individual device nếu compromised
- ✅ mTLS bảo vệ data in-transit
- ❌ Certificate management infrastructure phức tạp (cần PKI setup)
- ❌ Devices cần đủ memory/CPU cho TLS handshake

---

## 8. Fitness Functions

### FF-001: IoT Event Processing Latency (Atomic)

```python
# Đo thời gian từ sensor event → stock level updated
# Target: < 5 giây end-to-end
def check_event_processing_latency():
    start = send_test_event(device_id="test-001", reading=50)
    updated = wait_for_stock_update(sku="TEST-SKU-001", timeout=10)
    latency = updated.timestamp - start.timestamp
    assert latency < 5.0, f"Event latency {latency}s > 5s SLA"
```

### FF-002: Alert False Positive Rate (Holistic)

```python
# Đo tỷ lệ alert sai (alert fired nhưng stock thực sự OK)
# Target: false positive rate < 2% mỗi tuần
def check_alert_quality(week_alerts):
    false_positives = [a for a in week_alerts
                       if a.status == 'FALSE_POSITIVE']
    rate = len(false_positives) / len(week_alerts)
    assert rate < 0.02, f"Alert false positive rate {rate:.1%} > 2%"
```

### FF-003: Data Durability (Atomic)

```python
# Không được mất event khi Kafka broker restart
# Test: send 1000 events → restart broker → consume all 1000
def check_no_data_loss():
    sent = send_batch_events(count=1000)
    restart_kafka_broker()
    received = consume_all_events(topic='inventory.raw-events')
    assert len(received) == len(sent), \
        f"Data loss: sent {len(sent)}, received {len(received)}"
```

---

## 9. Decision Rationale Document

**Tại sao Event-Driven Microservices thay vì Monolith?**

IoT workload có đặc điểm không thể xử lý tốt bằng monolith:
1. **Burst traffic:** Flash sale hoặc batch sensor sync tạo spike 100x normal → cần scale IoT ingestion riêng
2. **Different SLA:** Real-time processing cần latency < 5s, analytics có thể chờ 1-2 phút → scale khác nhau
3. **Different data lifecycle:** Raw IoT events lưu 7 ngày, aggregated analytics lưu 2 năm → storage strategy khác nhau
4. **Team independence:** IoT team, Analytics team, API team có thể deploy độc lập

**Tại sao không dùng Full Microservices từ ngày 1?**

Bắt đầu với 4 services chính (IoT Gateway, Inventory, Alert, Analytics) thay vì tách nhỏ hơn — tránh "microservices hell" khi team nhỏ:
- Shared Kafka cluster (không cần separate broker per service)
- Inventory Service bao gồm cả write và read (tách CQRS khi cần)
- Giữ Alert và Notification trong 1 service ban đầu
