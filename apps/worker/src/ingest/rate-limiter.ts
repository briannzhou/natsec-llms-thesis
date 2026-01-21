/**
 * Simple rate limiter for API calls
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove expired timestamps
    this.timestamps = this.timestamps.filter(
      (ts) => now - ts < this.windowMs
    );

    if (this.timestamps.length >= this.maxRequests) {
      // Calculate wait time
      const oldestTimestamp = this.timestamps[0];
      const waitTime = this.windowMs - (now - oldestTimestamp);

      if (waitTime > 0) {
        await this.sleep(waitTime);
        return this.acquire();
      }
    }

    this.timestamps.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// X API rate limits for Pro tier
// Recent search: 300 requests per 15 minutes
// Full archive search: 1 request per second
export const recentSearchRateLimiter = new RateLimiter(300, 15 * 60 * 1000);
export const fullArchiveRateLimiter = new RateLimiter(1, 1000);
