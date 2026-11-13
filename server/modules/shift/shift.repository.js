const SHIFT = require("./shift.model");
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
  const [shifts, count] = await Promise.all([
    SHIFT
      .find(filter)
      .skip(skip)
      .limit(limit),
    SHIFT.countDocuments(filter)
  ]);
  return {
    shifts,
    count
  }
}
exports.createShift = async (data) => {
  const { shiftId } = data;
  if (shiftId) {
    return await SHIFT.findOneAndUpdate(
      { shiftId },
      {
        ...data
      },
      { new: true, upsert: true }
    );
  }
  return await SHIFT.create({...data});
}
exports.findById = async (id) => {
  const shift = await SHIFT.findById(id).lean();;
  return shift;
}
exports.update = async (id, data) => {
  const shift = await SHIFT.findByIdAndUpdate(id, data);
  return shift;
}
exports.delete = async (id) => {
  const shift = await SHIFT.findByIdAndUpdate(id, { deleted: true });
  return shift;
}

exports.findAllShifts = async () => {
  const filter = {
    deleted: false
  };
  const shifts = await SHIFT.find(filter)
  return shifts;
}