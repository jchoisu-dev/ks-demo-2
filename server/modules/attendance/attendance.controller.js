const services = require("./attendance.service");
exports.getAttendances = async (req, res, next) => {
  try {
    const data = await services.getAttendances(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.getEmployeeAttendance = async (req, res, next) => {
  try {
    const data = await services.getEmployeeAttendance({
      ...req.params,
      ...req.query
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.createAttendance = async (req, res, next) => {
  try {
    const data = await services.createAttendance(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
exports.deleteAttendance = async (req, res, next) => {
  try {
    const data = await services.deleteAttendance(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.updateAttendance = async (req, res, next) => {
  try {
    const data = await services.updateAttendance(req.params.id, req.body);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
