const COMPANY = require("./workhours.model");
exports.findOne = async () => {
  const company = await COMPANY.findOne({}, { payroll: 1, updatedAt: 1 }).lean();
  return company || null;
}
