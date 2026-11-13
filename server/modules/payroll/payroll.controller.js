const services = require("./payroll.service");
const overview = async (req, res, next) => {
  try {
    const data = await services.overview({...req.query});
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
const pdf = async (req, res, next) => {
  try {
    await services.pdf({res, query: {...req.body}});
  } catch (error) {
    next(error);
  }
}
const signPdf = async (req, res, next) => {
  try {
    await services.signPdf({ res, body: { ...req.body }, userId: req.user?.userId });
  } catch (error) {
    next(error);
  }
}
const exportXlsx = async (req, res, next) => {
  try {
    await services.exportXlsx({ res, query: { ...req.query } });
  } catch (error) {
    next(error);
  }
}
const deliveryOptions = async (req, res, next) => {
  try {
    res.status(200).json(await services.deliveryOptions());
  } catch (error) {
    next(error);
  }
}
const emailPayslip = async (req, res, next) => {
  try {
    res.status(200).json(await services.emailPayslip(req.body, req.user?.userId));
  } catch (error) {
    next(error);
  }
}
const emailAllPayslips = async (req, res, next) => {
  try {
    res.status(200).json(await services.emailAllPayslips(req.body, req.user?.userId));
  } catch (error) {
    next(error);
  }
}
const bankFile = async (req, res, next) => {
  try {
    await services.bankFile({ res, query: { ...req.query } });
  } catch (error) {
    next(error);
  }
}
module.exports = {
  overview,
  deliveryOptions,
  emailPayslip,
  emailAllPayslips,
  bankFile,
  exportXlsx,
  pdf,
  signPdf
}