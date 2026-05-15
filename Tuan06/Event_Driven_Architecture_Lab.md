# Buổi 6 — EVENT-DRIVEN ARCHITECTURE

## Bài toán: Movie Ticket System
Một hệ thống đặt vé xem phim với yêu cầu xử lý bất đồng bộ (asynchronous) để đảm bảo hệ thống scalable.

---

### ❖ Yêu cầu chức năng

1. **Quản lý phim:**
   - Xem danh sách phim
   - Thêm / sửa phim
2. **Quản lý người dùng:**
   - Đăng ký / đăng nhập
3. **Đặt vé:**
   - Chọn phim + số ghế
   - Tạo booking
4. **Thanh toán:**
   - Thanh toán vé (giả lập)
   - Cập nhật trạng thái booking
5. **Thông báo:**
   - Gửi thông báo khi đặt vé thành công

---

### ❖ Yêu cầu kiến trúc

**Áp dụng Event-Driven Architecture:**
- Các service KHÔNG gọi trực tiếp nhau.
- Giao tiếp qua Message Broker (Kafka / RabbitMQ / Redis PubSub).

**Luồng event chính:**
`User → Booking Service → (Publish Event) → Payment Service (Consume) → Notification Service (Consume)`

**Danh sách Event:**

| Event | Mô tả |
| :--- | :--- |
| `USER_REGISTERED` | Người dùng đăng ký |
| `BOOKING_CREATED` | Tạo booking |
| `PAYMENT_COMPLETED` | Thanh toán xong |
| `BOOKING_FAILED` | Thanh toán thất bại |

---

### ❖ Phân công (Nhóm 5 người)

#### Người 1 – Frontend (ReactJS)
* **UI:** Login/Register, Danh sách phim, Đặt vé.
* **Nhiệm vụ:** Gọi API chỉ vào 1 service (Gateway hoặc Booking Service). Không gọi trực tiếp tất cả các service.

#### Người 2 – User Service (Spring Boot)
* **API:**
    - `POST /register`
    - `POST /login`
* **Nhiệm vụ:** Khi đăng ký, Publish event: `USER_REGISTERED`.

#### Người 3 – Movie Service (Spring Boot)
* **API:**
    - `GET /movies`
    - `POST /movies`
* **Yêu cầu:** Không cần event phức tạp.

#### Người 4 – Booking Service (CORE - Spring Boot)
* **API:**
    - `POST /bookings`
    - `GET /bookings`
* **Nhiệm vụ:** 
    - Khi tạo booking: Publish event: `BOOKING_CREATED`.
    - **KHÔNG** xử lý payment trực tiếp.

#### Người 5 – Payment + Notification Service (Spring Boot)
* **Payment:**
    - Listen: `BOOKING_CREATED`
    - Xử lý: Random success/fail
    - Publish: `PAYMENT_COMPLETED` hoặc `BOOKING_FAILED`
* **Notification:**
    - Listen: `PAYMENT_COMPLETED`
    - Nhiệm vụ: Gọi API hoặc log thông báo.
    - Output example: *"User A đã đặt đơn #123 thành công!"* hoặc *"Booking #123 thành công!"*

---

### ❖ Mô hình triển khai trên LAN

| Service | IP |
| :--- | :--- |
| **User** | `192.168.?.?:8081` |
| **Movie** | `192.168.?.?:8082` |
| **Booking** | `192.168.?.?:8083` |
| **Payment** | `192.168.?.?:8084` |
| **Frontend** | `192.168.?.?:8085` |

* **Broker chạy riêng (Kafka / RabbitMQ):** `192.168.?.?:9092`

---

### ❖ Kịch bản Test (BẮT BUỘC DEMO)

1. User đăng ký → log event.
2. Chọn phim → đặt vé.
3. Payment xử lý.
4. Notification hiển thị kết quả.

---

### ❖ Bonus (Nếu làm nhanh)

1. Dead Letter Queue.
2. Retry mechanism.
3. Event log (lưu lịch sử event).
4. Dashboard realtime.
5. API Gateway (Spring Cloud Gateway).

---

### ❖ Tiêu chí chấm điểm

| Tiêu chí | Điểm |
| :--- | :--- |
| Đúng Event-Driven | 3 |
| Publish/Consume đúng | 2.5 |
| Flow hoạt động end-to-end | 2 |
| Không gọi trực tiếp service | 1.5 |
| Demo + log rõ ràng | 1 |

---

### ❖ Các giai đoạn tiếp theo

**Giai đoạn 2 (Homework):**
- **Dockerize:** Mỗi service = 1 container.
- **Docker-compose:** Chạy toàn bộ hệ thống.
- **Deploy:** Local server (1 máy).

**Giai đoạn 3 (Optional):**
- Chạy hệ thống trên 1 server thật (VPS hoặc máy lab).
