# Buổi 3 — Architecture Styles: Layered vs Microkernel
## Hệ thống: Plugin-based CMS

---

## 1. Layered Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│        Web UI  │  REST API  │  Admin Panel              │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   BUSINESS LOGIC LAYER                   │
│  Content Service │ User Service │ Media Service          │
│  Template Engine │ SEO Service  │ Search Service         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  PERSISTENCE LAYER                       │
│    Content Repository │ User Repository │ Media Repo     │
│    Query Builder      │ ORM / DAO                        │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   DATABASE LAYER                         │
│        PostgreSQL  │  Redis Cache  │  File Storage       │
└─────────────────────────────────────────────────────────┘

Cross-cutting: [Authentication] [Logging] [Error Handling]
```

**Luồng dữ liệu:** Request đi từ trên xuống, Response từ dưới lên. Mỗi layer chỉ giao tiếp với layer liền kề.

---

## 2. Microkernel Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      CORE SYSTEM                         │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │           Plugin Registry & Loader               │   │
│   ├──────────────────────────────────────────────────┤   │
│   │  Content Engine │ User Auth │ Template Renderer  │   │
│   ├──────────────────────────────────────────────────┤   │
│   │           Plugin API / Extension Points          │   │
│   └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
          │           │           │           │
          ▼           ▼           ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ SEO      │ │ E-com    │ │ Gallery  │ │ Comment  │
   │ Plugin   │ │ Plugin   │ │ Plugin   │ │ Plugin   │
   └──────────┘ └──────────┘ └──────────┘ └──────────┘
          │           │           │           │
          ▼           ▼           ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Analytics│ │ Payment  │ │ CDN      │ │ Spam     │
   │ Plugin   │ │ Plugin   │ │ Plugin   │ │ Filter   │
   └──────────┘ └──────────┘ └──────────┘ └──────────┘

Plugin API: register(), activate(), deactivate(), getHooks()
```

**Cách hoạt động:** Core system cung cấp lifecycle hooks. Plugin đăng ký handler vào các hook (before_save, after_publish, on_render). Core không biết về plugin cụ thể.

---

## 3. Style Trade-off Comparison

| Tiêu chí | Layered Architecture | Microkernel Architecture |
|---|---|---|
| **Extensibility** | Thấp — thêm feature cần sửa nhiều layer | Cao — thêm plugin không sửa core |
| **Simplicity** | Cao — dễ hiểu, quen thuộc | Trung bình — cần thiết kế Plugin API |
| **Testability** | Cao — test từng layer độc lập | Trung bình — khó mock plugin registry |
| **Performance** | Trung bình — overhead qua các layer | Cao — core nhẹ, plugin load khi cần |
| **Deployability** | Đơn giản — deploy 1 unit | Phức tạp — quản lý plugin versions |
| **Fault isolation** | Thấp — lỗi 1 layer ảnh hưởng toàn bộ | Cao — plugin crash không crash core |
| **Coupling** | Tight (layer dependency) | Loose (plugin API contract) |
| **Plugin ecosystem** | Không hỗ trợ | Thiết kế sẵn cho ecosystem |

---

## 4. Lựa chọn: Microkernel cho Plugin-based CMS

**Microkernel phù hợp hơn vì:**

1. **Core use case là extensibility:** CMS được thiết kế để third-party developer viết plugin. Layered architecture không có extension point tự nhiên.

2. **Fault isolation:** Plugin SEO bị lỗi không crash toàn bộ CMS. Core vẫn hoạt động.

3. **Independent deployment:** Plugin có thể update độc lập mà không cần redeploy toàn bộ hệ thống.

4. **Real-world precedent:** WordPress (PHP), Eclipse (Java), VS Code (Electron) đều dùng Microkernel.

**Trade-off chấp nhận được:** Plugin API design phức tạp hơn ban đầu, nhưng đây là investment cho long-term extensibility — phù hợp với bản chất của CMS.
