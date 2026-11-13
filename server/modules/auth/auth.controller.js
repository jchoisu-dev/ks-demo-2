const authService = require("./auth.service");
exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
exports.me = async (req, res, next) => {
  try {
    const result = await authService.me(req.user.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
exports.changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
