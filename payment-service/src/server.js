const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4002;
const SERVICE_NAME = process.env.SERVICE_NAME || "payment-service";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Add requestId to every request
app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Payment Service is running",
    service: SERVICE_NAME,
    requestId: req.requestId,
  });
});

// Health endpoint
app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// Small helper function for delay
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Payment simulation endpoint
app.post("/payments", async (req, res) => {
  const { orderId, amount, mode } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({
      service: SERVICE_NAME,
      status: "failed",
      error: "orderId and amount are required",
      requestId: req.requestId,
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      service: SERVICE_NAME,
      status: "failed",
      error: "amount must be greater than 0",
      requestId: req.requestId,
    });
  }

  const paymentMode = mode || "success";

  console.log(
    `[PAYMENT REQUEST] orderId=${orderId}, amount=${amount}, mode=${paymentMode}, requestId=${req.requestId}`
  );

  // Success simulation
  if (paymentMode === "success") {
    return res.status(200).json({
      service: SERVICE_NAME,
      status: "success",
      message: "Payment processed successfully",
      paymentId: `PAY-${Date.now()}`,
      orderId,
      amount,
      mode: paymentMode,
      requestId: req.requestId,
    });
  }

  // Failure simulation
  if (paymentMode === "failure") {
    return res.status(402).json({
      service: SERVICE_NAME,
      status: "failed",
      message: "Payment failed due to insufficient funds",
      orderId,
      amount,
      mode: paymentMode,
      requestId: req.requestId,
    });
  }

  // Slow response simulation
  if (paymentMode === "slow") {
    console.log(`[PAYMENT SLOW] Simulating slow payment for requestId=${req.requestId}`);

    await wait(5000);

    return res.status(200).json({
      service: SERVICE_NAME,
      status: "success",
      message: "Payment processed successfully after delay",
      paymentId: `PAY-SLOW-${Date.now()}`,
      orderId,
      amount,
      mode: paymentMode,
      delayMs: 5000,
      requestId: req.requestId,
    });
  }

  // Random success/failure simulation
  if (paymentMode === "random") {
    const isSuccess = Math.random() > 0.5;

    if (isSuccess) {
      return res.status(200).json({
        service: SERVICE_NAME,
        status: "success",
        message: "Random payment succeeded",
        paymentId: `PAY-RANDOM-${Date.now()}`,
        orderId,
        amount,
        mode: paymentMode,
        requestId: req.requestId,
      });
    }

    return res.status(500).json({
      service: SERVICE_NAME,
      status: "failed",
      message: "Random payment failed because downstream provider was unstable",
      orderId,
      amount,
      mode: paymentMode,
      requestId: req.requestId,
    });
  }

  // Invalid mode
  return res.status(400).json({
    service: SERVICE_NAME,
    status: "failed",
    error: "Invalid payment mode",
    allowedModes: ["success", "failure", "slow", "random"],
    requestId: req.requestId,
  });
});

// 404 fallback
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