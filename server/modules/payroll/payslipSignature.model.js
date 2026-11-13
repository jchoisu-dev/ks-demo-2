const mongoose = require("mongoose");
const payslipSignatureSchema = require('../../database/models/payslipSignature')
module.exports = mongoose.model("PayslipSignature", payslipSignatureSchema);
