# Resilient Microservices Backend System

A backend engineering project built to understand how microservices behave when services become slow, fail, retry, or depend on databases and caches.

The goal of this project is not just to build APIs, but to understand real backend reliability patterns used in production systems.

---

## Goal

This project demonstrates practical backend reliability patterns such as:

- API Gateway routing
- Independent microservices
- Product Service
- Auth Service
- Order Service
- Payment Mock Service
- PostgreSQL integration
- Redis caching
- Retry with backoff
- Timeout handling
- Circuit breaker pattern
- Structured logging with request IDs
- Docker-based local setup

---

## Tech Stack

- Node.js
- Express.js
- REST APIs
- PostgreSQL
- Redis
- Docker
- JWT Authentication
- Axios
- Morgan
- dotenv
- UUID

---

## Current Progress

### Day 1: API Gateway Setup

Completed the initial API Gateway setup.

Implemented:

- Basic Express.js API Gateway
- Root endpoint `/`
- Health check endpoint `/health`
- Placeholder route `/api/products`
- Placeholder route `/api/orders`
- Request ID generation for every request
- Basic logging using Morgan
- Environment configuration using dotenv

---

### Day 2: Product Service and Gateway Routing

Completed the Product Service and connected it through the API Gateway.

Implemented:

- Separate Product Service
- Product Service root endpoint `/`
- Product Service health check endpoint `/health`
- Product list endpoint `/products`
- Product lookup endpoint `/products/:id`
- API Gateway routing to Product Service
- Request ID forwarding from API Gateway to Product Service
- Timeout handling while calling Product Service
- Error handling when Product Service is unavailable

---

## Architecture Flow

Current working flow:

```text
Client
  ↓
API Gateway
  ↓
Product Service
```

The client calls the API Gateway on port `4000`.

The API Gateway internally calls the Product Service on port `4001`.

This keeps the Product Service hidden behind the Gateway and makes the Gateway the single entry point for clients.

---

## Services

### 1. API Gateway

The API Gateway is the entry point for client requests.

Responsibilities:

- Accept client requests
- Generate request IDs
- Forward requests to internal services
- Route product requests to Product Service
- Handle service timeout errors
- Return a consistent response format

Runs on:

```text
http://localhost:4000
```

---

### 2. Product Service

The Product Service manages product-related APIs.

Responsibilities:

- Return product list
- Return product by ID
- Provide health check status
- Receive request ID from API Gateway
- Return service-specific response

Runs on:

```text
http://localhost:4001
```

---

## API Gateway Endpoints

### Root Endpoint

```http
GET /
```

Returns basic API Gateway status.

### Health Check Endpoint

```http
GET /health
```

Returns API Gateway health status, uptime, timestamp, and request ID.

### Get Products Through API Gateway

```http
GET /api/products
```

Routes the request from API Gateway to Product Service.

### Get Product By ID Through API Gateway

```http
GET /api/products/:id
```

Example:

```http
GET /api/products/1
```

Routes the request from API Gateway to Product Service and returns a single product.

---

## Product Service Endpoints

### Root Endpoint

```http
GET /
```

Returns Product Service running status.

### Health Check Endpoint

```http
GET /health
```

Returns Product Service health status, uptime, timestamp, and request ID.

### Get All Products

```http
GET /products
```

Returns the list of products.

### Get Product By ID

```http
GET /products/:id
```

Example:

```http
GET /products/1
```

Returns one product by ID.

---

## Sample API Gateway Response

Request:

```http
GET http://localhost:4000/api/products
```

Response:

```json
{
  "gateway": "api-gateway",
  "routedTo": "product-service",
  "data": {
    "service": "product-service",
    "count": 3,
    "data": [
      {
        "id": 1,
        "name": "Wireless Keyboard",
        "price": 1299,
        "stock": 25
      },
      {
        "id": 2,
        "name": "Gaming Mouse",
        "price": 899,
        "stock": 40
      },
      {
        "id": 3,
        "name": "USB-C Hub",
        "price": 1999,
        "stock": 15
      }
    ],
    "requestId": "5990f162-6e2f-499c-a4c7-808cf1787d0d"
  },
  "requestId": "5990f162-6e2f-499c-a4c7-808cf1787d0d"
}
```

---

## Sample Product Service Health Check Response

Request:

```http
GET http://localhost:4001/health
```

Response:

```json
{
  "service": "product-service",
  "status": "healthy",
  "uptime": 4.861302834,
  "timestamp": "2026-04-24T18:12:40.691Z",
  "requestId": "42103c72-f2ac-4e7e-a96b-9605eb3d09d1"
}
```

---

## Key Learning So Far

### Day 1 Learning

The API Gateway acts as the single entry point for a microservices system.

Instead of exposing every service directly to the client, the Gateway handles routing and gives one consistent access point.

### Day 2 Learning

The Product Service can work independently, but in a microservices setup, clients should not directly depend on internal services.

The API Gateway now routes requests to the Product Service.

This creates the first real internal service-to-service communication flow in the project.

Current flow:

```text
Client → API Gateway → Product Service
```

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
│   │   └── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── auth-service
├── order-service
├── payment-service
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## How to Run the Project

At the current stage, two services need to run separately:

- API Gateway
- Product Service

---

## Run Product Service

Open a terminal and go inside the Product Service folder:

```bash
cd product-service
```

Install dependencies:

```bash
npm install
```

Run the Product Service:

```bash
npm run dev
```

Product Service runs on:

```text
http://localhost:4001
```

Test Product Service:

```http
GET http://localhost:4001/health
GET http://localhost:4001/products
GET http://localhost:4001/products/1
```

---

## Run API Gateway

Open another terminal and go inside the API Gateway folder:

```bash
cd api-gateway
```

Install dependencies:

```bash
npm install
```

Run the API Gateway:

```bash
npm run dev
```

API Gateway runs on:

```text
http://localhost:4000
```

Test API Gateway:

```http
GET http://localhost:4000/health
GET http://localhost:4000/api/products
GET http://localhost:4000/api/products/1
```

---

## Environment Variables

### API Gateway `.env`

```env
PORT=4000
SERVICE_NAME=api-gateway
PRODUCT_SERVICE_URL=http://localhost:4001
```

### Product Service `.env`

```env
PORT=4001
SERVICE_NAME=product-service
```

---

## Git Commit History

### Day 1 Commit

```text
Initialize resilient microservices backend with API gateway
```

### Day 2 Commit

```text
Add product service and gateway routing
```

---

## Project Status

### Completed

- API Gateway setup
- API Gateway health check
- Request ID generation
- Product Service setup
- Product Service health check
- Product APIs
- API Gateway to Product Service routing
- Request ID forwarding
- Timeout handling
- Basic error handling

### In Progress

- Building the system step by step as a backend reliability learning project

### Next Steps

- PostgreSQL integration for Product Service
- Replace hardcoded product array with database records
- Add Docker Compose setup for PostgreSQL
- Add Redis caching for product reads
- Add timeout and retry simulation
- Add circuit breaker behavior
- Add Auth Service with JWT
- Add Order Service
- Add Payment Mock Service
- Add structured logs
- Add architecture diagram

---

## Why This Project Matters

In real-world systems, building an API is only the first step.

Production backend systems must handle:

- Slow services
- Failed services
- Network latency
- Database bottlenecks
- Retry storms
- Cache consistency
- Observability issues
- Debugging across multiple services

This project is built to explore those problems practically.

The focus is on learning how backend systems behave under real failure conditions and how reliability patterns improve system behavior.

---

## Author

Built by Prince Levin as a backend engineering and microservices learning project.