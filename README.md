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
- Cache-aside pattern
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
- pg
- redis

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

### Day 3: PostgreSQL Integration for Product Service

Connected the Product Service to PostgreSQL and replaced hardcoded product data with database records.

Implemented:

- PostgreSQL database connection using `pg`
- Database pool configuration in `product-service/src/db/pool.js`
- SQL setup script in `product-service/src/db/init.sql`
- `products` table with sample product records
- Product Service health check verifying database connectivity
- `/products` endpoint reading product list from PostgreSQL
- `/products/:id` endpoint reading a single product from PostgreSQL
- API Gateway routing to PostgreSQL-backed Product Service

---

### Day 4: Redis Caching for Product Service

Added Redis caching to reduce repeated PostgreSQL reads for product data.

Implemented:

- Redis container using Docker Compose
- Redis client setup in `product-service/src/db/redis.js`
- Redis connection check in Product Service health endpoint
- Cache-aside pattern for `/products`
- Cache-aside pattern for `/products/:id`
- Cache TTL using `CACHE_TTL_SECONDS`
- Cache HIT and MISS response indicators
- Cache clearing endpoint using `DELETE /cache`
- API Gateway continues routing to Redis-backed Product Service

---

## Architecture Flow

Current working flow:

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

The client calls the API Gateway on port `4000`.

The API Gateway internally calls the Product Service on port `4001`.

The Product Service checks Redis first.

If data is available in Redis, the response is returned from cache.

If data is not available in Redis, the Product Service reads from PostgreSQL and stores the result in Redis.

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
- Connect to PostgreSQL
- Connect to Redis
- Read product records from PostgreSQL on cache miss
- Return product records from Redis on cache hit
- Receive request ID from API Gateway
- Return service-specific response

Runs on:

```text
http://localhost:4001
```

---

### 3. PostgreSQL

PostgreSQL stores product data.

Current table:

```text
products
```

Current fields:

```text
id
name
price
stock
created_at
```

---

### 4. Redis

Redis is used as a caching layer for product reads.

Current cache keys:

```text
products:all
products:1
products:2
products:3
```

Current cache TTL:

```text
60 seconds
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

The Product Service checks Redis first.

If cache is available, response comes from Redis.

If cache is not available, response comes from PostgreSQL and is stored in Redis.

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

Returns Product Service health status, database connection status, Redis connection status, uptime, timestamp, and request ID.

### Get All Products

```http
GET /products
```

Returns the list of products.

First request usually returns:

```text
cache: MISS
source: postgresql
```

Repeated request returns:

```text
cache: HIT
source: redis
```

### Get Product By ID

```http
GET /products/:id
```

Example:

```http
GET /products/1
```

Returns one product by ID.

First request usually returns:

```text
cache: MISS
source: postgresql
```

Repeated request returns:

```text
cache: HIT
source: redis
```

### Clear Product Cache

```http
DELETE /cache
```

Clears product-related Redis cache keys.

---

## Sample API Gateway Response with Redis HIT

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
    "source": "redis",
    "cache": "HIT",
    "count": 3,
    "data": [
      {
        "id": 1,
        "name": "Wireless Keyboard",
        "price": 1299,
        "stock": 25,
        "created_at": "2026-04-25T08:33:02.906Z"
      },
      {
        "id": 2,
        "name": "Gaming Mouse",
        "price": 899,
        "stock": 40,
        "created_at": "2026-04-25T08:33:02.906Z"
      },
      {
        "id": 3,
        "name": "USB-C Hub",
        "price": 1999,
        "stock": 15,
        "created_at": "2026-04-25T08:33:02.906Z"
      }
    ],
    "requestId": "383169b8-e842-4978-8d08-733c5873c910"
  },
  "requestId": "383169b8-e842-4978-8d08-733c5873c910"
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
  "database": "connected",
  "redis": "connected",
  "uptime": 8.586583083,
  "timestamp": "2026-04-25T09:02:23.011Z",
  "requestId": "cbdf10e6-fabc-4d7c-86f9-7e6a53b1424e"
}
```

---

## Sample Product Service Cache MISS Response

Request:

```http
GET http://localhost:4001/products
```

Response:

