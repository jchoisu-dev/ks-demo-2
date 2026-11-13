const employeeService = require("./employee.service");
const getEmployees = async (req, res, next) => {
  try {
    const data = await employeeService.getEmployees(req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
const getByEmployeeId = async (req, res, next) => {
  try {
    const data = await employeeService.getEmployeeById(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

const createEmployee = async (req, res, next) => {
  try {
    const data = await employeeService.createEmployee(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}
const updateEmployee = async (req, res, next) => {
  try {
    const data = await employeeService.updateEmployee(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
const deleteEmployee = async (req, res, next) => {
  try {
    const data = await employeeService.deleteEmployee(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
module.exports = {
  getEmployees,
  getByEmployeeId,
  createEmployee,
  updateEmployee,
  deleteEmployee
}