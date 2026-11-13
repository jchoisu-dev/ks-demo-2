const services = require("./tax.service");
exports.listVersions = async (req, res, next) => {
  try {
    const data = await services.listVersions();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.getCurrent = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const data = await services.getTaxSettings(isNaN(date) ? new Date() : date);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.createVersion = async (req, res, next) => {
  try {
    const data = await services.createVersion(req.body, req.user?.userId);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
exports.updateVersion = async (req, res, next) => {
  try {
    const data = await services.updateVersion(req.params.id, req.body, req.user?.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.deleteVersion = async (req, res, next) => {
  try {
    const data = await services.deleteVersion(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.preview = async (req, res, next) => {
  try {
    const data = await services.preview(req.body);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.getPayrollOptions = async (req, res, next) => {
  try {
    const data = await services.getPayrollOptions();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
exports.updatePayrollOptions = async (req, res, next) => {
  try {
    const data = await services.updatePayrollOptions(req.body, req.user?.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
