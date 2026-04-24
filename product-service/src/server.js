const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
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

const products = [
  {
    id: 1,
    name: "Wireless Keyboard",
    price: 1299,
    stock: 25,
  },
  {
    id: 2,
    name: "Gaming Mouse",
    price: 899,
    stock: 40,
  },
  {
    id: 3,
    name: "USB-C Hub",
    price: 1999,
    stock: 15,
  },
];

app.get("/", (req, res) => {
  res.json({
    message: "Product Service is running",
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

app.get("/products", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    count: products.length,
    data: products,
    requestId: req.requestId,
  });
});

app.get("/products/:id", (req, res) => {
  const productId = Number(req.params.id);
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({
      service: SERVICE_NAME,
      error: "Product not found",
      requestId: req.requestId,
    });
  }

  res.json({
    service: SERVICE_NAME,
    data: product,
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