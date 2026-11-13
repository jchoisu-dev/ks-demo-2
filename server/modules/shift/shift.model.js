const mongoose = require("mongoose");
const shiftSchema = require('../../database/models/shift')
module.exports = mongoose.model("Shift", shiftSchema);