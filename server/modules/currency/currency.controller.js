const services = require("./currency.service");
exports.getRates = async (req, res, next) => {
  try {
    res.status(200).json(await services.getRates());
  } catch (error) {
    next(error);
  }
};
exports.updateRates = async (req, res, next) => {
  try {
    res.status(200).json(await services.updateRates(req.body, req.user?.userId));
  } catch (error) {
    next(error);
  }
};
