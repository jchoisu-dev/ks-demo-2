const router = require("express").Router();
const controller = require("./log.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
const authorize = require("@/shared/middleware/authorize.middleware");
const { ROLE_ADMIN } = require("@/shared/constants");
router.get("/", authenticate, authorize(ROLE_ADMIN), controller.getLogs);
module.exports = router;
