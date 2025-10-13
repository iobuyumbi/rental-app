// Simple in-memory rate limiter suitable for single-instance deployments
// For production with multiple instances, use a shared store (e.g., Redis)

const createRateLimiter = ({ windowMs, maxRequests }) => {
  const ipToHits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const key =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "unknown";

    let hits = ipToHits.get(key);
    if (!hits) {
      hits = [];
      ipToHits.set(key, hits);
    }

    // prune old hits
    while (hits.length && hits[0] < windowStart) {
      hits.shift();
    }

    if (hits.length >= maxRequests) {
      res.set("Retry-After", Math.ceil(windowMs / 1000).toString());
      return res
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
    }

    hits.push(now);
    next();
  };
};

const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 300,
});
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
});

module.exports = { generalRateLimiter, authRateLimiter };
