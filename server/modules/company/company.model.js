const mongoose = require("mongoose");
const companySchema = require('../../database/models/company')
module.exports = mongoose.model("Company", companySchema);
