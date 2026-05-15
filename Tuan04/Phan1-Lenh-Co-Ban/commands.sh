#!/bin/bash

# ============================================================
# PHẦN 1: 31 LỆNH DOCKER CƠ BẢN
# Chạy từng lệnh một, đọc comment để hiểu ý nghĩa
# ============================================================

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

# 29. Tạo Dockerfile đơn giản để test build
# (xem file test-build/Dockerfile)

# 30. Build image từ Dockerfile (dấu . = thư mục hiện tại)
docker build -t my_nginx_image ./test-build

# 31. Chạy image vừa build
docker run -d -p 8080:80 my_nginx_image
