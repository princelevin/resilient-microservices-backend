# Resilient Microservices Backend System

A backend engineering project built to understand how microservices behave when services become slow, fail, retry, or depend on databases and caches.

## Goal

This project demonstrates practical backend reliability patterns such as:

- API Gateway
- Auth Service
- Product Service
- Order Service
- Payment Mock Service
- PostgreSQL integration
- Redis caching
- Retry with backoff
- Timeout handling
- Circuit breaker pattern
- Structured logging with request IDs
- Docker-based local setup

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Redis
- Docker
- REST APIs
- JWT Authentication

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

## API Gateway Endpoints

### Root Endpoint

```http
GET /
```

Returns basic project and service status.

### Health Check Endpoint

```http
GET /health
```

Returns API Gateway health status, uptime, timestamp, and request ID.

### Product Route Placeholder

```http
GET /api/products
```

Temporary route showing where the Product Service will be connected.

### Order Route Placeholder

```http
GET /api/orders
```

Temporary route showing where the Order Service will be connected.

## How to Run API Gateway

Go inside the API Gateway folder:

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

Server runs on:

```text
http://localhost:4000
```

## Sample Health Check Response

```json
{
  "service": "api-gateway",
  "status": "healthy",
  "uptime": 20.22,
  "timestamp": "2026-04-24T17:47:29.250Z",
  "requestId": "4e0548d6-55b1-4814-90c5-5ea72f91f7c7"
}
```

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
├── auth-service
├── product-service
├── order-service
├── payment-service
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Project Status

Day 1 completed: API Gateway foundation is working.

Next step: build Product Service and connect it through the API Gateway.