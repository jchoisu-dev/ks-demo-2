const router = require("express").Router();
const controller = require("./leave.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
router.get("/", authenticate, controller.getBalances);
module.exports = router;
