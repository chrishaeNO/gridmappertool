import { NextRequest } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): { success: boolean; remaining: number } => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const now = Date.now();
    const key = `${ip}`;
    
    const current = rateLimitMap.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or create new entry
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { success: true, remaining: config.maxRequests - 1 };
    }
    
    if (current.count >= config.maxRequests) {
      return { success: false, remaining: 0 };
    }
    
    current.count++;
    return { success: true, remaining: config.maxRequests - current.count };
  };
}

// Predefined rate limiters
export const authRateLimit = rateLimit({
  maxRequests: 5, // 5 attempts
  windowMs: 15 * 60 * 1000 // 15 minutes
});

export const apiRateLimit = rateLimit({
  maxRequests: 100, // 100 requests
  windowMs: 15 * 60 * 1000 // 15 minutes
});

export const passwordResetRateLimit = rateLimit({
  maxRequests: 3, // 3 attempts
  windowMs: 60 * 60 * 1000 // 1 hour
});

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes
