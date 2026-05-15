# Docker Compose — Buổi 05

> Tất cả lệnh chạy từ thư mục **Docker-Compose-Exercises/**

---

## Phần 1 — 15 lệnh cơ bản

Chạy từ `phan1/`:

```bash
cd phan1

# 1. Kiểm tra phiên bản
docker compose version

# 2. Khởi động foreground (xem log trực tiếp, Ctrl+C để dừng)
docker compose up

# 3. Khởi động background
docker compose up -d

# 4. Xem trạng thái các container
docker compose ps

# 5. Dừng và xóa container (GIỮ volume)
docker compose down

# 6. Restart tất cả service
docker compose restart

# 7. Xem log realtime
docker compose logs -f

# 8. Build lại image (sau khi thay đổi Dockerfile / code)
docker compose build

# 9. Chạy lệnh trong container đang chạy
docker compose exec app sh
docker compose exec mysql mysql -u user -ppassword mydb

# 10. Dừng và xóa container + XÓA LUÔN volume
docker compose down -v

# 11. Chạy lệnh trong container tạm (không cần up trước)
docker compose run app node --version

# 12. Dừng 1 service cụ thể (không xóa container)
docker compose stop mysql

# 13. Xóa container đã stop
docker compose rm mysql

# 14. Validate file YAML và xem config đã merge
docker compose config

# 15. Build lại image + khởi động background (dùng khi có code thay đổi)
docker compose up -d --build
```

---

## Phần 2 — 15 bài Docker Compose file

> Mỗi bài chạy từ thư mục của nó. Dùng `docker compose down` sau mỗi bài.

### Bài 1 — Nginx
```bash
cd phan2/bai1-nginx
docker compose up -d
# Test: mở http://localhost:8080
docker compose down
```

### Bài 2 — MySQL
```bash
cd phan2/bai2-mysql
docker compose up -d
# Test: vào shell MySQL
docker compose exec mysql mysql -u user -ppassword mydb -e "SHOW DATABASES;"
docker compose down
```

### Bài 3 — MySQL + PHPMyAdmin
```bash
cd phan2/bai3-phpmyadmin
docker compose up -d
# Test: mở http://localhost:8081
docker compose down
```

### Bài 4 — Node.js Express
```bash
cd phan2/bai4-nodejs
docker compose up -d --build
# Test: mở http://localhost:3000
docker compose down
```

### Bài 5 — Redis
```bash
cd phan2/bai5-redis
docker compose up -d
# Test: ping
docker compose exec redis redis-cli ping   # → PONG
docker compose down
```

### Bài 6 — WordPress + MySQL
```bash
cd phan2/bai6-wordpress
docker compose up -d
# Test: mở http://localhost:8080 (chờ ~30s lần đầu)
docker compose down -v
```

### Bài 7 — MongoDB + Mongo Express
```bash
cd phan2/bai7-mongodb
docker compose up -d
# Test: mở http://localhost:8081
docker compose down
```

### Bài 8 — Node.js + MySQL
```bash
cd phan2/bai8-nodejs-mysql
docker compose up -d --build
# Test: mở http://localhost:3000 (chờ MySQL healthy ~30s)
docker compose down
```

### Bài 9 — Flask
```bash
cd phan2/bai9-flask
docker compose up -d --build
# Test: mở http://localhost:5000
docker compose down
```

### Bài 10 — MySQL + Volumes (test persistent data)
```bash
cd phan2/bai10-volumes
docker compose up -d

# Tạo table
docker compose exec mysql mysql -u user -ppassword mydb -e "CREATE TABLE test (id INT);"

# Xóa container (GIỮ volume)
docker compose down

# Start lại
docker compose up -d

# Kiểm tra table vẫn còn → chứng minh volume persistent
docker compose exec mysql mysql -u user -ppassword mydb -e "SHOW TABLES;"

docker compose down -v
```

### Bài 11 — PostgreSQL + Adminer
```bash
cd phan2/bai11-postgres-adminer
docker compose up -d
# Test: mở http://localhost:8083
#   System: PostgreSQL | Server: postgres | User: user | Pass: password | DB: mydb
docker compose down
```

### Bài 12 — Prometheus + Grafana
```bash
cd phan2/bai12-prometheus-grafana
docker compose up -d
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000  (admin / admin)
docker compose down
```

### Bài 13 — React + Nginx (static)
```bash
cd phan2/bai13-react-nginx
docker compose up -d
# Test: mở http://localhost:3000
# (Thay dist/ bằng output của npm run build để dùng với React thật)
docker compose down
```

### Bài 14 — Custom Network (network isolation)
```bash
cd phan2/bai14-network
docker compose up -d

# service-a ping service-b → OK (cùng network1)
docker compose exec service-a ping -c 2 service-b

# service-a ping service-c → OK (cùng network2)
docker compose exec service-a ping -c 2 service-c

# service-b ping service-c → FAIL (khác network)
docker compose exec service-b ping -c 2 service-c

docker compose down
```

### Bài 15 — Resource Limits
```bash
cd phan2/bai15-resources
docker compose up -d
# Xem CPU + memory usage realtime
docker stats redis-limited
# Ctrl+C để thoát stats
docker compose down
```

---

## Phần 3 — 5 bài nâng cao

### Bài 1 — WordPress + MySQL (volumes + custom network)
```bash
cd phan3/bai1-wordpress-mysql
docker compose up -d
# Test: mở http://localhost:8080
docker compose down -v
```

### Bài 2 — Node.js + MongoDB (healthcheck + depends_on)
```bash
cd phan3/bai2-nodejs-mongodb
docker compose up -d --build
# Chờ MongoDB healthy (~20s), sau đó test:
docker compose ps          # mongodb: healthy
# Test: mở http://localhost:3000  → đếm số lần truy cập
docker compose down -v
```

### Bài 3 — Load Balancing (Nginx + Flask x2, round-robin)
```bash
cd phan3/bai3-loadbalancing
docker compose up -d --build --scale flask=2

# Test round-robin: chạy nhiều lần → thấy "server" thay đổi
curl http://localhost:8080
curl http://localhost:8080
curl http://localhost:8080

docker compose down
```

### Bài 4 — Prometheus + Grafana + cAdvisor
```bash
cd phan3/bai4-prometheus-grafana
docker compose up -d
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000  (admin / admin)
#   → Add datasource: Prometheus URL = http://prometheus:9090
#   → Import dashboard ID 193 (Docker monitoring)
# cAdvisor:   http://localhost:8090
docker compose down
```

### Bài 5 — Multi-tier Voting App
```bash
cd phan3/bai5-voting-app
docker compose up -d
# Vote:   http://localhost:5000  → chọn Cats hoặc Dogs
# Result: http://localhost:5001  → xem kết quả realtime
docker compose down -v
```

---

## Tips

```bash
# Reset hoàn toàn (xóa cả volume) trước khi test lại
docker compose down -v

# Xem log của 1 service cụ thể
docker compose logs -f app
docker compose logs -f mysql

# Validate YAML trước khi chạy
docker compose config
```
