const mongoose = require("mongoose");
const payrollPeriodSchema = require('../../database/models/payrollPeriod')
module.exports = mongoose.models.PayrollPeriod || mongoose.model("PayrollPeriod", payrollPeriodSchema);
