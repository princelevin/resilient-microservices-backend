const axios = require("axios");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = process.env.SERVICE_NAME || "api-gateway";

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Add requestId to every request
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Resilient Microservices Backend System",
    service: SERVICE_NAME,
    status: "running",
    requestId: req.requestId,
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

app.get("/api/products", async (req, res) => {
  try {
    const response = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/products`, {
      headers: {
        "x-request-id": req.requestId,
      },
      timeout: 3000,
    });

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

app.get("/api/products/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL}/products/${req.params.id}`,
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

app.get("/api/orders", (req, res) => {
  res.json({
    message: "Order Service route will be connected here",
    requestId: req.requestId,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    requestId: req.requestId,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});