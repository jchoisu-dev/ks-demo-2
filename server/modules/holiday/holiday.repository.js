const HOLIDAY = require("./holiday.model");
exports.findAll = async (query) => {
  const { limit, skip, name } = query;
  const filter = {
    deleted: false
  };

  if (name) {
    filter.name = {
      $regex: name,
      $options: "i"
    };
  }
  const [holidays, count] = await Promise.all([
    HOLIDAY
      .find(filter)
      .skip(skip)
      .limit(limit),
    HOLIDAY.countDocuments(filter)
  ]);
  return {
    holidays,
    count
  }
}
exports.createHoliday = async (data) => {
  const date = new Date(data.date);
  return await HOLIDAY.create({...data, date});
}
exports.findById = async (id) => {
  const holiday = await HOLIDAY.findById(id).lean();
  return holiday;
}
exports.find = async (data) => {
  const holiday = await HOLIDAY.find(data).lean();
  return holiday;
}
exports.update = async (id, data) => {
  const date = new Date(data.date);
  const holiday = await HOLIDAY.findByIdAndUpdate(
    id, 
    {...data, date}
  );
  return holiday;
}
exports.delete = async (id) => {
  const holiday = await HOLIDAY.findByIdAndUpdate(id, { deleted: true });
  return holiday;
}