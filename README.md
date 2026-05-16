# Resilient Microservices Backend System

A production-style backend engineering project that demonstrates how distributed microservices handle routing, authentication, caching, service failures, retries, circuit breaking, and request tracing.

The system is built with Node.js, Express.js, PostgreSQL, Redis, Docker Compose, JWT authentication, and structured JSON logging.

---

## Overview

This project simulates a real-world microservices backend where multiple services communicate through an API Gateway.

It demonstrates backend reliability and observability patterns such as:

- API Gateway based routing
- JWT authentication and protected APIs
- PostgreSQL-backed product data
- Redis cache-aside pattern
- Timeout handling
- Retry with exponential backoff
- Circuit breaker pattern
- Request ID propagation across services
- Structured JSON logging
- Docker Compose based local orchestration

---

## Architecture

```text
Client
  ↓
API Gateway
  ├── Product Service → Redis → PostgreSQL
  ├── Auth Service → JWT Token
  └── Order Service → Payment Service
```

The API Gateway is the main entry point for client requests.

Product APIs are routed to the Product Service.  
Auth APIs are routed to the Auth Service.  
Order APIs are protected using JWT and routed to the Order Service.  
The Order Service calls the Payment Service and handles payment failures using timeout, retry, and circuit breaker logic.

---

## Services

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 4000 | Routes product, auth, and order requests |
| Product Service | 4001 | Serves product data using PostgreSQL and Redis |
| Payment Service | 4002 | Simulates payment success, failure, slow, and random behavior |
| Order Service | 4003 | Creates orders and calls Payment Service |
| Auth Service | 4004 | Handles registration, login, JWT generation, and token verification |
| PostgreSQL | 5432 | Stores product data |
| Redis | 6379 | Caches product reads |

---

## Key Features

### API Gateway

- Single entry point for clients
- Routes requests to Product, Auth, and Order services
- Protects order creation using JWT verification
- Forwards request IDs to downstream services

### Product Service

- PostgreSQL-backed product APIs
- Redis cache-aside implementation
- Cache HIT / MISS behavior
- Product lookup by ID

### Auth Service

- User registration
- Password hashing with bcrypt
- User login
- JWT token generation
- JWT token verification

### Order and Payment Flow

- JWT-protected order creation
- Payment Service integration
- Timeout handling for slow downstream calls
- Retry with exponential backoff
- Circuit breaker to stop repeated failing payment calls

### Observability

- Structured JSON logging across services
- Request duration tracking
- Shared `requestId` across API Gateway and backend services
- Easier tracing of one request across multiple services

---

## Tech Stack

- Node.js
- Express.js
- REST APIs
- PostgreSQL
- Redis
- Docker
- Docker Compose
- JWT
- bcryptjs
- Axios
- Morgan
- dotenv
- UUID
- Structured JSON Logging

---

## Run Locally with Docker Compose

Start the full system:

```bash
docker compose up --build
```

Run in detached mode:

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

If you need to reset PostgreSQL and Redis volumes:

```bash
docker compose down -v
docker compose up --build
```

---

## Main API Endpoints

### API Gateway

```http
GET  http://localhost:4000/health
GET  http://localhost:4000/api/products
GET  http://localhost:4000/api/products/1

POST http://localhost:4000/api/auth/register
POST http://localhost:4000/api/auth/login
GET  http://localhost:4000/api/auth/verify

GET  http://localhost:4000/api/orders/health
POST http://localhost:4000/api/orders
GET  http://localhost:4000/api/orders/circuit-breaker/payment
```

`POST /api/orders` is protected and requires a JWT token:

```text
Authorization: Bearer <jwt-token>
```

---

## Example Workflow

### 1. Register user

```http
POST http://localhost:4000/api/auth/register
```

```json
{
  "name": "Prince Levin",
  "email": "prince@example.com",
  "password": "Password@123"
}
```

### 2. Login and get JWT token

```http
POST http://localhost:4000/api/auth/login
```

```json
{
  "email": "prince@example.com",
  "password": "Password@123"
}
```

### 3. Create protected order

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

---

## Reliability Patterns Demonstrated

### Cache-Aside Pattern

```text
Request
  ↓
Check Redis
  ↓
Cache HIT → return cached product data
  ↓
Cache MISS → read PostgreSQL → store in Redis → return response
```

### Retry with Exponential Backoff

```text
Payment call fails
  ↓
Wait and retry
  ↓
Retry again with increased delay
  ↓
Return controlled failure if all attempts fail
```

### Circuit Breaker

```text
CLOSED     → normal calls allowed
OPEN       → payment calls blocked after repeated failures
HALF_OPEN  → one test request allowed after cooldown
```

### Request Tracing

Each request is assigned a `requestId`, which is forwarded across services.

Example structured log:

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

---

## Project Structure

```text
resilient-microservices-backend
│
├── api-gateway
├── product-service
├── payment-service
├── order-service
├── auth-service
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

Detailed service-level structure and setup instructions are available in the `docs` folder.

---

## Documentation

- `docs/ARCHITECTURE.md` — system architecture and reliability design
- `docs/API.md` — API endpoints, request bodies, and sample responses
- `docs/SETUP.md` — local setup, Docker Compose, and testing instructions

---

## What This Project Demonstrates

This project is designed to show practical backend engineering skills beyond basic CRUD APIs.

It demonstrates experience with:

- Designing microservices
- Building API Gateway based routing
- Securing APIs with JWT
- Handling downstream service failures
- Implementing retry and circuit breaker patterns
- Using Redis for caching
- Working with PostgreSQL
- Running services with Docker Compose
- Adding structured logs and request tracing
- Debugging distributed backend flows

---

## Author

Built by Prince Levin as a backend engineering and microservices reliability project.