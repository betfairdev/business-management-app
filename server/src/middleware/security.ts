import rateLimit from 'express-rate-limit';

export const queryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const executeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 execute requests per windowMs
  message: {
    success: false,
    error: 'Too many execute requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});