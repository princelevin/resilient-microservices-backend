const axios = require("axios");
require("dotenv").config();

const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:4002";

const PAYMENT_TIMEOUT_MS = Number(process.env.PAYMENT_TIMEOUT_MS) || 2000;
const PAYMENT_MAX_RETRIES = Number(process.env.PAYMENT_MAX_RETRIES) || 3;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffDelay(attempt) {
  return 500 * Math.pow(2, attempt - 1);
}

async function processPaymentWithRetry(paymentPayload, requestId) {
  let lastError = null;
  const attempts = [];

  for (let attempt = 1; attempt <= PAYMENT_MAX_RETRIES; attempt++) {
    const delayBeforeNextRetry = getBackoffDelay(attempt);

    try {
      console.log(
        `[PAYMENT CALL] attempt=${attempt}, orderId=${paymentPayload.orderId}, mode=${paymentPayload.mode}, requestId=${requestId}`
      );

      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/payments`,
        paymentPayload,
        {
          timeout: PAYMENT_TIMEOUT_MS,
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": requestId,
          },
        }
      );

      attempts.push({
        attempt,
        status: "success",
        httpStatus: response.status,
      });

      return {
        success: true,
        attempts,
        paymentResponse: response.data,
      };
    } catch (error) {
      lastError = error;

      const isTimeout = error.code === "ECONNABORTED";
      const httpStatus = error.response?.status || null;
      const message = isTimeout
        ? `Payment request timed out after ${PAYMENT_TIMEOUT_MS}ms`
        : error.response?.data?.message || error.message;

      attempts.push({
        attempt,
        status: "failed",
        httpStatus,
        timeout: isTimeout,
        message,
      });

      console.log(
        `[PAYMENT RETRY] attempt=${attempt} failed, reason=${message}, requestId=${requestId}`
      );

      if (attempt < PAYMENT_MAX_RETRIES) {
        console.log(
          `[PAYMENT BACKOFF] waiting ${delayBeforeNextRetry}ms before next retry, requestId=${requestId}`
        );

        await wait(delayBeforeNextRetry);
      }
    }
  }

  return {
    success: false,
    attempts,
    error: {
      message:
        lastError?.code === "ECONNABORTED"
          ? `Payment service timed out after ${PAYMENT_MAX_RETRIES} attempts`
          : lastError?.response?.data?.message ||
            lastError?.message ||
            "Payment failed after retries",
      code: lastError?.code || "PAYMENT_FAILED",
      httpStatus: lastError?.response?.status || null,
    },
  };
}

module.exports = {
  processPaymentWithRetry,
};