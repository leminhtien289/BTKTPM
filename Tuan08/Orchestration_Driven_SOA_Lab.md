# Buổi 8: ORCHESTRATION-DRIVEN SOA

## Bài toán: Travel Booking System
Xây dựng hệ thống đặt tour với các luồng cơ bản:
- Người dùng chọn tour
- Đặt tour
- Thanh toán
- Nhận xác nhận

---

### ❖ 5 chức năng chính
1. **Quản lý người dùng:** Đăng ký / đăng nhập
2. **Quản lý tour:** Xem danh sách tour, Chi tiết tour
3. **Đặt tour:** Tạo booking
4. **Thanh toán:** Thanh toán booking
5. **Xác nhận:** Gửi thông báo booking thành công

---

### ❖ Yêu cầu kiến trúc

**Áp dụng Orchestration-Driven SOA**

**Nguyên lý:**
- Có **Orchestrator Service** (đóng vai trò trung tâm điều phối).
- Các service khác:
    - KHÔNG gọi nhau trực tiếp.
    - Chỉ nhận lệnh từ Orchestrator.

**Thành phần hệ thống:**

| Thành phần | Vai trò |
| :--- | :--- |
| **Orchestrator** | Điều phối toàn bộ flow |
| **User Service** | Quản lý user |
| **Tour Service** | Quản lý tour |
| **Booking Service** | Tạo booking |
| **Payment Service** | Thanh toán |

---

### ❖ Phân công (Nhóm 5 người)

#### Người 1 – Frontend (ReactJS)
* **UI:** Login, Xem tour, Đặt tour.
* **Nhiệm vụ:**
    - Chỉ gọi API của Orchestrator.
    - KHÔNG gọi trực tiếp các service khác.

#### Người 2 – Orchestrator Service (Trung tâm)
* **API:** `POST /book-tour`
* **Flow trong Orchestrator (Tất cả đều là REST call):**
    1. Validate user (gọi User Service).
    2. Lấy thông tin tour (gọi Tour Service).
    3. Tạo booking (gọi Booking Service).
    4. Gọi Payment Service.
    5. Trả kết quả về Frontend.

#### Người 3 – User Service
* **API:**
    - `POST /login`
    - `GET /users/{id}`

#### Người 4 – Tour Service
* **API:**
    - `GET /tours`
    - `GET /tours/{id}`

#### Người 5 – Booking + Payment Service
* **Booking:**
    - **API:** `POST /bookings`
* **Payment:**
    - **API:** `POST /payments`
    - **Logic:** Random success/fail (để giả lập thanh toán).

---

### ❖ Triển khai trên LAN

| Service | IP dự kiến |
| :--- | :--- |
| **Orchestrator** | `192.168.1.10:8080` |
| **User** | `192.168.1.11:8081` |
| **Tour** | `192.168.1.12:8082` |
| **Booking** | `192.168.1.13:8083` |
| **Payment** | `192.168.1.14:8084` |
| **Frontend** | `192.168.1.15:3000` |

---

### ❖ Flow chi tiết

**Flow đặt tour:**
1. **Frontend** → Gọi API của **Orchestrator**.
2. **Orchestrator** tuần tự thực hiện:
    - Gọi **User Service**
    - Gọi **Tour Service**
    - Gọi **Booking Service**
    - Gọi **Payment Service**
3. **Orchestrator** tổng hợp và trả kết quả về **Frontend**.
