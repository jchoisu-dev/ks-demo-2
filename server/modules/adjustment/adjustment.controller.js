const services = require("./adjustment.service");
exports.getAdjustments = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month, calendarDay, page } = req.query;
    const data = await services.getAdjustments({ employeeId, month, calendarDay, page });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.createAdjustment = async (req, res, next) => {
  try {
    const data = await services.createAdjustment(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
exports.deleteAdjustment = async (req, res, next) => {
  try {
    const data = await services.deleteAdjustment(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}