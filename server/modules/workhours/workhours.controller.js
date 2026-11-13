const services = require("./workhours.service");
exports.getWorkHours = async (req, res, next) => {
  try {
    const data = await services.getWorkHours();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.updateWorkHours = async (req, res, next) => {
  try {
    const data = await services.updateWorkHours(req.body, req.user?.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
