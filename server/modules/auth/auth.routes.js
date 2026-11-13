const router = require("express").Router();
const { login, me, changePassword } = require("./auth.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
const { loginLimiter, passwordLimiter } = require("@/shared/middleware/rateLimit.middleware");
router.post("/login", loginLimiter, login);
router.get("/me", authenticate, me);
router.put("/password", authenticate, passwordLimiter, changePassword);
module.exports = router;
