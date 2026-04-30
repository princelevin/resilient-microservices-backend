const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
const { processPaymentWithRetry } = require("./clients/paymentClient");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4003;
const SERVICE_NAME = process.env.SERVICE_NAME || "order-service";

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
    message: "Order Service is running",
    service: SERVICE_NAME,
    requestId: req.requestId,
  });
});

app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

app.post("/orders", async (req, res) => {
  const { productId, quantity, amount, paymentMode } = req.body;

  if (!productId || !quantity || !amount) {
    return res.status(400).json({
      service: SERVICE_NAME,
      status: "failed",
      error: "productId, quantity, and amount are required",
      requestId: req.requestId,
    });
  }

  if (quantity <= 0 || amount <= 0) {
    return res.status(400).json({
      service: SERVICE_NAME,
      status: "failed",
      error: "quantity and amount must be greater than 0",
      requestId: req.requestId,
    });
  }

  const orderId = `ORD-${Date.now()}`;

  console.log(
    `[ORDER CREATED] orderId=${orderId}, productId=${productId}, amount=${amount}, requestId=${req.requestId}`
  );

  const paymentPayload = {
    orderId,
    amount,
    mode: paymentMode || "success",
  };

  const paymentResult = await processPaymentWithRetry(
    paymentPayload,
    req.requestId
  );

  if (!paymentResult.success) {
    return res.status(503).json({
      service: SERVICE_NAME,
      status: "failed",
      orderStatus: "PAYMENT_FAILED",
      message: "Order could not be completed because payment failed",
      order: {
        orderId,
        productId,
        quantity,
        amount,
      },
      payment: {
        success: false,
        error: paymentResult.error,
        attempts: paymentResult.attempts,
      },
      requestId: req.requestId,
    });
  }

  return res.status(201).json({
    service: SERVICE_NAME,
    status: "success",
    orderStatus: "CONFIRMED",
    message: "Order created and payment completed successfully",
    order: {
      orderId,
      productId,
      quantity,
      amount,
    },
    payment: {
      success: true,
      attempts: paymentResult.attempts,
      response: paymentResult.paymentResponse,
    },
    requestId: req.requestId,
  });
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