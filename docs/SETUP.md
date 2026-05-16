# Setup Guide

This guide explains how to run the Resilient Microservices Backend System locally using Docker Compose.

The recommended setup is Docker Compose because it starts all services, PostgreSQL, and Redis together.

---

## Prerequisites

Install:

- Docker Desktop
- Node.js
- npm

Make sure Docker Desktop is running before starting the system.

---

## Run the Full System

From the project root:

```bash
docker compose up --build
```

To run in detached mode:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker ps
```

Expected containers:

```text
api-gateway
product-service
payment-service
order-service
auth-service
resilient-postgres
resilient-redis
```

Stop the system:

```bash
docker compose down
```

Reset PostgreSQL and Redis volumes:

```bash
docker compose down -v
docker compose up --build
```

Use this when you want PostgreSQL to re-run the initial SQL script.

---

## Service URLs

| Service | URL |
|---|---|
| API Gateway | `http://localhost:4000` |
| Product Service | `http://localhost:4001` |
| Payment Service | `http://localhost:4002` |
| Order Service | `http://localhost:4003` |
| Auth Service | `http://localhost:4004` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

The preferred client-facing entry point is the API Gateway:

```text
http://localhost:4000
```

---

## Docker Compose Service Communication

Inside Docker Compose, services communicate using container service names instead of `localhost`.

Examples:

```text
API Gateway → http://product-service:4001
API Gateway → http://auth-service:4004
API Gateway → http://order-service:4003
Order Service → http://payment-service:4002
Product Service → postgres:5432
Product Service → redis:6379
```

---

## Test API Gateway

```http
GET http://localhost:4000/health
```

Expected result:

```text
API Gateway should return healthy status.
```

---

## Test Product Flow

```http
GET http://localhost:4000/api/products
```

Expected result:

```text
API Gateway routes request to Product Service.
Product Service reads from Redis or PostgreSQL.
```

Send the same request again to verify cache behavior:

```text
First request  → cache MISS
Second request → cache HIT
```

---

## Test Auth Flow

### Register User

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

### Login User

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

Copy the JWT token from:

```text
data.token
```

### Verify Token

```http
GET http://localhost:4000/api/auth/verify
```

Header:

```text
Authorization: Bearer <jwt-token>
```

---

## Test Protected Order Flow

### Create Order Without Token

```http
POST http://localhost:4000/api/orders
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
401 Unauthorized
Authorization token is missing
```

### Create Order With Token

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
orderStatus: CONFIRMED
```

---

## Test Payment Failure Flow

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
  "productId": 2,
  "quantity": 1,
  "amount": 899,
  "paymentMode": "failure"
}
```

Expected result:

```text
orderStatus: PAYMENT_FAILED
```

---

## Test Circuit Breaker Status

```http
GET http://localhost:4000/api/orders/circuit-breaker/payment
```

Expected result:

```text
Circuit breaker status should be returned from Order Service.
```

Possible states:

```text
CLOSED
OPEN
HALF_OPEN
```

---

## Test Redis

Check Redis container:

```bash
docker exec -it resilient-redis redis-cli ping
```

Expected output:

```text
PONG
```

---

## Test PostgreSQL

Open PostgreSQL inside the container:

```bash
docker exec -it resilient-postgres psql -U postgres -d resilient_microservices
```

Check products:

```sql
SELECT * FROM products;
```

Exit:

```sql
\q
```

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

For a protected order request, check logs in:

```text
API Gateway
Auth Service
Order Service
Payment Service
```

The same `requestId` should appear across the request flow.

---

## Environment Variables Used by Docker Compose

### API Gateway

```env
PORT=4000
SERVICE_NAME=api-gateway
PRODUCT_SERVICE_URL=http://product-service:4001
ORDER_SERVICE_URL=http://order-service:4003
AUTH_SERVICE_URL=http://auth-service:4004
```

### Product Service

```env
PORT=4001
SERVICE_NAME=product-service
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=resilient_microservices
REDIS_URL=redis://redis:6379
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
PAYMENT_SERVICE_URL=http://payment-service:4002
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

---

## Common Troubleshooting

### Docker daemon is not running

Start Docker Desktop and run:

```bash
docker ps
```

### Products table is missing

Reset volumes and rebuild:

```bash
docker compose down -v
docker compose up --build
```

### Redis connection error

Check Redis:

```bash
docker exec -it resilient-redis redis-cli ping
```

Expected:

```text
PONG
```

### JWT token expired

Login again and use a fresh token:

```http
POST http://localhost:4000/api/auth/login
```

---

## Manual Local Development

Docker Compose is the recommended setup.

For manual development, each service can still be run separately:

```bash
cd api-gateway
npm install
npm run dev
```

Repeat the same process for:

```text
product-service
payment-service
order-service
auth-service
```

When running manually, use `localhost` URLs in each service `.env` file.