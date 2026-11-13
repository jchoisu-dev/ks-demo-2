const router = require("express").Router();
const controller = require("./period.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
const authorize = require("@/shared/middleware/authorize.middleware");
const { ROLE_ADMIN, EDITOR_ROLES } = require("@/shared/constants");
router.get("/", authenticate, controller.getPeriods);
router.post("/", authenticate, authorize(EDITOR_ROLES), controller.closePeriod);
router.delete("/:id", authenticate, authorize(ROLE_ADMIN), controller.reopenPeriod);
module.exports = router;
