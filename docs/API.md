# API Documentation

This document describes the main API endpoints exposed by the Resilient Microservices Backend System.

The preferred client-facing entry point is the API Gateway.

---

## Request Tracing and Logging

All services return a `requestId` in API responses.

The same `requestId` is forwarded across API Gateway and backend services, making it easier to trace one request across multiple services.

Each service also logs requests in structured JSON format.

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

---

## Base URL

```text
http://localhost:4000
```

The API Gateway creates or forwards an `X-Request-Id` header for request tracing.

---

## API Gateway Endpoints

### Health Check

```http
GET /health
```

Checks whether the API Gateway is running.

---

## Product APIs

### Get Products

```http
GET /api/products
```

Routes the request to Product Service.

The Product Service reads data using Redis cache-aside behavior:

```text
Redis HIT  → return cached data
Redis MISS → read PostgreSQL, cache result, return data
```

### Get Product By ID

```http
GET /api/products/1
```

Routes the request to Product Service and returns a single product by ID.

---

## Auth APIs

### Auth Service Health

```http
GET /api/auth/health
```

Checks whether Auth Service is reachable through API Gateway.

### Register User

```http
POST /api/auth/register
```

Request body:

```json
{
  "name": "Prince Levin",
  "email": "prince@example.com",
  "password": "Password@123"
}
```

Sample response:

```json
{
  "gateway": "api-gateway",
  "routedTo": "auth-service",
  "data": {
    "service": "auth-service",
    "status": "success",
    "message": "User registered successfully"
  },
  "requestId": "example-request-id"
}
```

### Login User

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "prince@example.com",
  "password": "Password@123"
}
```

Sample response:

```json
{
  "gateway": "api-gateway",
  "routedTo": "auth-service",
  "data": {
    "service": "auth-service",
    "status": "success",
    "message": "Login successful",
    "token": "jwt-token-here",
    "tokenType": "Bearer",
    "expiresIn": "1h"
  },
  "requestId": "example-request-id"
}
```

### Verify JWT Token

```http
GET /api/auth/verify
```

Header:

```text
Authorization: Bearer <jwt-token>
```

Sample response:

```json
{
  "gateway": "api-gateway",
  "routedTo": "auth-service",
  "data": {
    "service": "auth-service",
    "status": "success",
    "message": "Token is valid"
  },
  "requestId": "example-request-id"
}
```

---

## Order APIs

### Order Service Health

```http
GET /api/orders/health
```

Checks whether Order Service is reachable through API Gateway.

### Create Order

```http
POST /api/orders
```

This endpoint is protected and requires a valid JWT token.

Header:

```text
Authorization: Bearer <jwt-token>
```

Request body:

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

Sample success response:

```json
{
  "gateway": "api-gateway",
  "routedTo": "order-service",
  "authenticatedUser": {
    "userId": "USER-...",
    "email": "prince@example.com",
    "name": "Prince Levin"
  },
  "data": {
    "service": "order-service",
    "status": "success",
    "orderStatus": "CONFIRMED",
    "message": "Order created and payment completed successfully"
  },
  "requestId": "example-request-id"
}
```

Sample response without token:

```json
{
  "gateway": "api-gateway",
  "status": "failed",
  "message": "Authorization token is missing",
  "requestId": "example-request-id"
}
```

---

## Circuit Breaker API

### Payment Circuit Breaker Status

```http
GET /api/orders/circuit-breaker/payment
```

Sample response:

```json
{
  "gateway": "api-gateway",
  "routedTo": "order-service",
  "data": {
    "service": "order-service",
    "dependency": "payment-service",
    "circuitBreaker": {
      "state": "CLOSED",
      "failureCount": 0,
      "failureThreshold": 3,
      "cooldownTimeMs": 60000
    }
  },
  "requestId": "example-request-id"
}
```

Possible circuit breaker states:

```text
CLOSED
OPEN
HALF_OPEN
```

---

## Example End-to-End Workflow

### 1. Register user

```http
POST /api/auth/register
```

```json
{
  "name": "Prince Levin",
  "email": "prince@example.com",
  "password": "Password@123"
}
```

### 2. Login and copy JWT token

```http
POST /api/auth/login
```

```json
{
  "email": "prince@example.com",
  "password": "Password@123"
}
```

Copy:

```text
data.token
```

### 3. Create protected order

```http
POST /api/orders
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

## Direct Service Endpoints

These endpoints are useful for internal testing, but client-facing requests should go through the API Gateway.

### Product Service

Base URL:

```text
http://localhost:4001
```

```http
GET /health
GET /products
GET /products/1
DELETE /cache
```

### Payment Service

Base URL:

```text
http://localhost:4002
```

```http
GET /health
POST /payments
```

### Order Service

Base URL:

```text
http://localhost:4003
```

```http
GET /health
POST /orders
GET /circuit-breaker/payment
```

### Auth Service

Base URL:

```text
http://localhost:4004
```

```http
GET /health
POST /auth/register
POST /auth/login
GET /auth/verify
GET /auth/users
```

---

## Notes

- `POST /api/orders` requires a valid JWT token.
- Auth Service currently uses an in-memory user store, so registered users are cleared when the Auth Service restarts.
- Product reads use Redis cache-aside behavior.
- Order creation calls Payment Service through Order Service.
- Payment Service can simulate success, failure, slow response, and random behavior.
- API Gateway forwards request IDs to downstream services for traceability.