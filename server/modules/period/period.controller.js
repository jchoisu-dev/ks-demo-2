const services = require("./period.service");
exports.getPeriods = async (req, res, next) => {
  try {
    res.status(200).json(await services.getPeriods());
  } catch (error) {
    next(error);
  }
}
exports.closePeriod = async (req, res, next) => {
  try {
    res.status(201).json(await services.closePeriod(req.body, req.user.userId));
  } catch (error) {
    next(error);
  }
}
exports.reopenPeriod = async (req, res, next) => {
  try {
    res.status(200).json(await services.reopenPeriod(req.params.id));
  } catch (error) {
    next(error);
  }
}
