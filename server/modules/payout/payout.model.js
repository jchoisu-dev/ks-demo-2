const mongoose = require("mongoose");
const schema = require("../../database/models/payout");
module.exports = mongoose.models.Payout || mongoose.model("Payout", schema);
