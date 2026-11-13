const services = require("./log.service");
exports.getLogs = async (req, res, next) => {
  try {
    const data = await services.getLogs(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
