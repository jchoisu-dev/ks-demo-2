const router = require("express").Router();
const controller = require("./settings.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
router.get("/", authenticate, controller.dashboard);
module.exports = router;