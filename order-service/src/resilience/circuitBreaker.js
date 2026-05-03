class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownTimeMs = options.cooldownTimeMs || 10000;

    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  canCallService() {
    if (this.state === "CLOSED") {
      return true;
    }

    if (this.state === "OPEN") {
      const now = Date.now();
      const timeSinceLastFailure = now - this.lastFailureTime;

      if (timeSinceLastFailure >= this.cooldownTimeMs) {
        this.state = "HALF_OPEN";
        console.log("[CIRCUIT BREAKER] Moving from OPEN to HALF_OPEN");
        return true;
      }

      return false;
    }

    if (this.state === "HALF_OPEN") {
      return true;
    }

    return false;
  }

  recordSuccess() {
    this.failureCount = 0;

    if (this.state === "HALF_OPEN" || this.state === "OPEN") {
      console.log("[CIRCUIT BREAKER] Success detected. Moving to CLOSED");
    }

    this.state = "CLOSED";
    this.lastFailureTime = null;
  }

  recordFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    console.log(
      `[CIRCUIT BREAKER] Failure recorded. failureCount=${this.failureCount}, state=${this.state}`
    );

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      console.log("[CIRCUIT BREAKER] HALF_OPEN request failed. Moving to OPEN");
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.log("[CIRCUIT BREAKER] Failure threshold reached. Moving to OPEN");
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      cooldownTimeMs: this.cooldownTimeMs,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

module.exports = CircuitBreaker;