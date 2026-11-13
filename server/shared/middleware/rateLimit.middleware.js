const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const WINDOW_MS = 15 * 60 * 1000;
const message = (minutes) => ({
  success: false,
  message: `Too many attempts. Please wait ${minutes} minutes and try again.`
});
const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: Number(process.env.LOGIN_MAX_ATTEMPTS) || 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email || "").trim().toLowerCase()}`,
  message: message(15)
});
const passwordLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.user?.userId || ""}`,
  message: message(15)
});
module.exports = {
  loginLimiter,
  passwordLimiter
}
