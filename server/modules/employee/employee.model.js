const mongoose = require("mongoose");
const employeeSchema = require('../../database/models/employee')
module.exports = mongoose.model("Employee", employeeSchema);