const jwt = require("jsonwebtoken");
require("dotenv").config();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      service: process.env.SERVICE_NAME || "auth-service",
      status: "failed",
      message: "Authorization token is missing",
      requestId: req.requestId,
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      service: process.env.SERVICE_NAME || "auth-service",
      status: "failed",
      message: "Invalid or expired token",
      error: error.message,
      requestId: req.requestId,
    });
  }
}

module.exports = authMiddleware;