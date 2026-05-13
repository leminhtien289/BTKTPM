# Buổi 09: MICROSERVICES ARCHITECTURE

## Bài toán: E-Commerce Mini
Xây dựng hệ thống bán hàng đơn giản (giống Shopee mini):
- Người dùng mua sản phẩm
- Tạo đơn hàng
- Thanh toán

---

### ❖ 5 chức năng chính
1. **Quản lý người dùng:** Đăng ký / đăng nhập
2. **Quản lý sản phẩm:** Xem danh sách sản phẩm, Thêm / sửa sản phẩm
3. **Giỏ hàng:** Thêm / xóa sản phẩm
4. **Đặt hàng:** Tạo đơn hàng từ giỏ
5. **Thanh toán:** Thanh toán đơn hàng

---

### ❖ Yêu cầu kiến trúc

**Áp dụng Microservices Architecture**

**Nguyên tắc cốt lõi:**
- Mỗi domain = 1 service độc lập.
- Mỗi service có Database (DB) riêng.
- Giao tiếp giữa các service qua REST API.
- **Tuyệt đối KHÔNG share DB** giữa các service.

**Danh sách Microservices:**

| Service | Chức năng |
| :--- | :--- |
| **User Service** | Quản lý User |
| **Product Service**| Quản lý Product |
| **Cart Service** | Quản lý Cart |
| **Order Service** | Quản lý Order |
| **Payment Service**| Quản lý Payment |

---

### ❖ Phân công (Nhóm 5 người)

#### Người 1 – Frontend (ReactJS)
* **UI:** Login/Register, Danh sách sản phẩm, Giỏ hàng, Checkout.
* **Nhiệm vụ:** Gọi API Gateway (hoặc gọi trực tiếp tới từng service).

#### Người 2 – User Service
* **API:**
    - `POST /register`
    - `POST /login`
    - `GET /users`
* **DB riêng:** Quản lý bảng `users`.

#### Người 3 – Product Service
* **API:**
    - `GET /products`
    - `POST /products`
    - `PUT /products/{id}`
* **DB riêng:** Quản lý bảng `products`.

#### Người 4 – Cart Service
* **API:**
    - `POST /cart/add`
    - `GET /cart/{userId}`
    - `DELETE /cart/item`
* **Logic:** 
    - Lưu cart theo user. 
    - KHÔNG lưu thông tin chi tiết của product, chỉ lưu `productId`.

#### Người 5 – Order + Payment Service
* **Order:**
    - **API:** `POST /orders`, `GET /orders`.
    - **Flow tạo Order:**
        1. Lấy thông tin giỏ hàng từ **Cart Service**.
        2. Gọi **Product Service** để lấy giá sản phẩm.
        3. Tạo order.
* **Payment:**
    - **API:** `POST /payments`.
    - **Logic:** Update trạng thái order sau khi thanh toán.

---

### ❖ Triển khai trên LAN

| Service | IP dự kiến |
| :--- | :--- |
| **User** | `192.168.?.?:8081` |
| **Product** | `192.168.?.?:8082` |
| **Cart** | `192.168.?.?:8083` |
| **Order/Payment** | `192.168.?.?:8084` |
| **Frontend** | `192.168.?.?:3000` |

---

### ❖ Luồng xử lý chính

**Flow đặt hàng:**
1. User login.
2. User xem danh sách sản phẩm.
3. Add to cart.
4. **Checkout:**
    - Hệ thống gọi **Cart Service** → lấy danh sách cart hiện tại.
    - Hệ thống gọi **Product Service** → lấy giá cụ thể của từng sản phẩm.
    - Hệ thống gọi **Order Service** → tạo đơn hàng tổng.
5. **Payment** → Thực hiện thanh toán và update trạng thái đơn hàng.
