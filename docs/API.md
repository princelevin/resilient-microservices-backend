# API Documentation

## API Gateway

Base URL:

```text
http://localhost:4000
```

### Health Check

```http
GET /health
```

### Get Products

```http
GET /api/products
```

### Get Product By ID

```http
GET /api/products/1
```

### Order Service Health Through Gateway

```http
GET /api/orders/health
```

### Create Order Through Gateway

```http
POST /api/orders
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

### Payment Circuit Breaker Status Through Gateway

```http
GET /api/orders/circuit-breaker/payment
```

---

## Product Service

Base URL:

```text
http://localhost:4001
```

### Health Check

```http
GET /health
```

### Get Products

```http
GET /products
```

Sample response can return from PostgreSQL on cache miss:

```json
{
  "service": "product-service",
  "source": "postgresql",
  "cache": "MISS",
  "count": 3,
  "data": []
}
```

Or from Redis on cache hit:

```json
{
  "service": "product-service",
  "source": "redis",
  "cache": "HIT",
  "count": 3,
  "data": []
}
```

### Get Product By ID

```http
GET /products/1
```

### Clear Product Cache

```http
DELETE /cache
```

---

## Payment Service

Base URL:

```text
http://localhost:4002
```

### Health Check

```http
GET /health
```

### Process Payment

```http
POST /payments
```

Request body:

```json
{
  "orderId": "ORD-1001",
  "amount": 1299,
  "mode": "success"
}
```

Supported modes:

```text
success
failure
slow
random
```

### Success Payment Response

```json
{
  "service": "payment-service",
  "status": "success",
  "message": "Payment processed successfully",
  "paymentId": "PAY-...",
  "orderId": "ORD-1001",
  "amount": 1299,
  "mode": "success"
}
```

### Failed Payment Response

```json
{
  "service": "payment-service",
  "status": "failed",
  "message": "Payment failed due to insufficient funds",
  "orderId": "ORD-1002",
  "amount": 899,
  "mode": "failure"
}
```

### Slow Payment Response

```json
{
  "service": "payment-service",
  "status": "success",
  "message": "Payment processed successfully after delay",
  "delayMs": 5000
}
```

### Random Payment Response

```json
{
  "service": "payment-service",
  "status": "success",
  "message": "Random payment succeeded",
  "paymentId": "PAY-RANDOM-...",
  "orderId": "ORD-1004",
  "amount": 500,
  "mode": "random"
}
```

Random mode can return either success or failure.

---

> Order Service can be called directly on port `4003`, but the preferred client-facing path is through API Gateway using `/api/orders`.

## Order Service

Base URL:

```text
http://localhost:4003
```

### Health Check

```http
GET /health
```

### Create Order

```http
POST /orders
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

### Successful Order Response

```json
{
  "service": "order-service",
  "status": "success",
  "orderStatus": "CONFIRMED",
  "message": "Order created and payment completed successfully"
}
```

### Failed Order Response

```json
{
  "service": "order-service",
  "status": "failed",
  "orderStatus": "PAYMENT_FAILED",
  "message": "Order could not be completed because payment failed"
}
```

### Circuit Breaker Status

```http
GET /circuit-breaker/payment
```

Sample CLOSED response:

```json
{
  "service": "order-service",
  "dependency": "payment-service",
  "circuitBreaker": {
    "state": "CLOSED",
    "failureCount": 0,
    "failureThreshold": 3,
    "cooldownTimeMs": 60000
  }
}
```

Sample OPEN response:

```json
{
  "service": "order-service",
  "dependency": "payment-service",
  "circuitBreaker": {
    "state": "OPEN",
    "failureCount": 3,
    "failureThreshold": 3,
    "cooldownTimeMs": 60000
  }
}
```

Sample fast failure when circuit is open:

```json
{
  "service": "order-service",
  "status": "failed",
  "orderStatus": "PAYMENT_FAILED",
  "payment": {
    "success": false,
    "circuitBreakerOpen": true,
    "error": {
      "message": "Payment Service circuit is OPEN. Request blocked to protect the system.",
      "code": "CIRCUIT_OPEN",
      "httpStatus": 503
    },
    "attempts": []
  }
}
```