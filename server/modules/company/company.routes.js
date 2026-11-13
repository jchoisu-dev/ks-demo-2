const router = require("express").Router();
const controller = require("./company.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
const authorize = require("@/shared/middleware/authorize.middleware");
const { ROLE_ADMIN } = require("@/shared/constants");
router.get("/", authenticate, controller.getCompany);
router.put("/", authenticate, authorize(ROLE_ADMIN), controller.updateCompany);
module.exports = router;
