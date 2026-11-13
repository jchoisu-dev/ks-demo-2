const router = require("express").Router();
const controller = require("./dashboard.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
router.get("/", authenticate, controller.dashboard);
router.get("/breakdown", authenticate, controller.breakdown);
router.get("/adjustments", authenticate, controller.adjustments);
module.exports = router;