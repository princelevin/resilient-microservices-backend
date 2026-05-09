const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("./middleware/authMiddleware");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4004;
const SERVICE_NAME = process.env.SERVICE_NAME || "auth-service";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Temporary in-memory user store
// Later we can move this to PostgreSQL
const users = [];

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
    message: "Auth Service is running",
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

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      service: SERVICE_NAME,
      status: "failed",
      message: "name, email, and password are required",
      requestId: req.requestId,
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      service: SERVICE_NAME,
      status: "failed",
      message: "Password must be at least 8 characters long",
      requestId: req.requestId,
    });
  }

  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(409).json({
      service: SERVICE_NAME,
      status: "failed",
      message: "User already exists",
      requestId: req.requestId,
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: `USER-${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  return res.status(201).json({
    service: SERVICE_NAME,
    status: "success",
    message: "User registered successfully",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    },
    requestId: req.requestId,
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      service: SERVICE_NAME,
      status: "failed",
      message: "email and password are required",
      requestId: req.requestId,
    });
  }

  const user = users.find((user) => user.email === email);

  if (!user) {
    return res.status(401).json({
      service: SERVICE_NAME,
      status: "failed",
      message: "Invalid email or password",
      requestId: req.requestId,
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      service: SERVICE_NAME,
      status: "failed",
      message: "Invalid email or password",
      requestId: req.requestId,
    });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );

  return res.json({
    service: SERVICE_NAME,
    status: "success",
    message: "Login successful",
    token,
    tokenType: "Bearer",
    expiresIn: JWT_EXPIRES_IN,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    requestId: req.requestId,
  });
});

app.get("/auth/verify", authMiddleware, (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "success",
    message: "Token is valid",
    user: req.user,
    requestId: req.requestId,
  });
});

app.get("/auth/users", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    count: users.length,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })),
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