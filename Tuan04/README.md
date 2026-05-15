# Docker B4 — Hướng dẫn thực hành

## Phần 1: 31 lệnh cơ bản — chạy và hiểu

```bash
# 1. Kiểm tra version Docker
docker --version

# 2. Chạy container test (tải image + chạy + xóa tự động)
docker run hello-world

# 3. Tải image nginx về máy (chưa chạy)
docker pull nginx

# 4. Xem danh sách image đang có
docker images

# 5. Chạy nginx ở chế độ background (-d = detached)
docker run -d nginx

# 6. Xem container đang chạy
docker ps

# 7. Xem tất cả container (kể cả đã stop)
docker ps -a

# 8. Xem log của container
docker logs <container_id>

# 9. Vào trong container (mở shell)
docker exec -it <container_id> /bin/sh

# 10. Dừng container
docker stop <container_id>

# 11. Khởi động lại container
docker restart <container_id>

# 12. Xóa container (phải stop trước)
docker rm <container_id>

# 13. Xóa tất cả container đã stop
docker container prune

# 14. Xóa một image
docker rmi <image_id>

# 15. Xóa tất cả image không dùng
docker image prune -a

# 16. Chạy nginx, map port 8080 máy host → port 80 container
docker run -d -p 8080:80 nginx

# 17. Xem chi tiết cấu hình container (IP, volume, env...)
docker inspect <container_id>

# 18. Mount volume: thư mục "mydata" → /data trong container
docker run -d -v mydata:/data nginx

# 19. Xem danh sách volume
docker volume ls

# 20. Xóa volume không dùng
docker volume prune

# 21. Đặt tên cho container
docker run -d --name my_nginx nginx

# 22. Xem CPU/Memory container đang dùng (realtime)
docker stats

# 23. Xem danh sách network
docker network ls

# 24. Tạo network tùy chỉnh
docker network create my_network

# 25. Chạy container trong network tùy chỉnh
docker run -d --network my_network --name my_container nginx

# 26. Kết nối container có sẵn vào network
docker network connect my_network my_nginx

# 27. Truyền biến môi trường vào container
docker run -d -e MY_ENV=hello_world nginx

# 28. Xem log realtime (follow)
docker logs -f my_nginx

# 29-31: Build và chạy image tự tạo
# Tạo Dockerfile với nội dung:
#   FROM nginx
#   COPY index.html /usr/share/nginx/html/index.html

# 30. Build image từ Dockerfile (dấu . = thư mục hiện tại)
docker build -t my_nginx_image .

# 31. Chạy image vừa build
docker run -d -p 8080:80 my_nginx_image
```

---

## Phần 2: 10 bài Dockerfile — cách build và chạy

### Bài 1 — Node.js
```bash
cd bai1-nodejs
docker build -t bai1-nodejs .
docker run -d -p 3000:3000 bai1-nodejs
# Test: curl http://localhost:3000
```

### Bài 2 — Python Flask
```bash
cd bai2-flask
docker build -t bai2-flask .
docker run -d -p 5000:5000 bai2-flask
# Test: curl http://localhost:5000
```

### Bài 3 — React
```bash
cd bai3-react
# Cần có sẵn React project (npm create vite@latest .)
docker build -t bai3-react .
docker run -d -p 8080:80 bai3-react
```

### Bài 4 — Nginx Static
```bash
cd bai4-nginx
docker build -t bai4-nginx .
docker run -d -p 8080:80 bai4-nginx
# Test: mở http://localhost:8080
```

### Bài 5 — Go
```bash
cd bai5-go
docker build -t bai5-go .
docker run -d -p 8080:8080 bai5-go
# Test: curl http://localhost:8080
```

### Bài 6 — Multi-stage Node.js
```bash
cd bai6-multistage
docker build -t bai6-multistage .
docker run -d -p 3000:3000 bai6-multistage
# So sánh kích thước: docker images | grep bai
```

### Bài 7 — ENV variable
```bash
cd bai7-env
docker build -t bai7-env .

# Dùng ENV mặc định (development)
docker run bai7-env

# Override ENV khi chạy
docker run -e APP_ENV=production bai7-env
```

### Bài 8 — PostgreSQL + auto init
```bash
cd bai8-postgres
docker build -t bai8-postgres .
docker run -d -p 5432:5432 bai8-postgres

# Kết nối vào kiểm tra:
docker exec -it <id> psql -U tien -d mydb -c "SELECT * FROM users;"
```

### Bài 9 — Redis custom config
```bash
cd bai9-redis
docker build -t bai9-redis .
docker run -d -p 6379:6379 bai9-redis

# Test kết nối (cần password):
docker exec -it <id> redis-cli -a 12345678 ping
```

### Bài 10 — PHP Apache
```bash
cd bai10-php
docker build -t bai10-php .
docker run -d -p 8080:80 bai10-php
# Test: mở http://localhost:8080

# Mount source từ máy host (live reload):
docker run -d -p 8080:80 -v $(pwd):/var/www/html bai10-php
```

---

## Điểm khác biệt quan trọng cần nhớ

| | Mô tả |
|---|---|
| `COPY` vs `ADD` | Dùng `COPY` cho file thông thường. `ADD` dùng khi cần giải nén `.tar` |
| `CMD` vs `ENTRYPOINT` | `CMD` có thể override khi `docker run`. `ENTRYPOINT` luôn chạy |
| Multi-stage | Image cuối nhỏ hơn nhiều vì không chứa build tools |
| `-v mydata:/data` | Named volume — Docker quản lý, dữ liệu tồn tại sau khi xóa container |
| `-v $(pwd):/data` | Bind mount — mount thư mục máy host vào container |
