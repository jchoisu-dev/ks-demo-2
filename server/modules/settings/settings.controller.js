const services = require("./settings.service");
const dashboard = async (req, res, next) => {
  try {
    const data = await services.dashboard();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
module.exports = {
  dashboard
}