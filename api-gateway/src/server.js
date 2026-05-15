const axios = require("axios");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
const { logInfo, logError, requestLogger } = require("./utils/logger");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = process.env.SERVICE_NAME || "api-gateway";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:4003";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4004";

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Add requestId to every request
app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use(requestLogger(SERVICE_NAME));

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      gateway: SERVICE_NAME,
      status: "failed",
      message: "Authorization token is missing",
      requestId: req.requestId,
    });
  }

  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/verify`, {
      headers: {
        Authorization: authHeader,
        "x-request-id": req.requestId,
      },
      timeout: 3000,
    });

    req.user = response.data.user;

    next();
  } catch (error) {
    return res.status(401).json({
      gateway: SERVICE_NAME,
      status: "failed",
      message: "Invalid or expired token",
      details: error.response?.data || error.message,
      requestId: req.requestId,
    });
  }
}

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Resilient Microservices Backend System",
    service: SERVICE_NAME,
    status: "running",
    requestId: req.requestId,
  });
});

// API Gateway health check
app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// Product Service - get all products
app.get("/api/products", async (req, res) => {
  try {
    const response = await axios.get(
      `${PRODUCT_SERVICE_URL}/products`,
      {
        headers: {
          "x-request-id": req.requestId,
        },
        timeout: 3000,
      }
    );

    res.json({
      gateway: SERVICE_NAME,
      routedTo: "product-service",
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      gateway: SERVICE_NAME,
      error: "Product Service is unavailable",
      details: error.message,
      requestId: req.requestId,
    });
  }
});

// Product Service - get product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${PRODUCT_SERVICE_URL}/products/${req.params.id}`,
      {
        headers: {
          "x-request-id": req.requestId,
        },
        timeout: 3000,
      }
    );

    res.json({
      gateway: SERVICE_NAME,
      routedTo: "product-service",
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      gateway: SERVICE_NAME,
      error: "Failed to fetch product",
      details: error.response?.data || error.message,
      requestId: req.requestId,
    });
  }
});

app.get("/api/auth/health", async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/health`, {
      headers: {
        "x-request-id": req.requestId,
      },
      timeout: 3000,
    });

    res.json({
      gateway: SERVICE_NAME,
      routedTo: "auth-service",
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      gateway: SERVICE_NAME,
      error: "Auth Service health check failed",
      details: error.message,
      requestId: req.requestId,
    });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/auth/register`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-request-id": req.requestId,
        },
        timeout: 5000,
      }
    );

    res.status(response.status).json({
      gateway: SERVICE_NAME,
      routedTo: "auth-service",
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      gateway: SERVICE_NAME,
      error: "Failed to register user",
      details: error.response?.data || error.message,
      requestId: req.requestId,
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/auth/login`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-request-id": req.requestId,
        },
        timeout: 5000,
      }
    );

    res.status(response.status).json({
      gateway: SERVICE_NAME,
      routedTo: "auth-service",
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      gateway: SERVICE_NAME,
      error: "Failed to login user",
      details: error.response?.data || error.message,
      requestId: req.requestId,
    });
  }
});

app.get("/api/auth/verify", async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/verify`, {
      headers: {
        Authorization: req.headers.authorization,
        "x-request-id": req.requestId,
      },
      timeout: 3000,
    });

    res.json({
      gateway: SERVICE_NAME,
      routedTo: "auth-service",
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(error.response?.status || 401).json({
      gateway: SERVICE_NAME,
      error: "Token verification failed",
      details: error.response?.data || error.message,
      requestId: req.requestId,
    });
  }
});

// Order Service - health check through API Gateway
app.get("/api/orders/health", async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/health`, {
      headers: {
        "x-request-id": req.requestId,
      },
      timeout: 3000,
    });

    res.json({
      gateway: SERVICE_NAME,
      routedTo: "order-service",
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      gateway: SERVICE_NAME,
      error: "Order Service health check failed",
      details: error.message,
      requestId: req.requestId,
    });
  }
});

// Order Service - create order through API Gateway
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const response = await axios.post(
      `${ORDER_SERVICE_URL}/orders`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-request-id": req.requestId,
          "x-user-id": req.user?.userId,
          "x-user-email": req.user?.email,
        },
        timeout: 15000,
      }
    );

    res.status(response.status).json({
      gateway: SERVICE_NAME,
      routedTo: "order-service",
      authenticatedUser: req.user,
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      gateway: SERVICE_NAME,
      error: "Failed to create order",
      details: error.response?.data || error.message,
      requestId: req.requestId,
    });
  }
});

// Order Service - payment circuit breaker status through API Gateway
app.get("/api/orders/circuit-breaker/payment", async (req, res) => {
  try {
    const response = await axios.get(
      `${ORDER_SERVICE_URL}/circuit-breaker/payment`,
      {
        headers: {
          "x-request-id": req.requestId,
        },
        timeout: 3000,
      }
    );

    res.json({
      gateway: SERVICE_NAME,
      routedTo: "order-service",
      data: response.data,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      gateway: SERVICE_NAME,
      error: "Failed to fetch payment circuit breaker status",
      details: error.message,
      requestId: req.requestId,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    gateway: SERVICE_NAME,
    error: "Route not found",
    path: req.originalUrl,
    requestId: req.requestId,
  });
});

// Start server
app.listen(PORT, () => {
  logInfo("Service started", {
    service: SERVICE_NAME,
    port: PORT,
  });
});