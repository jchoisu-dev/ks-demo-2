const router = require("express").Router();
const controller = require("./payout.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
const authorize = require("@/shared/middleware/authorize.middleware");
const { EDITOR_ROLES } = require("@/shared/constants");
router.get("/:employeeId", authenticate, controller.getPayout);
router.post("/:employeeId", authenticate, authorize(EDITOR_ROLES), controller.addLine);
router.delete("/:employeeId/lines/:lineId", authenticate, authorize(EDITOR_ROLES), controller.deleteLine);
module.exports = router;