```json
{
  "service": "product-service",
  "source": "postgresql",
  "cache": "MISS",
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Wireless Keyboard",
      "price": 1299,
      "stock": 25,
      "created_at": "2026-04-25T08:33:02.906Z"
    },
    {
      "id": 2,
      "name": "Gaming Mouse",
      "price": 899,
      "stock": 40,
      "created_at": "2026-04-25T08:33:02.906Z"
    },
    {
      "id": 3,
      "name": "USB-C Hub",
      "price": 1999,
      "stock": 15,
      "created_at": "2026-04-25T08:33:02.906Z"
    }
  ],
  "requestId": "faa3da2e-eb06-4ee0-9416-79c7cf8359ac"
}
```

---

## Sample Product Service Cache HIT Response

Request:

```http
GET http://localhost:4001/products
```

Response:

```json
{
  "service": "product-service",
  "source": "redis",
  "cache": "HIT",
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Wireless Keyboard",
      "price": 1299,
      "stock": 25,
      "created_at": "2026-04-25T08:33:02.906Z"
    },
    {
      "id": 2,
      "name": "Gaming Mouse",
      "price": 899,
      "stock": 40,
      "created_at": "2026-04-25T08:33:02.906Z"
    },
    {
      "id": 3,
      "name": "USB-C Hub",
      "price": 1999,
      "stock": 15,
      "created_at": "2026-04-25T08:33:02.906Z"
    }
  ],
  "requestId": "935e5e1f-bb5f-45b2-bd6d-e737ad9c5694"
}
```

---

## Key Learning So Far

### Day 1 Learning

The API Gateway acts as the single entry point for a microservices system.

Instead of exposing every service directly to the client, the Gateway handles routing and gives one consistent access point.

### Day 2 Learning

The Product Service can work independently, but in a microservices setup, clients should not directly depend on internal services.

The API Gateway routes requests to the Product Service.

This created the first internal service-to-service communication flow in the project.

```text
Client → API Gateway → Product Service
```

### Day 3 Learning

The Product Service now reads from PostgreSQL instead of using hardcoded data.

This makes the service closer to a real backend system because the API depends on an external database.

```text
Client → API Gateway → Product Service → PostgreSQL
```

This also introduces an important production concern:

If the database is disconnected, the Product Service health check should report the service as unhealthy.

### Day 4 Learning

The Product Service now uses Redis as a caching layer.

This reduces repeated PostgreSQL reads for the same product data.

The implemented pattern is cache-aside:

```text
Request comes in
  ↓
Check Redis
  ↓
If cache HIT, return cached data
  ↓
If cache MISS, read from PostgreSQL
  ↓
Store result in Redis
  ↓
Return response
```

This is important because production systems should avoid hitting the database for every repeated read request.

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

At the current stage, four parts are needed:

- PostgreSQL
- Redis
- Product Service
- API Gateway

---

## Run PostgreSQL and Redis

Start Docker containers:

```bash
docker compose up -d
```

Check running containers:

```bash
docker ps
```

Test Redis:

```bash
docker exec -it resilient-redis redis-cli ping
```

Expected output:

```text
PONG
```

---

## Initialize PostgreSQL Data

Run the SQL setup script:

```bash
psql -d resilient_microservices -f product-service/src/db/init.sql
```

Verify products:

```bash
psql -d resilient_microservices
```

Then inside PostgreSQL:

```sql
SELECT * FROM products;
```

Exit PostgreSQL:

```sql
\q
```

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

Clear cache:

```bash
curl -X DELETE http://localhost:4001/cache
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

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=resilient_microservices

REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=60
```

If PostgreSQL is configured with the local Mac username instead of `postgres`, update `DB_USER` and `DB_PASSWORD` accordingly.

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

### Day 3 Commit

```text
Add PostgreSQL integration for product service
```

### Day 4 Commit

```text
Add Redis caching for product service
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
- PostgreSQL integration for Product Service
- Product APIs now read from PostgreSQL
- Database health check added
- SQL init script added
- Redis caching for Product Service
- Cache HIT/MISS handling
- Cache TTL added
- Redis health check added
- Cache clearing endpoint added

### In Progress

- Building the system step by step as a backend reliability learning project

### Next Steps

- Add timeout and retry simulation
- Add circuit breaker behavior
- Add Auth Service with JWT
- Add Order Service
- Add Payment Mock Service
- Add structured logs
- Add architecture diagram
- Add full Docker Compose support for running all services together

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