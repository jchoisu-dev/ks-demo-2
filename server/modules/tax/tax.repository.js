const TAX = require("./tax.model");
const COMPANY = require("../company/company.model");
exports.findAll = async () => {
  return await TAX.find().sort({ effectiveFrom: -1 }).lean();
}
exports.findById = async (id) => {
  return await TAX.findById(id).lean();
}
exports.findInForce = async (date) => {
  return await TAX.findOne({ effectiveFrom: { $lte: date } }).sort({ effectiveFrom: -1 }).lean();
}
exports.findByEffectiveFrom = async (effectiveFrom) => {
  return await TAX.findOne({ effectiveFrom }).lean();
}
exports.count = async () => {
  return await TAX.countDocuments();
}
exports.create = async (data) => {
  const tax = await TAX.create(data);
  return tax.toObject();
}
exports.update = async (id, data) => {
  return await TAX.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}
exports.delete = async (id) => {
  return await TAX.findByIdAndDelete(id).lean();
}
exports.build = (data) => {
  return new TAX(data);
}
exports.findPayrollOptions = async () => {
  const company = await COMPANY.findOne({}, { payroll: 1 }).lean();
  return company?.payroll || {};
}
