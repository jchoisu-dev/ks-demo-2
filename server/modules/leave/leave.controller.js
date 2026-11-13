const services = require("./leave.service");
exports.getBalances = async (req, res, next) => {
  try {
    res.status(200).json(await services.getBalances(req.query));
  } catch (error) {
    next(error);
  }
}
