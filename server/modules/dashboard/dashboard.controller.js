const services = require("./dashboard.service");
const dashboard = async (req, res, next) => {
  try {
    const data = await services.dashboard(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
const breakdown = async (req, res, next) => {
  try {
    const data = await services.breakdown(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
const adjustments = async (req, res, next) => {
  try {
    const data = await services.adjustments(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
module.exports = {
  dashboard,
  breakdown,
  adjustments
}