# XLSX B6 — Microservice P1: Ecommerce System

## Architecture Diagram

```
                        CLIENT
                          │
                          ▼
              ┌───────────────────────┐
              │      API GATEWAY      │  :8080
              │  (single entry point) │
              └───────────┬───────────┘
                          │  REST (proxy)
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │   PRODUCT    │ │   CUSTOMER   │ │    ORDER     │
  │   SERVICE    │ │   SERVICE    │ │   SERVICE    │
  │   :8081      │ │   :8082      │ │   :8083      │
  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
         │                │                │
         ▼                ▼                │ validates via REST
    [products.db]   [customers.db]         ├────► product-service
                                           └────► customer-service
                                                  [orders.db]
```

## Service Communication

| From         | To               | Protocol | Purpose                              |
|--------------|------------------|----------|--------------------------------------|
| Client       | API Gateway      | HTTP     | All client requests                  |
| API Gateway  | Product Service  | HTTP     | Proxy /api/products/*                |
| API Gateway  | Customer Service | HTTP     | Proxy /api/customers/*               |
| API Gateway  | Order Service    | HTTP     | Proxy /api/orders/*                  |
| Order Service| Customer Service | HTTP     | Validate customer_id exists          |
| Order Service| Product Service  | HTTP     | Validate product_id, get price/stock |

## Endpoints

### API Gateway (port 8080)
| Method | Path | Proxies to |
|--------|------|-----------|
| ANY | /api/products/* | product-service |
| ANY | /api/customers/* | customer-service |
| ANY | /api/orders/* | order-service |
| GET | /health | gateway health + upstream status |

### Product Service (port 8081)
| Method | Path | Description |
|--------|------|-------------|
| GET | /products | List all products |
| GET | /products/:id | Get product by id |
| POST | /products | Create product |
| PUT | /products/:id | Update product |
| DELETE | /products/:id | Delete product |

### Customer Service (port 8082)
| Method | Path | Description |
|--------|------|-------------|
| GET | /customers | List all customers |
| GET | /customers/:id | Get customer by id |
| POST | /customers | Create customer |
| PUT | /customers/:id | Update customer |
| DELETE | /customers/:id | Delete customer |

### Order Service (port 8083)
| Method | Path | Description |
|--------|------|-------------|
| GET | /orders | List all orders |
| GET | /orders/:id | Get order by id |
| POST | /orders | Create order (validates customer + product) |
| PATCH | /orders/:id/status | Update order status |

## Run

```bash
# Build & start all services
docker-compose up --build

# Check lab
npm install && npm run check
```

## Key Design Decisions

- **Separate DB per service** — each service owns its data, no shared DB
- **API Gateway** — single entry point, clients never call services directly
- **Synchronous REST** — Order Service validates by calling Customer/Product at order creation time
- **Data denormalization in orders** — customer_name and product_name are stored in the order row to avoid join-across-services queries
