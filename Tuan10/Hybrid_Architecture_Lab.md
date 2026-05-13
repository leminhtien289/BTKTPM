# Buổi 10: HYBRID (EVENT-DRIVEN + MICROSERVICES)

## Bài toán: Food Delivery System
Xây dựng hệ thống giống GrabFood / ShopeeFood mini với yêu cầu:
- Cần phản hồi nhanh cho người dùng (REST).
- Xử lý các tác vụ hậu trường một cách bất đồng bộ (Async) thông qua Event.

---

### ❖ 5 chức năng chính
1. **Quản lý người dùng:** Đăng ký / đăng nhập.
2. **Xem món ăn:** Danh sách món, Chi tiết món.
3. **Đặt hàng:** Tạo order, Xem order.
4. **Thanh toán:** Thanh toán đơn hàng.
5. **Thông báo:** Gửi thông báo khi order thành công.

---

### ❖ Yêu cầu kiến trúc: Hybrid

Kết hợp giữa **Microservices** và **Event-Driven Architecture**:

**1. Microservices (REST – Synchronous)**
- `Frontend → API Gateway → Service`
- **Dùng cho:** Login, Get data (foods, orders). 

**2. Event-Driven (Asynchronous)**
- **Dùng cho:** Payment, Notification, Order processing hậu kỳ.

**Nguyên lý thiết kế:**
| Loại xử lý | Dùng công nghệ gì |
| :--- | :--- |
| Cần response ngay lập tức | REST API |
| Không cần response ngay | Event (Message Broker) |

---

### ❖ Luồng hệ thống (QUAN TRỌNG)

**Flow chính:**
1. User → Frontend → API Gateway.
2. Gateway → **Order Service** (gọi qua REST).
3. **Order Service**:
    - Lưu order vào Database.
    - Publish event: `ORDER_CREATED`.
4. **Payment Service** (consume event):
    - Lắng nghe event `ORDER_CREATED` và xử lý thanh toán.
    - Publish event: `PAYMENT_SUCCESS` (hoặc `PAYMENT_FAILED`).
5. **Notification Service**:
    - Lắng nghe event `PAYMENT_SUCCESS` và gửi thông báo.

**Danh sách Event:**
| Event | Mô tả |
| :--- | :--- |
| `ORDER_CREATED` | Tạo đơn hàng mới |
| `PAYMENT_SUCCESS` | Thanh toán thành công |
| `PAYMENT_FAILED` | Thanh toán thất bại |

---

### ❖ Phân công (Nhóm 5 người)

#### Người 1 – Frontend (ReactJS)
* **UI:** Login/Register, Danh sách món, Đặt hàng.
* **Nhiệm vụ:** Chỉ gọi API Gateway (REST). Không cần biết đến các event chạy ngầm phía sau.

#### Người 2 – API Gateway
* **Route:**
    - `/api/users` → User Service
    - `/api/foods` → Food Service
    - `/api/orders` → Order Service
* **Công nghệ:** Có thể dùng Spring Cloud Gateway.

#### Người 3 – User + Food Service
* **User API:** `POST /register`, `POST /login`
* **Food API:** `GET /foods`
* **Đặc điểm:** Pure REST, không dính líu đến Event.

#### Người 4 – Order Service (CORE)
* **API:** `POST /orders`, `GET /orders`
* **Nhiệm vụ khi tạo order:**
    - Lưu thông tin vào DB.
    - Publish event: `ORDER_CREATED`.
    - **Lưu ý:** KHÔNG xử lý payment trực tiếp tại đây.

#### Người 5 – Payment + Notification Service
* **Payment Service:**
    - **Consume:** Lắng nghe `ORDER_CREATED`.
    - **Xử lý:** Random success/fail.
    - **Publish:** Bắn ra event `PAYMENT_SUCCESS` hoặc `PAYMENT_FAILED`.
* **Notification Service:**
    - **Consume:** Lắng nghe `PAYMENT_SUCCESS`.
    - **Output:** In ra log hoặc gửi thông báo *"Đơn hàng #123 đã thanh toán thành công!"*

---

### ❖ Triển khai trên LAN

| Service | IP dự kiến |
| :--- | :--- |
| **Gateway** | `192.168.1.10:8080` |
| **User/Food** | `192.168.1.11:8081` |
| **Order** | `192.168.1.12:8082` |
| **Payment/Notification** | `192.168.1.13:8083` |
| **Frontend** | `192.168.1.14:3000` |
| **Kafka/RabbitMQ** | `192.168.1.100:9092` |

---

### ❖ Kịch bản Demo
1. User login.
2. User xem món.
3. User đặt hàng (REST trả về kết quả ngay lập tức).
4. Hệ thống Payment chạy ngầm xử lý (Event).
5. Notification hiển thị kết quả cuối cùng.
