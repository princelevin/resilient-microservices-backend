# Setup Guide

## Prerequisites

Install:

- Node.js
- npm
- Docker Desktop
- PostgreSQL client tools

---

## Start PostgreSQL and Redis

From the project root:

```bash
docker compose up -d
```

Check containers:

```bash
docker ps
```

Expected containers:

```text
resilient-postgres
resilient-redis
```

Test Redis:

```bash
docker exec -it resilient-redis redis-cli ping
```

Expected output:

```text
PONG
```

---

## Initialize PostgreSQL Data

Run:

```bash
psql -d resilient_microservices -f product-service/src/db/init.sql
```

Verify:

```bash
psql -d resilient_microservices
```

Inside PostgreSQL:

```sql
SELECT * FROM products;
```

Exit:

```sql
\q
```

---

## Run Product Service

```bash
cd product-service
npm install
npm run dev
```

Runs on:

```text
http://localhost:4001
```

Test:

```http
GET http://localhost:4001/health
GET http://localhost:4001/products
GET http://localhost:4001/products/1
```

---

## Run API Gateway

```bash
cd api-gateway
npm install
npm run dev
```

Runs on:

```text
http://localhost:4000
```

Test:

```http
GET http://localhost:4000/health
GET http://localhost:4000/api/products
GET http://localhost:4000/api/products/1
GET http://localhost:4000/api/orders/health
POST http://localhost:4000/api/orders
GET http://localhost:4000/api/orders/circuit-breaker/payment
```

---

## Run Payment Service

```bash
cd payment-service
npm install
npm run dev
```

Runs on:

```text
http://localhost:4002
```

Test:

```http
GET http://localhost:4002/health
POST http://localhost:4002/payments
```

---

## Run Order Service

```bash
cd order-service
npm install
npm run dev
```

Runs on:

```text
http://localhost:4003
```

Test:

```http
GET http://localhost:4003/health
POST http://localhost:4003/orders
GET http://localhost:4003/circuit-breaker/payment
```

Order Service can also be tested through API Gateway:

```http
GET http://localhost:4000/api/orders/health
POST http://localhost:4000/api/orders
GET http://localhost:4000/api/orders/circuit-breaker/payment

---

## Environment Variables

### API Gateway

```env
PORT=4000
SERVICE_NAME=api-gateway
PRODUCT_SERVICE_URL=http://localhost:4001
ORDER_SERVICE_URL=http://localhost:4003
```

### Product Service

```env
PORT=4001
SERVICE_NAME=product-service

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=resilient_microservices

REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=60
```

### Payment Service

```env
PORT=4002
SERVICE_NAME=payment-service
```

### Order Service

```env
PORT=4003
SERVICE_NAME=order-service
PAYMENT_SERVICE_URL=http://localhost:4002
PAYMENT_TIMEOUT_MS=2000
PAYMENT_MAX_RETRIES=3
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_COOLDOWN_MS=60000
```