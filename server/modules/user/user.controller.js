const services = require("./user.service");
exports.getUsers = async (req, res, next) => {
  try {
    res.status(200).json(await services.getStaff(req.query));
  } catch (error) {
    next(error);
  }
}
exports.createUser = async (req, res, next) => {
  try {
    res.status(201).json(await services.createStaff(req.body));
  } catch (error) {
    next(error);
  }
}
exports.updateUser = async (req, res, next) => {
  try {
    res.status(200).json(await services.updateStaff(req.params.id, req.body, req.user.userId));
  } catch (error) {
    next(error);
  }
}
exports.resetPassword = async (req, res, next) => {
  try {
    res.status(200).json(await services.resetPassword(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}
exports.deleteUser = async (req, res, next) => {
  try {
    res.status(200).json(await services.deleteStaff(req.params.id, req.user.userId));
  } catch (error) {
    next(error);
  }
}
