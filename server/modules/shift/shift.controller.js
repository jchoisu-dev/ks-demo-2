const services = require("./shift.service");
exports.getShifts = async (req, res, next) => {
  try {
    const data = await services.getShifts(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.getByShiftId = async (req, res, next) => {
  try {
    const data = await services.getShiftById(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

exports.createShift = async (req, res, next) => {
  try {
    const data = await services.createShift(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
exports.updateShift = async (req, res, next) => {
  try {
    const data = await services.updateShift(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
exports.deleteShift = async (req, res, next) => {
  try {
    const data = await services.deleteShift(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.getAllShifts = async (req, res, next) => {
  try {
    const data = await services.getAllShifts();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}