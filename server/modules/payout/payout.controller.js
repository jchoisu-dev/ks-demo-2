const services = require("./payout.service");
const handle = (fn, status = 200) => async (req, res, next) => {
  try {
    res.status(status).json(await fn(req));
  } catch (error) {
    next(error);
  }
};
exports.getPayout = handle(req => services.getPayout({ employeeId: req.params.employeeId, ...req.query }));
exports.addLine = handle(req => services.addLine({ ...req.body, employeeId: req.params.employeeId }), 201);
exports.deleteLine = handle(req => services.deleteLine({ employeeId: req.params.employeeId, lineId: req.params.lineId, ...req.query }));
