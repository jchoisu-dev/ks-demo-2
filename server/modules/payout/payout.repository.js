const PAYOUT = require("./payout.model");
exports.findOne = async ({ employeeId, beginDay, endDay }) => {
  return await PAYOUT.findOne({ employeeId, beginDay, endDay, deleted: false }).lean();
};
exports.findDocument = async ({ employeeId, beginDay, endDay }) => {
  return await PAYOUT.findOne({ employeeId, beginDay, endDay, deleted: false });
};
exports.findForPeriod = async ({ employeeIds, beginDay, endDay }) => {
  return await PAYOUT.find({ employeeId: { $in: employeeIds }, beginDay, endDay, deleted: false }).lean();
};
exports.create = async (data) => {
  return await PAYOUT.create(data);
};
