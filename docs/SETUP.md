# Setup Guide

## Prerequisites

Install:

- Node.js
- npm
- Docker Desktop
- PostgreSQL client tools

---

## Logging and Request Tracing

All services use structured JSON logs.

Each request log includes:

- service name
- request ID
- HTTP method
- request path
- status code
- request duration in milliseconds

Example log:

```json
{
  "level": "info",
  "message": "Request completed",
  "service": "api-gateway",
  "requestId": "example-request-id",
  "method": "POST",
  "path": "/api/orders",
  "statusCode": 201,
  "durationMs": 123
}
```

The same `requestId` is forwarded across services to help trace requests.

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

GET http://localhost:4000/api/auth/health
POST http://localhost:4000/api/auth/register
POST http://localhost:4000/api/auth/login
GET http://localhost:4000/api/auth/verify

GET http://localhost:4000/api/orders/health
POST http://localhost:4000/api/orders
GET http://localhost:4000/api/orders/circuit-breaker/payment
```

After each request, check the API Gateway terminal for structured JSON logs.

Expected log fields:

```text
service
requestId
method
path
statusCode
durationMs
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
```

Note: `POST http://localhost:4000/api/orders` requires a valid JWT token.

Check API Gateway, Auth Service, Order Service, and Payment Service terminals to trace the request using the same `requestId`.

---

## Run Auth Service

```bash
cd auth-service
npm install
npm run dev
```

Runs on:

```text
http://localhost:4004
```

Test:

```http
GET http://localhost:4004/health
POST http://localhost:4004/auth/register
POST http://localhost:4004/auth/login
GET http://localhost:4004/auth/verify
GET http://localhost:4004/auth/users
```

For token verification, add this header:

```text
Authorization: Bearer <jwt-token>
```

---

## Test Protected Order Flow

### 1. Register through API Gateway

```http
POST http://localhost:4000/api/auth/register
```

Body:

```json
{
  "name": "Prince Levin",
  "email": "prince@example.com",
  "password": "Password@123"
}
```

### 2. Login through API Gateway

```http
POST http://localhost:4000/api/auth/login
```

Body:

```json
{
  "email": "prince@example.com",
  "password": "Password@123"
}
```

Copy the token from the response.

### 3. Create order without token

```http
POST http://localhost:4000/api/orders
```

Expected response:

```text
401 Unauthorized
Authorization token is missing
```

### 4. Create order with token

```http
POST http://localhost:4000/api/orders
```

Header:

```text
Authorization: Bearer <jwt-token>
```

Body:

```json
{
  "productId": 1,
  "quantity": 1,
  "amount": 1299,
  "paymentMode": "success"
}
```

Expected result:

```text
Order created successfully
orderStatus: CONFIRMED
```

---

## Test Structured Logging

### 1. Test API Gateway logging

```http
GET http://localhost:4000/health
```

Check the API Gateway terminal.

Expected log should include:

```text
service
requestId
method
path
statusCode
durationMs
```

---

### 2. Test Product Service tracing

```http
GET http://localhost:4000/api/products
```

Check both terminals:

```text
API Gateway terminal
Product Service terminal
```

Both logs should contain the same `requestId`.

---

### 3. Test Auth Service tracing

```http
POST http://localhost:4000/api/auth/login
```

Body:

```json
{
  "email": "prince@example.com",
  "password": "Password@123"
}
```

Check both terminals:

```text
API Gateway terminal
Auth Service terminal
```

Both logs should contain the same `requestId`.

---

### 4. Test protected order tracing

```http
POST http://localhost:4000/api/orders
```

Header:

```text
Authorization: Bearer <jwt-token>
```

Body:

```json
{
  "productId": 1,
  "quantity": 1,
  "amount": 1299,
  "paymentMode": "success"
}
```

Check these terminals:

```text
API Gateway terminal
Auth Service terminal
Order Service terminal
Payment Service terminal
```

The same `requestId` should appear across the request flow.

---

## Environment Variables

### API Gateway

```env
PORT=4000
SERVICE_NAME=api-gateway
PRODUCT_SERVICE_URL=http://localhost:4001
ORDER_SERVICE_URL=http://localhost:4003
AUTH_SERVICE_URL=http://localhost:4004
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

### Auth Service

```env
PORT=4004
SERVICE_NAME=auth-service
JWT_SECRET=super-secret-jwt-key-change-later
JWT_EXPIRES_IN=1h
```