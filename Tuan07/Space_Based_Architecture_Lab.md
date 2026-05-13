# Buổi 7 — SPACE-BASED ARCHITECTURE

## Bài toán: Hệ thống Flash Sale (Bán hàng sốc – chịu tải cao)
Một hệ thống bán hàng flash sale (giống Shopee/Lazada) cần giải quyết các vấn đề:
- Chịu tải cực cao (1000+ request/s).
- Tránh nghẽn cổ chai tại Database (DB Bottleneck).
- Xử lý với độ trễ cực thấp (Low latency).

---

### ❖ Yêu cầu 5 chức năng chính
1. **Xem danh sách sản phẩm:** Hiển thị nhanh các mặt hàng đang sale.
2. **Xem chi tiết sản phẩm:** Thông tin mô tả, giá sốc.
3. **Thêm vào giỏ hàng:** Lưu tạm sản phẩm người dùng chọn.
4. **Đặt hàng (Checkout):** Xác nhận đơn hàng.
5. **Giảm tồn kho (Real-time):** Trừ số lượng ngay lập tức để tránh bán quá số lượng (overselling).

---

### ❖ Yêu cầu kiến trúc

**Nguyên lý Space-Based Architecture:**
- **Hạn chế DB:** Không đọc/ghi trực tiếp vào DB trong lúc cao điểm để tránh treo hệ thống.
- **Data Grid (In-Memory):** Toàn bộ dữ liệu nóng nằm trên RAM (Memory Grid).
- **Processing Unit (PU):** Các đơn vị xử lý độc lập đi kèm với một bản sao dữ liệu hoặc kết nối trực tiếp vào Data Grid.

**Thành phần chính:**
- **Processing Unit (PU):** Service xử lý logic + Local Cache.
- **Data Grid:** Sử dụng **Redis** hoặc **Hazelcast** để chia sẻ dữ liệu trên RAM giữa các PU.
- **Messaging (Optional):** Dùng để đồng bộ dữ liệu xuống DB sau (eventual consistency).

---

### ❖ Phân công (Nhóm 5 người)

#### Người 1 – Frontend (ReactJS)
* **UI:** Danh sách sản phẩm, Giỏ hàng, Đặt hàng.
* **Nhiệm vụ:** Gọi API trực tiếp vào các Processing Unit (PU).

#### Người 2 – Product Processing Unit (PU1)
* **API:** `GET /products`, `GET /products/{id}`.
* **Data:** Load dữ liệu trực tiếp từ **Data Grid (Redis)**. KHÔNG đọc DB.

#### Người 3 – Cart Processing Unit (PU2)
* **API:** `POST /cart/add`, `GET /cart`.
* **Data:** Lưu trữ thông tin giỏ hàng trong **Data Grid**.

#### Người 4 – Order Processing Unit (PU3)
* **API:** `POST /checkout`.
* **Nhiệm vụ:** Lấy thông tin giỏ hàng từ Redis, tạo bản ghi đơn hàng và publish event (nếu cần).

#### Người 5 – Inventory Processing Unit (PU4)
* **API:** `GET /stock/{productId}`.
* **Nhiệm vụ:** Khi có yêu cầu checkout, thực hiện trừ tồn kho **trực tiếp trên Data Grid**. KHÔNG gọi DB để đảm bảo tốc độ.

---

### ❖ Mô hình triển khai trên LAN

| Service | Vai trò | IP dự kiến |
| :--- | :--- | :--- |
| **Redis** | Data Grid | `192.168.?.?:6379` |
| **PU1** | Product Service | `192.168.?.?:8081` |
| **PU2** | Cart Service | `192.168.?.?:8082` |
| **PU3** | Order Service | `192.168.?.?:8083` |
| **PU4** | Inventory Service | `192.168.?.?:8084` |
| **Frontend** | ReactJS App | `192.168.?.?:3000` |

---

### ❖ Luồng xử lý chính (Order Flow)
1. User chọn sản phẩm → **Add to Cart**.
2. Cart được lưu vào **Data Grid (Redis)**.
3. User thực hiện **Checkout**.
4. **Order PU**:
   - Truy vấn giỏ hàng từ Redis.
   - Gọi **Inventory PU** (hoặc thao tác trực tiếp Redis) để kiểm tra và trừ tồn kho (Stock).
   - Trả kết quả thành công/thất bại ngay lập tức cho User.
5. **Dữ liệu bền vững:** Sau khi flash sale kết thúc hoặc chạy async, dữ liệu mới được đẩy từ RAM xuống Database.

---

### ❖ Kịch bản Test (BẮT BUỘC DEMO)
1. Load danh sách sản phẩm cực nhanh từ Redis.
2. Thêm vào giỏ và Checkout.
3. Kiểm tra Stock giảm ngay lập tức trên Redis.
4. Giả lập nhiều người cùng bấm mua để thấy hệ thống không bị chậm/nghẽn.

---

### ❖ Bonus (Nếu làm nhanh)
1. Sử dụng **Hazelcast** thay cho Redis.
2. Cài đặt cơ chế **Distributed Locking** (như `SETNX` trong Redis) để tránh race condition khi trừ tồn kho.
3. Thêm Message Queue (Kafka/RabbitMQ) để xử lý ghi DB bất đồng bộ.
4. Dùng Postman Runner để Simulate load test.

---

### ❖ Tiêu chí chấm điểm

| Tiêu chí | Điểm |
| :--- | :--- |
| Đúng kiến trúc Space-Based | 3 |
| Không phụ thuộc vào DB khi xử lý request | 2.5 |
| Sử dụng Data Grid (Redis/Hazelcast) đúng cách | 2 |
| Flow xử lý mượt mà, không nghẽn khi tải cao | 1.5 |
| Demo khả năng scale (chạy nhiều PU cùng lúc) | 1 |

---

### ❖ Các giai đoạn tiếp theo (Homework)
- **Dockerize:** Đóng gói toàn bộ Redis và các PU thành container.
- **Docker-compose:** Chạy toàn bộ hệ thống Flash Sale chỉ với một máy.
