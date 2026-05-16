# Buổi 8 — Architecture Analysis & Fitness Functions
## Hệ thống: Billing & Subscription

---

## 1. Architectural Characteristics (4 đặc tính chính)

| # | Characteristic | Mô tả | SLA Target |
|---|---|---|---|
| 1 | **Security** | Bảo vệ thông tin thanh toán, PCI-DSS compliance | 0 breach / năm |
| 2 | **Latency** | Thời gian xử lý billing cycle | Billing API < 300ms p99 |
| 3 | **Reliability** | Không mất dữ liệu subscription, không double-charge | Durability 99.999% |
| 4 | **Modifiability** | Thêm pricing plan mới không cần sửa billing engine | Deploy new plan < 1 ngày |

---

## 2. Fitness Function Definitions

---

### FF-001: Security — Dependency Vulnerability Scan (Atomic)

**Type:** Atomic (kiểm tra 1 đặc tính tại 1 thời điểm)  
**Trigger:** Mỗi commit, chạy trong CI pipeline  
**Tool:** Snyk / OWASP Dependency-Check

```python
# fitness_security.py
def check_no_critical_vulnerabilities(scan_result):
    """
    Fail build nếu có CVE severity CRITICAL hoặc HIGH
    trong dependencies của billing service.
    """
    critical = [v for v in scan_result.vulnerabilities
                if v.severity in ('CRITICAL', 'HIGH')]
    assert len(critical) == 0, (
        f"Build blocked: {len(critical)} critical vulnerabilities found.\n"
        + "\n".join(f"  {v.package}: {v.cve_id} ({v.severity})"
                    for v in critical)
    )
```

**Pass criteria:** Zero CRITICAL/HIGH CVEs  
**Fail action:** Block merge, notify security team

---

### FF-002: Latency — API Response Time (Atomic)

**Type:** Atomic  
**Trigger:** Sau mỗi deployment, chạy load test tự động  
**Tool:** k6 / Gatling

```javascript
// k6_billing_latency.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50,          // 50 concurrent users
  duration: '60s',
  thresholds: {
    // Fitness function: 99th percentile < 300ms
    'http_req_duration{endpoint:billing}': ['p(99)<300'],
    // Fail if > 1% requests return 5xx
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const res = http.post(`${__ENV.BASE_URL}/api/v1/billing/process`, {
    subscription_id: 'sub_test_001',
    amount: 99.99,
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

**Pass criteria:** p99 latency < 300ms, error rate < 1%  
**Fail action:** Rollback deployment, alert on-call

---

### FF-003: Reliability — No Double-Charge Detection (Atomic)

**Type:** Atomic  
**Trigger:** Hàng ngày (cron 2:00 AM), sau mỗi billing run  
**Tool:** Custom SQL audit query

```sql
-- fitness_no_double_charge.sql
-- Fail nếu tìm thấy subscription bị charge > 1 lần trong cùng billing period
SELECT
    subscription_id,
    billing_period,
    COUNT(*) as charge_count,
    SUM(amount) as total_charged
FROM billing_transactions
WHERE
    status = 'SUCCESS'
    AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY subscription_id, billing_period
HAVING COUNT(*) > 1;

-- Result: 0 rows = PASS, any rows = FAIL (double-charge detected)
```

**Pass criteria:** 0 duplicate charges in any 24h window  
**Fail action:** Freeze billing run, alert finance team, initiate refund process

---

### FF-004: Modifiability — Pricing Plan Deployment Time (Holistic)

**Type:** Holistic (đo toàn bộ hệ thống theo thời gian, không chỉ 1 component)  
**Trigger:** Quarterly measurement  
**Measurement:**

```bash
#!/bin/bash
# fitness_modifiability.sh
# Đo thời gian từ khi merge PR "new pricing plan" đến khi
# plan available ở production API

PR_MERGED_AT=$(git log --format="%ci" -1 -- pricing_plans/)
PLAN_AVAILABLE_AT=$(curl -s "$PROD_URL/api/v1/plans" \
    | jq -r '.plans[] | select(.id=="new_plan") | .created_at')

DELTA_MINUTES=$(( ($(date -d "$PLAN_AVAILABLE_AT" +%s) \
                 - $(date -d "$PR_MERGED_AT" +%s)) / 60 ))

echo "Modifiability metric: New plan deployed in ${DELTA_MINUTES} minutes"

if [ "$DELTA_MINUTES" -gt 480 ]; then  # 8 hours = 480 minutes
    echo "FAIL: Exceeds 8-hour SLA for new plan deployment"
    exit 1
fi
echo "PASS"
```

**Pass criteria:** New pricing plan deployable (merge → prod) < 8 giờ, không cần billing engine code change  
**Fail action:** Architecture review — pricing config không đủ flexible, cần refactor

---

## 3. Fitness Function Pipeline Diagram

```
Developer pushes code
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                 CI Pipeline (GitHub Actions)           │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Stage 1: Static Analysis (< 2 min)             │  │
│  │    ├── FF-001: Security scan (Snyk)             │  │
│  │    └── Lint + Unit Tests                        │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        │ PASS                         │
│  ┌─────────────────────▼───────────────────────────┐  │
│  │  Stage 2: Integration Tests (< 5 min)           │  │
│  │    ├── FF-003: Double-charge detection test      │  │
│  │    └── API contract tests                       │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        │ PASS                         │
│  ┌─────────────────────▼───────────────────────────┐  │
│  │  Stage 3: Deploy to Staging                     │  │
│  │    └── FF-002: Load test (k6, 50 VUs, 60s)      │  │
│  │        p99 latency < 300ms                      │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        │ PASS                         │
└────────────────────────┼──────────────────────────────┘
                         ▼
              Deploy to Production
                         │
                         ▼
┌───────────────────────────────────────────────────────┐
│           Scheduled Jobs (Production)                  │
│                                                       │
│  Daily 02:00 AM:                                      │
│    └── FF-003: Audit double-charge (SQL query)        │
│                                                       │
│  Post-deployment:                                     │
│    └── FF-002: Smoke test (10 VUs, 30s)               │
│                                                       │
│  Quarterly:                                           │
│    └── FF-004: Modifiability measurement              │
└───────────────────────────────────────────────────────┘

FAIL at any stage:
  → Block deployment / rollback
  → Create alert (PagerDuty / Slack)
  → Ticket auto-created in Jira
```
