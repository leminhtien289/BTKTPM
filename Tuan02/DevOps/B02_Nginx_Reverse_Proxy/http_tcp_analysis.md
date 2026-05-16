# B02 — Phân tích HTTP vs TCP trong Nginx Reverse Proxy

## HTTP Layer (Layer 7) — Nginx hoạt động như thế nào

```
Client                    Nginx                    Backend App
  │                         │                          │
  │──TCP Connect (SYN)──────▶│                          │
  │◀──SYN-ACK───────────────│                          │
  │──ACK────────────────────▶│                          │
  │                         │──TCP Connect─────────────▶│
  │                         │◀──Connected──────────────│
  │                         │                          │
  │──HTTP GET /api/users────▶│                          │
  │  Host: example.com       │──HTTP GET /api/users────▶│
  │  X-Forwarded-For: ...    │  (with injected headers) │
  │                         │◀──HTTP 200 JSON──────────│
  │◀──HTTP 200 JSON─────────│                          │
  │                         │                          │
  │──HTTP GET /api/orders───▶│ (reuse upstream conn)    │
  │                         │──HTTP GET /api/orders────▶│
  │                         │  (keepalive = reuse TCP)  │
```

### Tại sao dùng Layer 7 (HTTP) Proxy:
- **Header manipulation:** Inject X-Real-IP, X-Forwarded-For, X-Forwarded-Proto
- **Path routing:** `/api/*` → backend:8080, `/static/*` → CDN
- **SSL termination:** Client dùng HTTPS, backend dùng HTTP (đơn giản hơn)
- **Response caching:** Nginx cache response, không cần hit backend
- **Rate limiting:** Dựa trên HTTP headers (IP, user-agent, auth token)

## TCP Layer (Layer 4) — Nginx stream module

```nginx
# Dùng cho non-HTTP: database proxy, TCP load balancing
stream {
    upstream db_cluster {
        server 10.0.1.10:5432;  # PostgreSQL replica 1
        server 10.0.1.11:5432;  # PostgreSQL replica 2
    }

    server {
        listen 5432;
        proxy_pass db_cluster;
        proxy_connect_timeout 5s;
    }
}
```

### Khi nào dùng TCP Proxy:
- Database connection pooling (PostgreSQL, MySQL, Redis)
- gRPC load balancing (gRPC dùng HTTP/2 over TCP)
- Custom binary protocols

## Connection Flow Diagram

```
HTTP Request Flow:
Client ──[TLS:443]──▶ Nginx ──[HTTP:8080]──▶ App Server
         1 TCP conn                1 TCP conn (keepalive pool)
         Nhiều requests            Nhiều requests share 1 conn

TCP Keepalive Pool (upstream keepalive 32):
Nginx giữ sẵn 32 TCP connections tới backend
→ không cần TLS handshake mỗi request
→ giảm latency ~50ms cho HTTPS backend
```

## Key Configuration Notes

| Parameter | Giá trị | Giải thích |
|---|---|---|
| `worker_processes auto` | = số CPU cores | Mỗi worker handle hàng nghìn connections |
| `keepalive_timeout 65` | 65 giây | Giữ TCP connection với client sau response |
| `upstream keepalive 32` | 32 connections | Pool connection tới backend |
| `limit_req_zone` | 100r/m per IP | Rate limit ở memory zone (Layer 7) |
| `proxy_http_version 1.1` | HTTP/1.1 | Bắt buộc cho keepalive với upstream |
| `proxy_set_header Connection ""` | Empty | Xóa hop-by-hop header, enable keepalive |
