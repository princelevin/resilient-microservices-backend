# Architecture Documentation

## Overview

This project is a microservices-based backend system built to understand production-style backend reliability patterns.

The system demonstrates how services communicate, fail, retry, cache data, and protect themselves from slow or unstable dependencies.

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
Auth Service
  ↓
JWT Token
```

---

## Services

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 4000 | Routes product and order requests to backend services |
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

The JWT token will later be used to protect order creation APIs.

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

Currently, token verification is available through the Auth Service. In the next step, the token will be used to protect Order Service APIs through the API Gateway.

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

In progress:

- API Gateway routing for Auth Service
- JWT protection for order APIs