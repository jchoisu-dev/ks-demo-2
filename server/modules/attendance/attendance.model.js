const mongoose = require("mongoose");
const attendanceSchema = require('../../database/models/attendance')
module.exports = mongoose.model("Attendance", attendanceSchema);