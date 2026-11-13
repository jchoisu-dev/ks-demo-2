const mongoose = require("mongoose");
const payslipDeliverySchema = require('../../database/models/payslipDelivery')
module.exports = mongoose.models.PayslipDelivery || mongoose.model("PayslipDelivery", payslipDeliverySchema);
