class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.delay = options.delay || 1000;
    this.backoff = options.backoff || 2;
  }

  async execute(fn) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          break;
        }

        const delay = this.delay * Math.pow(this.backoff, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
module.exports = { RetryManager };