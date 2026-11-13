const mongoose = require("mongoose");
const logSchema = require('../../database/models/log')
module.exports = mongoose.models.Log || mongoose.model("Log", logSchema);
