const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db/pool");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4001;
const SERVICE_NAME = process.env.SERVICE_NAME || "product-service";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "Product Service is running",
    service: SERVICE_NAME,
    requestId: req.requestId,
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      service: SERVICE_NAME,
      status: "healthy",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      service: SERVICE_NAME,
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      requestId: req.requestId,
    });
  }
});

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, price, stock, created_at FROM products ORDER BY id"
    );

    res.json({
      service: SERVICE_NAME,
      source: "postgresql",
      count: result.rows.length,
      data: result.rows,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      service: SERVICE_NAME,
      error: "Failed to fetch products",
      details: error.message,
      requestId: req.requestId,
    });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        service: SERVICE_NAME,
        error: "Invalid product ID",
        requestId: req.requestId,
      });
    }

    const result = await pool.query(
      "SELECT id, name, price, stock, created_at FROM products WHERE id = $1",
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: SERVICE_NAME,
        error: "Product not found",
        requestId: req.requestId,
      });
    }

    res.json({
      service: SERVICE_NAME,
      source: "postgresql",
      data: result.rows[0],
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      service: SERVICE_NAME,
      error: "Failed to fetch product",
      details: error.message,
      requestId: req.requestId,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    service: SERVICE_NAME,
    error: "Route not found",
    path: req.originalUrl,
    requestId: req.requestId,
  });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});