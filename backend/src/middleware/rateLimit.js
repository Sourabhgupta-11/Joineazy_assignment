const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true, 
  legacyHeaders: false,
  message: {message: 'Too many requests. Please slow down and try again shortly'},
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {message: 'Too many authentication attempts. Please try again in a few minutes'},
});

module.exports = {generalLimiter, authLimiter};