# Buổi 5 — SERVICE-BASED ARCHITECTURE

## Bài toán: Mini Food Ordering System
Một công ty muốn xây dựng hệ thống đặt món ăn nội bộ cho nhân viên (giống ShopeeFood mini).

---

### ❖ Yêu cầu chức năng

1. **Quản lý món ăn:**
   - Xem danh sách món ăn
   - Thêm / sửa / xóa món ăn
2. **Quản lý người dùng:**
   - Đăng ký / đăng nhập
   - Phân quyền (USER / ADMIN)
3. **Đặt món:**
   - Thêm món vào giỏ hàng
   - Tạo đơn hàng
4. **Thanh toán (giả lập):**
   - Chọn phương thức thanh toán (COD / Banking)
   - Cập nhật trạng thái đơn hàng
5. **Thông báo**
   - Khi đặt hàng thành công → gửi thông báo (console log hoặc REST call)

---

### ❖ Yêu cầu kiến trúc

**Áp dụng Service-Based Architecture:**
- Mỗi chức năng = 1 service riêng biệt (Spring Boot)
- Giao tiếp qua REST API (HTTP)
- Có thể dùng API Gateway (optional)

---

### ❖ Phân công (Nhóm 5 người)

#### Người 1 – Frontend (ReactJS)
* **UI:** Login/Register, Danh sách món, Giỏ hàng, Đặt hàng.
* **Nhiệm vụ:** Gọi API từ các service.
* **Tech:** ReactJS + Axios.

#### Người 2 – User Service (Spring Boot)
* **API:**
    - `POST /register`
    - `POST /login`
    - `GET /users`
* **Yêu cầu:** JWT đơn giản (optional), lưu memory hoặc H2 database.

#### Người 3 – Food Service (Spring Boot)
* **API:**
    - `GET /foods`
    - `POST /foods`
    - `PUT /foods/{id}`
    - `DELETE /foods/{id}`
* **Yêu cầu:** Seed sẵn dữ liệu, không cần auth phức tạp.

#### Người 4 – Order Service (Spring Boot)
* **API:**
    - `POST /orders`
    - `GET /orders`
* **Nhiệm vụ:** Khi tạo order, cần gọi Food Service để lấy thông tin món và gọi User Service để validate user.

#### Người 5 – Payment + Notification Service (Spring Boot)
* **API:** `POST /payments`
* **Nhiệm vụ:**
    - Khi thanh toán: Update trạng thái order (gọi Order Service) và gửi notification.
    - **Notification:** Gọi API hoặc log: "User A đã đặt đơn #123 thành công".

---

### ❖ Mô hình triển khai (LAN)

- Mỗi người chạy service trên máy riêng:
    - `192.168.?.?:8081` → User Service
    - `192.168.?.?:8082` → Food Service
    - `192.168.?.?:8083` → Order Service
    - `192.168.?.?:8084` → Payment Service
- Frontend gọi trực tiếp các IP trên.
- **Lưu ý:** Cấu hình CORS + IP thật (KHÔNG dùng localhost chéo máy).

---

### ❖ Kịch bản Test (BẮT BUỘC DEMO)

1. User đăng ký + login.
2. Xem danh sách món.
3. Thêm vào giỏ → tạo order.
4. Thanh toán.
5. Nhận thông báo.

---

### ❖ Bonus (Nếu còn thời gian)

1. API Gateway (Spring Cloud Gateway).
2. Load balancing (round robin giả lập).
3. Retry khi service fail.
4. Logging tập trung.

---

### ❖ Tiêu chí chấm điểm

| Tiêu chí | Điểm |
| :--- | :--- |
| Đúng kiến trúc Service-Based | 3 |
| API hoạt động | 2 |
| Giao tiếp giữa các services | 2 |
| Frontend chạy mượt | 1.5 |
| Demo hoàn chỉnh | 1 |

---

### ❖ Các giai đoạn tiếp theo

**Giai đoạn 2 (Homework):**
- **Dockerize:** Mỗi service = 1 container.
- **Docker-compose:** Chạy toàn bộ hệ thống bằng một lệnh duy nhất.
- **Deploy:** Local server (chạy trên 1 máy).

**Giai đoạn 3 (Optional):**
- **Dockerize:** Chạy hệ thống trên một server thật (VPS hoặc máy lab).
