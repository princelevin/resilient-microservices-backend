const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db/pool");
const { redisClient, connectRedis } = require("./db/redis");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4001;
const SERVICE_NAME = process.env.SERVICE_NAME || "product-service";
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 60;

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
  const health = {
    service: SERVICE_NAME,
    status: "healthy",
    database: "unknown",
    redis: "unknown",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  try {
    await pool.query("SELECT 1");
    health.database = "connected";
  } catch (error) {
    health.status = "unhealthy";
    health.database = "disconnected";
    health.databaseError = error.message;
  }

  try {
    await connectRedis();
    await redisClient.ping();
    health.redis = "connected";
  } catch (error) {
    health.status = "unhealthy";
    health.redis = "disconnected";
    health.redisError = error.message;
  }

  const statusCode = health.status === "healthy" ? 200 : 500;
  res.status(statusCode).json(health);
});

app.get("/products", async (req, res) => {
  const cacheKey = "products:all";

  try {
    await connectRedis();

    const cachedProducts = await redisClient.get(cacheKey);

    if (cachedProducts) {
      console.log(`[CACHE HIT] ${cacheKey}`);

      return res.json({
        service: SERVICE_NAME,
        source: "redis",
        cache: "HIT",
        count: JSON.parse(cachedProducts).length,
        data: JSON.parse(cachedProducts),
        requestId: req.requestId,
      });
    }

    console.log(`[CACHE MISS] ${cacheKey}`);

    const result = await pool.query(
      "SELECT id, name, price, stock, created_at FROM products ORDER BY id"
    );

    await redisClient.setEx(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify(result.rows)
    );

    res.json({
      service: SERVICE_NAME,
      source: "postgresql",
      cache: "MISS",
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

    const cacheKey = `products:${productId}`;

    await connectRedis();

    const cachedProduct = await redisClient.get(cacheKey);

    if (cachedProduct) {
      console.log(`[CACHE HIT] ${cacheKey}`);

      return res.json({
        service: SERVICE_NAME,
        source: "redis",
        cache: "HIT",
        data: JSON.parse(cachedProduct),
        requestId: req.requestId,
      });
    }

    console.log(`[CACHE MISS] ${cacheKey}`);

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

    await redisClient.setEx(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify(result.rows[0])
    );

    res.json({
      service: SERVICE_NAME,
      source: "postgresql",
      cache: "MISS",
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

app.delete("/cache", async (req, res) => {
  try {
    await connectRedis();

    const keys = await redisClient.keys("products:*");

    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    res.json({
      service: SERVICE_NAME,
      message: "Product cache cleared",
      deletedKeys: keys,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      service: SERVICE_NAME,
      error: "Failed to clear cache",
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

async function startServer() {
  try {
    await connectRedis();
    console.log("Redis connected successfully");

    app.listen(PORT, () => {
      console.log(`${SERVICE_NAME} running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start service:", error.message);
    process.exit(1);
  }
}

startServer();