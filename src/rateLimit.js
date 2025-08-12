import rateLimit from "express-rate-limit";

// General rate limit when logged in
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: "Too many requests from this IP, try again in 15 minutes"
});

// Rate limit for logging 
export const loginRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 7,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: "Too many login attempts, try again in 10 minutes"
});

// Rate limit for uploading csv files
export const uploadRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: "Too many uploads, try again in 1 hour"
});


