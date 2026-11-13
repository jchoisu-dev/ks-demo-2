const router = require("express").Router();
const controller = require("./r2.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
const authorize = require("@/shared/middleware/authorize.middleware");
const { EDITOR_ROLES } = require("@/shared/constants");
router.post("/", authenticate, authorize(EDITOR_ROLES), controller.createUploadUrl);
module.exports = router;