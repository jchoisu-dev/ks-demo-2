const mongoose = require("mongoose");
const taxSchema = require('../../database/models/tax')
module.exports = mongoose.model("Tax", taxSchema);
