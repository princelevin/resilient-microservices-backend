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
Order Service
  ↓
Payment Service
```

---

## Services

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 4000 | Routes client requests to backend services |
| Product Service | 4001 | Handles product APIs and product data |
| Payment Service | 4002 | Simulates payment provider behavior |
| Order Service | 4003 | Creates orders and calls Payment Service |
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
Order Service
  ↓
Payment Service
```

The Order Service creates mock orders and calls the Payment Service.

The Payment Service can simulate:

- Successful payment
- Failed payment
- Slow payment
- Random payment failure

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

Expected states:

```text
CLOSED     → normal calls allowed
OPEN       → calls blocked after repeated failures
HALF_OPEN  → one test call allowed after cooldown
```

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

In progress:

- Circuit breaker behavior for Payment Service calls