// 60% failure rate for breaker
function unstableService() {
  return new Promise((resolve, reject) => {
    const random = Math.random()

    setTimeout(() => {
      if (random < 0.6) {
        reject(new Error("Service Failed ❌"))
      } else {
        resolve("Service Success ✅")
      }
    }, 300)
  })
}

class CircuitBreaker {
  constructor({ failureThreshold, successThreshold, timeout }) {
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeout = timeout;

    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
    this.successCount = 0;
    this.failureCount = 0;
  }

  async call(action) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF-OPEN';
        console.log("🔄 Switching to HALF_OPEN");
      } else {
        throw new Error("Circuit is OPEN 🚫");
      }
    }
    try {
      const result = await action()
      this.onSuccess()
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    if (this.state === 'HALF-OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.reset();
        console.log("✅ Circuit CLOSED again");
      }
    } else {
      this.reset();
    }
  }

  onFailure() {
    this.failureCount++;
    console.log(`❌ Failure count: ${this.failureCount}`);
    if (this.failureCount >= this.failureThreshold) {
      this.trip();
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.successCount = 0;
    this.failureCount = 0;
  }

  trip() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.timeout;
    console.log("🚨 Circuit OPEN");
  }
}

const breaker = new CircuitBreaker({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 3000, // 3 seconds
});

setInterval(async () => {
  try {
    const res = await breaker.call(unstableService);
    console.log(res);
  } catch (err) {
    console.log(err.message);
  }
}, 1000);
