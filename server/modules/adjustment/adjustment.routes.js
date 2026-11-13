const router = require("express").Router();
const controller = require("./adjustment.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
const authorize = require("@/shared/middleware/authorize.middleware");
const { EDITOR_ROLES } = require("@/shared/constants");
router.get("/:employeeId", authenticate, controller.getAdjustments);
router.post("/", authenticate, authorize(EDITOR_ROLES), controller.createAdjustment);
router.delete("/:id", authenticate, authorize(EDITOR_ROLES), controller.deleteAdjustment);
module.exports = router;