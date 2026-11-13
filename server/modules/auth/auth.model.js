const mongoose = require("mongoose");
const UserSchema = require('../../database/models/user')
module.exports = mongoose.model("User", UserSchema);