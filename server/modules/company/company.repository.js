const COMPANY = require("./company.model");
exports.findOne = async () => {
  return await COMPANY.findOne().lean();
}
exports.upsert = async (data) => {
  return await COMPANY.findOneAndUpdate(
    {},
    { $set: data },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  ).lean();
}
exports.upsertWithDefaults = async (data, defaults) => {
  return await COMPANY.findOneAndUpdate(
    {},
    { $set: data, $setOnInsert: defaults },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  ).lean();
}
exports.build = (data) => {
  return new COMPANY(data);
}
