const mongoose = require("mongoose");
const adjustmentSchema = require('../../database/models/adjustment')
module.exports = mongoose.model("Adjustment", adjustmentSchema);