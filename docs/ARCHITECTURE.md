# Architecture Documentation

## Overview

This project is a microservices-based backend system built to understand production-style backend reliability patterns.

The system demonstrates how services communicate, fail, retry, cache data, protect themselves from slow or unstable dependencies, and expose structured logs for request tracing across services.

---

## Current Architecture

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
API Gateway
  ↓
Auth Service
  ↓
JWT Token

All Services
  ↓
Structured JSON Logs
  ↓
RequestId-based Tracing
```

---

## Services

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 4000 | Routes product, order, and auth requests to backend services |
| Product Service | 4001 | Handles product APIs and product data |
| Payment Service | 4002 | Simulates payment provider behavior |
| Order Service | 4003 | Creates orders and calls Payment Service |
| Auth Service | 4004 | Handles user registration, login, JWT generation, and token verification |
| PostgreSQL | 5432 | Stores product data |
| Redis | 6379 | Caches product reads |

---

## Product Flow

```text
Client
  ↓
API Gateway
  ↓
Product Service
  ↓
Redis
  ↓
PostgreSQL
```

The Product Service uses the cache-aside pattern.

If product data exists in Redis, it returns cached data.

If data is missing in Redis, it reads from PostgreSQL and stores the result in Redis.

---

## Order and Payment Flow

```text
Client
  ↓
API Gateway
  ↓
Order Service
  ↓
Payment Service
```

The client sends order requests to the API Gateway. The API Gateway forwards those requests to the Order Service, and the Order Service calls the Payment Service.

The Payment Service can simulate:

- Successful payment
- Failed payment
- Slow payment
- Random payment failure

---

## Auth Flow

```text
Client
  ↓
API Gateway
  ↓
Auth Service
  ↓
JWT Token
```

The Auth Service handles user registration, login, password hashing, JWT token generation, and JWT verification.

Current Auth Service behavior:

- Register user
- Hash password using bcrypt
- Login user
- Generate JWT token
- Verify JWT token

The JWT token is used by the API Gateway to protect order creation APIs.

---

## Observability Flow

```text
Client Request
  ↓
API Gateway generates or forwards requestId
  ↓
Request moves across backend services
  ↓
Each service logs request details in JSON format
  ↓
Same requestId helps trace the request across services
```

Each service logs structured request information such as:

- Service name
- Request ID
- HTTP method
- Request path
- Status code
- Request duration in milliseconds

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

This helps debug requests across API Gateway, Product Service, Auth Service, Order Service, and Payment Service.

---

## Reliability Patterns

### Cache-Aside Pattern

```text
Request
  ↓
Check Redis
  ↓
Cache HIT → return cached data
  ↓
Cache MISS → read from PostgreSQL
  ↓
Store in Redis
  ↓
Return response
```

### Timeout Handling

The Order Service does not wait forever for the Payment Service.

If the Payment Service takes too long, the request times out.

### Retry with Exponential Backoff

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

Circuit breaker is implemented for Payment Service calls from the Order Service.

Implemented states:

```text
CLOSED     → normal calls allowed
OPEN       → calls blocked after repeated failures
HALF_OPEN  → one test call allowed after cooldown
```

### JWT Authentication

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

The Auth Service uses JWT-based authentication.

JWT verification is used by the API Gateway to protect order creation APIs.

Requests without a valid token are rejected before reaching the Order Service.

### Structured Logging and Request Tracing

```text
Request starts
  ↓
requestId is created or forwarded
  ↓
Service processes request
  ↓
Structured JSON log is written
  ↓
requestId is used to trace the same request across services
```

Structured logging is implemented across the API Gateway, Product Service, Auth Service, Order Service, and Payment Service.

Each request log includes:

- `service`
- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`

---

## Current Implementation Status

Completed:

- API Gateway
- Product Service
- PostgreSQL integration
- Redis caching
- Payment Mock Service
- Order Service
- Timeout handling
- Retry with exponential backoff
- Circuit breaker behavior for Payment Service calls
- API Gateway routing for Order Service
- Auth Service
- User registration
- User login
- JWT token generation
- JWT token verification
- API Gateway routing for Auth Service
- JWT-protected order creation
- Unauthorized order requests blocked without token
- Structured JSON logging across services
- Request duration tracking
- Request ID based tracing across API Gateway, Product Service, Auth Service, Order Service, and Payment Service

In progress:

- Full Docker Compose support for running all services together