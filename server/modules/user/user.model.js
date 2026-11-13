const mongoose = require("mongoose");
const userSchema = require('../../database/models/user')
module.exports = mongoose.model("User", userSchema);