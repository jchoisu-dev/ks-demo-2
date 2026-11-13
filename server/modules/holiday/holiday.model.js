const mongoose = require("mongoose");
const holidaySchema = require('../../database/models/holiday')
module.exports = mongoose.model("Holiday", holidaySchema);