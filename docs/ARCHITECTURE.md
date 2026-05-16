# Architecture Documentation

This document explains the architecture, service responsibilities, request flows, and reliability patterns used in the Resilient Microservices Backend System.

---

## System Overview

The project is a Docker Compose based microservices backend system.

It is designed to demonstrate how production-style backend services handle:

- API Gateway routing
- Service-to-service communication
- JWT authentication
- PostgreSQL data persistence
- Redis caching
- Payment service failures
- Timeout handling
- Retry with exponential backoff
- Circuit breaker behavior
- Request tracing
- Structured JSON logging

---

## High-Level Architecture

```text
Client
  ↓
API Gateway
  ├── Product Service
  │     ├── Redis Cache
  │     └── PostgreSQL
  │
  ├── Auth Service
  │     └── JWT Token Generation / Verification
  │
  └── Order Service
        └── Payment Service
```

The API Gateway is the only preferred client-facing entry point.

Internal services can be tested directly during development, but client requests should go through the API Gateway.

---

## Services

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 4000 | Routes client requests to backend services |
| Product Service | 4001 | Handles product APIs, PostgreSQL access, and Redis caching |
| Payment Service | 4002 | Simulates external payment provider behavior |
| Order Service | 4003 | Creates orders and calls Payment Service |
| Auth Service | 4004 | Handles registration, login, JWT generation, and token verification |
| PostgreSQL | 5432 | Stores product data |
| Redis | 6379 | Caches product reads |

---

## Request Flow: Product APIs

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
```

The Product Service follows the cache-aside pattern.

Flow:

```text
Request product data
  ↓
Check Redis
  ↓
Cache HIT → return cached data
  ↓
Cache MISS → read from PostgreSQL
  ↓
Store result in Redis
  ↓
Return response
```

This reduces repeated database reads and demonstrates how caching is commonly added to backend services.

---

## Request Flow: Authentication

```text
Client
  ↓
API Gateway
  ↓
Auth Service
  ↓
JWT Token
```

The Auth Service is responsible for:

- User registration
- Password hashing using bcrypt
- User login
- JWT token generation
- JWT token verification

The API Gateway forwards authentication requests to the Auth Service.

---

## Request Flow: Protected Order Creation

```text
Client with JWT Token
  ↓
API Gateway
  ↓
Verify JWT with Auth Service
  ↓
Order Service
  ↓
Payment Service
```

Order creation is protected using JWT.

If the request does not contain a valid token, the API Gateway rejects it before it reaches the Order Service.

If the token is valid, the API Gateway forwards the request to the Order Service.

---

## Payment Reliability Flow

```text
Order Service
  ↓
Payment Service
  ↓
Success / Failure / Slow Response / Random Failure
```

The Payment Service simulates different downstream behaviors:

- Successful payment
- Failed payment
- Slow payment response
- Random payment result

The Order Service handles these scenarios using timeout, retry, and circuit breaker logic.

---

## Reliability Patterns

### Timeout Handling

The Order Service does not wait indefinitely for the Payment Service.

If the Payment Service takes too long, the request is timed out and handled as a controlled failure.

---

### Retry with Exponential Backoff

When a payment call fails, the Order Service retries the request with increasing delay.

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

This prevents immediate failure while also avoiding aggressive retry storms.

---

### Circuit Breaker

The circuit breaker protects the system from repeatedly calling an unhealthy Payment Service.

```text
CLOSED
  ↓
Normal requests are allowed

OPEN
  ↓
Requests are blocked temporarily after repeated failures

HALF_OPEN
  ↓
One test request is allowed after cooldown
```

If the test request succeeds, the circuit returns to `CLOSED`.

If it fails, the circuit moves back to `OPEN`.

---

## Observability and Request Tracing

Every incoming request receives a `requestId`.

The same `requestId` is forwarded across services so that one request can be traced through the system.

Example:

```text
Client Request
  ↓
API Gateway creates requestId
  ↓
Product/Auth/Order Service receives same requestId
  ↓
Downstream service logs same requestId
```

Each service logs requests in structured JSON format.

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

Each request log includes:

- `service`
- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`

This makes debugging easier across API Gateway, Product Service, Auth Service, Order Service, and Payment Service.

---

## Docker Compose Architecture

All services can be started together using Docker Compose.

```text
docker-compose.yml
  ├── api-gateway
  ├── product-service
  ├── payment-service
  ├── order-service
  ├── auth-service
  ├── postgres
  └── redis
```

Inside Docker Compose, services communicate using container service names instead of localhost.

Examples:

```text
API Gateway → http://product-service:4001
API Gateway → http://auth-service:4004
API Gateway → http://order-service:4003
Order Service → http://payment-service:4002
Product Service → postgres:5432
Product Service → redis:6379
```

This allows the full backend system to run with one command:

```bash
docker compose up --build
```

---

## Design Decisions

### API Gateway as Entry Point

The API Gateway keeps client access simple and centralizes routing, authentication checks, and request tracing.

### Redis Cache-Aside Pattern

Redis is used to reduce repeated PostgreSQL reads for product data.

### JWT Protection at Gateway Level

The API Gateway verifies JWT tokens before forwarding protected order requests.

This prevents unauthorized requests from reaching the Order Service.

### Payment Failure Simulation

The Payment Service intentionally simulates slow, failed, and random responses so reliability patterns can be tested locally.

### Structured Logging

Structured JSON logs make the system easier to debug and closer to production logging practices.

---

## Current System Capabilities

The system currently supports:

- Running all services through Docker Compose
- Product APIs through API Gateway
- PostgreSQL product storage
- Redis product caching
- User registration and login
- JWT token generation and verification
- JWT-protected order creation
- Payment success and failure simulation
- Timeout handling
- Retry with exponential backoff
- Circuit breaker behavior
- Request tracing with request IDs
- Structured JSON logs across services

---

## Related Documentation

- `docs/API.md` — API endpoints and sample requests
- `docs/SETUP.md` — setup, Docker Compose, and testing instructions
- `README.md` — project overview and recruiter-friendly summary