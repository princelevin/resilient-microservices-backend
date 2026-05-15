function logInfo(message, meta = {}) {
  console.log(
    JSON.stringify({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    })
  );
}

function logError(message, meta = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    })
  );
}

function requestLogger(serviceName) {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - startTime;

      logInfo("Request completed", {
        service: serviceName,
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      });
    });

    next();
  };
}

module.exports = {
  logInfo,
  logError,
  requestLogger,
};