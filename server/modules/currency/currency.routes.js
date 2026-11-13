const router = require("express").Router();
const controller = require("./currency.controller");
const authenticate = require("@/shared/middleware/auth.middleware");
const authorize = require("@/shared/middleware/authorize.middleware");
const { ROLE_ADMIN } = require("@/shared/constants");
router.get("/", authenticate, controller.getRates);
router.put("/", authenticate, authorize(ROLE_ADMIN), controller.updateRates);
module.exports = router;
