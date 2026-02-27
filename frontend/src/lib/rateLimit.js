/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a sliding window counter per IP address.
 *
 * For production with multiple instances, replace the Map with Redis.
 */

const store = new Map(); // Map<ip, { count, resetAt }>

/**
 * Check if a request is within rate limit.
 * @param {string} ip - Client IP
 * @param {object} opts
 * @param {number} opts.limit   - Max requests per window (default 60)
 * @param {number} opts.window  - Window in seconds (default 60)
 * @returns {{ ok: boolean, remaining: number, resetAt: number }}
 */
export function rateLimit(ip, { limit = 60, window = 60 } = {}) {
  const now = Date.now();
  const windowMs = window * 1000;

  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Get client IP from Next.js request headers.
 */
export function getIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}
