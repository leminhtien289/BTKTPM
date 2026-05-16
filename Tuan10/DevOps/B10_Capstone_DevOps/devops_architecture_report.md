# B10 — Capstone DevOps: Tổng hợp Kiến trúc DevOps

## Tổng quan hệ thống

Hệ thống **Microservice E-Commerce** được vận hành theo mô hình DevOps hiện đại với đầy đủ automation pipeline từ commit đến production.

---

## Kiến trúc DevOps tổng thể

```
Developer Workstation
      │  git push
      ▼
GitHub Repository
      │  webhook trigger
      ▼
Jenkins CI/CD Server
  │
  ├── Stage 1: Checkout + Lint (< 1 min)
  ├── Stage 2: Unit + Integration Tests (< 3 min)
  ├── Stage 3: Docker Build (< 2 min)
  ├── Stage 4: Push to Docker Hub
  │              │ username/myapp:build-42-abc1234
  │              │ username/myapp:latest
  ├── Stage 5: kubectl set image → Kubernetes Rolling Update
  └── Stage 6: Smoke test + Verification
      │
      ▼ (on failure: kubectl rollout undo)

Kubernetes Cluster (Production)
  ├── Namespace: default
  │     ├── Deployment: myapp (2-10 pods, HPA)
  │     ├── Service: myapp-service (NodePort/LoadBalancer)
  │     └── Secret: myapp-secrets (DB_PASSWORD, JWT_SECRET)
  └── Namespace: monitoring
        ├── Prometheus (scrape metrics every 15s)
        ├── Grafana (dashboards + alerts)
        ├── Node Exporter (host metrics)
        └── AlertManager (route alerts → Slack/Email)

Infrastructure as Code:
  ├── K8s manifests: DevOps/B07_Kubernetes/deployment.yaml
  ├── Monitoring stack: DevOps/B09_Monitoring/docker-compose.monitoring.yml
  ├── Nginx config: DevOps/B02_Nginx_Reverse_Proxy/nginx.conf
  └── Cron scripts: DevOps/B01_Shell_Scripts/*.sh
```

---

## Chiến lược từng thành phần

| Component | Tool | Mục đích |
|---|---|---|
| Source Control | Git + GitHub | Version control, PR workflow, webhook trigger |
| CI/CD | Jenkins (Docker) | Build automation, test, deploy pipeline |
| Containerization | Docker | Reproducible builds, portable deployment |
| Container Registry | Docker Hub | Store và version image |
| Orchestration | Kubernetes (minikube/cloud) | Auto-scaling, self-healing, rolling update |
| Reverse Proxy | Nginx | TLS termination, rate limiting, static cache |
| Monitoring | Prometheus + Grafana | Metrics collection, dashboards, alerts |
| Log Rotation | Custom shell scripts | Disk management, log retention |
| Backup | backup.sh + cron | Database + config backup, 7-day retention |
| Secrets | K8s Secrets + env var | Zero hardcoded credentials |
| Security | UFW + SSH hardening | Network firewall, key-only auth |

---

## Deployment Flow (End-to-End)

```
1. Developer pushes commit → GitHub
2. Jenkins webhook fires (< 10s delay)
3. CI Pipeline (< 6 min):
   checkout → lint → test → build Docker image
4. Image pushed: username/myapp:42-abc1234
5. kubectl set image → triggers K8s rolling update
   - New pods created (maxSurge: 1)
   - Old pods terminated only after new ones are Ready
   - Zero downtime: readinessProbe gates traffic
6. Smoke test: curl /health → 200 OK
7. Pipeline: SUCCESS / rollback if any stage fails

Rollback path:
  kubectl rollout undo deployment/myapp  (< 30 seconds)
```

---

## SLA & Metrics

| Metric | Target | How measured |
|---|---|---|
| Deployment frequency | ≥ 1/day | Jenkins build count |
| Lead time (commit→prod) | < 15 min | Jenkins pipeline duration |
| MTTR (restore after failure) | < 5 min | kubectl rollout undo time |
| Change failure rate | < 5% | Failed builds / total builds |
| Uptime | 99.9% | Prometheus `up` metric |
| API p99 latency | < 300ms | Prometheus histogram |

---

## Bài học & Trade-offs

1. **Jenkins vs GitHub Actions:** Jenkins cho phép self-hosted (kiểm soát infrastructure), GitHub Actions đơn giản hơn cho open-source. Chọn Jenkins vì cần run Docker-in-Docker và có existing server.

2. **Docker Compose vs Kubernetes:** Docker Compose đủ cho dev/staging. K8s cần cho production khi cần auto-scaling và self-healing. Trade-off: K8s có learning curve cao.

3. **Prometheus pull model:** Prometheus chủ động scrape metrics thay vì application push. Ưu điểm: không cần change app code để add monitoring. Nhược điểm: cần network access từ Prometheus tới app.

4. **Shell scripts vs Configuration Management:** Ansible/Chef phù hợp hơn khi > 10 servers. Shell scripts đủ cho small scale và không thêm dependency.
