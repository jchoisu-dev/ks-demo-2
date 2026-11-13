const services = require("./holiday.service");
exports.getHolidays = async (req, res, next) => {
  try {
    const data = await services.getHolidays(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.getByHolidayId = async (req, res, next) => {
  try {
    const data = await services.getHolidayById(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

exports.createHoliday = async (req, res, next) => {
  try {
    const data = await services.createHoliday(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
exports.updateHoliday = async (req, res, next) => {
  try {
    const data = await services.updateHoliday(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
exports.deleteHoliday = async (req, res, next) => {
  try {
    const data = await services.deleteHoliday(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.getAllHolidays = async (req, res, next) => {
  try {
    const data = await services.getAllHolidays();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}