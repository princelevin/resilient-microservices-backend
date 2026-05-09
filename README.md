# Resilient Microservices Backend System

A backend engineering project that demonstrates how microservices behave when services become slow, fail, retry, depend on databases, or use caches.

This project focuses on practical backend reliability patterns used in production systems, including API Gateway routing, PostgreSQL integration, Redis caching, timeout handling, retry with exponential backoff, and circuit breaker behavior.

---

## Architecture Overview

```text
Client
  ↓
API Gateway
  ↓
Product Service
  ↓
Redis Cache
  ↓
PostgreSQL

Client
  ↓
API Gateway
  ↓
Order Service
  ↓
Payment Service

Client
  ↓
Auth Service
  ↓
JWT Token
```

The Product Service is accessed through the API Gateway.

The Order Service is accessed through the API Gateway and calls the Payment Service while handling downstream payment failures using timeout, retry, exponential backoff, and circuit breaker logic.

Circuit breaker behavior is implemented to stop repeated calls to Payment Service when it is failing continuously.

The Auth Service supports user registration, login, JWT token generation, and token verification.

---

## Features

- API Gateway as the entry point for product APIs
- Product Service with PostgreSQL-backed product data
- Redis cache-aside pattern for product reads
- Payment Mock Service with success, failure, slow, and random behavior
- Order Service calling Payment Service
- Timeout handling for slow downstream services
- Retry with exponential backoff
- Circuit breaker pattern for Payment Service calls
- Request ID tracing across services
- Docker-based PostgreSQL and Redis setup
- API Gateway routing for Order Service APIs
- Auth Service with JWT-based authentication
- User registration and login
- JWT token generation and verification
- Password hashing using bcrypt

---

## Tech Stack

- Node.js
- Express.js
- REST APIs
- PostgreSQL
- Redis
- Docker
- Axios
- Morgan
- dotenv
- UUID
- pg
- redis
- JWT
- bcryptjs
- jsonwebtoken

---

## Services

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 4000 | Routes product and order requests to backend services |
| Product Service | 4001 | Manages product APIs and product data |
| Payment Service | 4002 | Simulates payment provider behavior |
| Order Service | 4003 | Creates orders and calls Payment Service |
| Auth Service | 4004 | Handles user registration, login, and JWT verification |
| PostgreSQL | 5432 | Stores product data |
| Redis | 6379 | Caches product reads |

---

## Current Status

### Completed

- API Gateway setup
- Product Service setup
- API Gateway to Product Service routing
- PostgreSQL integration for product data
- Redis caching for product reads
- Cache HIT/MISS handling
- Payment Mock Service
- Payment success, failure, slow, and random simulation
- Order Service setup
- Order creation endpoint
- Payment Service client
- Timeout handling
- Retry with exponential backoff
- Controlled payment failure response
- Request ID tracing
- Circuit breaker pattern for Payment Service calls
- Circuit OPEN state for repeated payment failures
- Circuit HALF_OPEN recovery after cooldown
- Circuit CLOSED state after successful recovery
- API Gateway routing for Order Service
- Order creation through API Gateway
- Circuit breaker status access through API Gateway
- Auth Service setup
- User registration endpoint
- User login endpoint
- JWT token generation
- JWT token verification endpoint
- Password hashing with bcrypt

### In Progress

- API Gateway routing for Auth Service

### Next Steps

- Add API Gateway routing for Auth Service
- Protect Order APIs using JWT
- Add structured logging
- Add architecture diagram
- Add full Docker Compose support for running all services together

---

## Quick Start

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Run Product Service:

```bash
cd product-service
npm install
npm run dev
```

Run API Gateway:

```bash
cd api-gateway
npm install
npm run dev
```

Run Payment Service:

```bash
cd payment-service
npm install
npm run dev
```

Run Order Service:

```bash
cd order-service
npm install
npm run dev
```

Run Auth Service:

```bash
cd auth-service
npm install
npm run dev
```

---

## Important Endpoints

### API Gateway

