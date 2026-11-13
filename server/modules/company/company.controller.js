const services = require("./company.service");
exports.getCompany = async (req, res, next) => {
  try {
    const data = await services.getCompany();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.updateCompany = async (req, res, next) => {
  try {
    const data = await services.updateCompany(req.body, req.user?.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