```http
GET http://localhost:4000/health
GET http://localhost:4000/api/products
GET http://localhost:4000/api/products/1
GET http://localhost:4000/api/orders/health
POST http://localhost:4000/api/orders
GET http://localhost:4000/api/orders/circuit-breaker/payment
```

### Product Service

```http
GET http://localhost:4001/health
GET http://localhost:4001/products
GET http://localhost:4001/products/1
DELETE http://localhost:4001/cache
```

### Payment Service

```http
GET http://localhost:4002/health
POST http://localhost:4002/payments
```

Example payment request:

```json
{
  "orderId": "ORD-1001",
  "amount": 1299,
  "mode": "success"
}
```

Supported payment modes:

```text
success
failure
slow
random
```

### Order Service

```http
GET http://localhost:4003/health
POST http://localhost:4003/orders
GET http://localhost:4003/circuit-breaker/payment
```

Example order request:

```json
{
  "productId": 1,
  "quantity": 1,
  "amount": 1299,
  "paymentMode": "success"
}
```

Supported payment modes:

```text
success
failure
slow
random
```

### Auth Service

```http
GET http://localhost:4004/health
POST http://localhost:4004/auth/register
POST http://localhost:4004/auth/login
GET http://localhost:4004/auth/verify
GET http://localhost:4004/auth/users
```

Example register request:

```json
{
  "name": "Prince Levin",
  "email": "prince@example.com",
  "password": "Password@123"
}
```

Example login request:

```json
{
  "email": "prince@example.com",
  "password": "Password@123"
}
```

Verify token request header:

```text
Authorization: Bearer <jwt-token>
```

---

## Reliability Patterns Implemented

### Cache-Aside Pattern

The Product Service checks Redis before reading from PostgreSQL.

```text
Request
  ↓
Check Redis
  ↓
Cache HIT → return cached data
  ↓
Cache MISS → read PostgreSQL
  ↓
Store result in Redis
  ↓
Return response
```

### Timeout Handling

The Order Service does not wait forever for Payment Service.

If Payment Service is too slow, the request times out.

### Retry with Exponential Backoff

The Order Service retries failed payment calls with increasing delay.

```text
Attempt 1 fails
  ↓
Wait 500ms
  ↓
Attempt 2 fails
  ↓
Wait 1000ms
  ↓
Attempt 3 fails
  ↓
Return controlled failure response
```

### Circuit Breaker Pattern

Circuit breaker behavior is implemented for Payment Service calls.

```text
CLOSED
  ↓
Normal calls allowed

OPEN
  ↓
Calls blocked temporarily after repeated failures

HALF_OPEN
  ↓
One test call allowed after cooldown
```

### JWT Authentication

The Auth Service allows users to register, login, and receive a JWT token.

```text
Register User
  ↓
Hash Password
  ↓
Login User
  ↓
Generate JWT Token
  ↓
Verify JWT Token
```

The JWT token will be used later to protect order creation APIs.

---

## Project Structure

```text
resilient-microservices-backend
│
├── api-gateway
│   ├── src
│   │   └── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── product-service
│   ├── src
│   │   ├── db
│   │   │   ├── pool.js
│   │   │   ├── redis.js
│   │   │   └── init.sql
│   │   └── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── payment-service
│   ├── src
│   │   └── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── order-service
│   ├── src
│   │   ├── clients
│   │   │   └── paymentClient.js
│   │   ├── resilience
│   │   │   └── circuitBreaker.js
│   │   └── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── auth-service
│   ├── src
│   │   ├── middleware
│   │   │   └── authMiddleware.js
│   │   └── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── docs
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── SETUP.md
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## Documentation

Detailed documentation is available in the `docs` folder:

- `docs/ARCHITECTURE.md` — system architecture and design decisions
- `docs/API.md` — endpoints and sample requests/responses
- `docs/SETUP.md` — setup and local running instructions

---

## Why This Project Matters

In real-world backend systems, building an API is only the first step.

Production systems must handle:

- Slow services
- Failed services
- Network latency
- Database bottlenecks
- Retry storms
- Cache consistency
- Observability issues
- Debugging across multiple services

This project explores those problems practically through a microservices-based backend system.

---

## Author

Built by Prince Levin as a backend engineering and microservices reliability project.