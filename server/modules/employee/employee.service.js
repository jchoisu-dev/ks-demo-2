const crypto = require('crypto');
const dayjs = require('dayjs');
const employeeRepo = require("./employee.repository");
const userRepo = require('../user/user.service');
const { formatDate, formatLocalDate } = require('../../shared/utils');
const { ApiError } = require('../../shared/utils');
const { payTypes, employeeTypes } = require('@/shared/constants');
exports.getEmployees = async (query) => 
{
  const page = parseInt(query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const [result] = await employeeRepo.findAll({ ...query, limit, skip });
  if (result) {
    const { data: employees, count: totalRecords } = result;
    const list = [];
    for (const i in employees) {
      const employee = employees[i];
      list.push({
        id: employee._id,
        firstName: employee.user.firstName,
        lastName: employee.user.lastName,
        type: employeeTypes[employee.type],
        email: employee.user.email,
        phone: employee.user.phone,

        pay_type: payTypes[employee.salary.payType],
        currency: employee.salary.currency,
        amount: employee.salary.amount,
        hiredAt: await formatDate(employee?.hiredAt),
        createdAt: await formatLocalDate(employee.createdAt)
      })
    }
    return {
      data: list,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        hasNextPage: page * limit < totalRecords,
        hasPreviousPage: page > 1
      }
    };
  }
}
exports.getEmployeeById = async (id) => {
  const employee = await employeeRepo.findById(id);
  if (!employee) throw new ApiError(404, "Employee not found");
  return {
    firstName: employee.userId.firstName,
    lastName: employee.userId.lastName,
    email: employee.userId.email,
    phone: employee.userId.phone,
    address: employee.userId.address,
    profileImage: employee.userId.profileImage ?  (process.env.ASSET_BASE_URL || '').replace(/\/?$/, '/') + employee.userId.profileImage + '?v=' + employee.updatedAt : null,
    incentive_weekdays: employee.incentive_weekdays,
    birthdate: employee?.birthdate ? dayjs.utc(employee?.birthdate).format("YYYY-MM-DD") : null,
    hiredAt: employee?.hiredAt ? dayjs.utc(employee?.hiredAt).format("YYYY-MM-DD") : null,
    startWorkDay: employee?.startWorkDay ? dayjs.utc(employee?.startWorkDay).format("YYYY-MM-DD") : null,
    endWorkDay: employee?.endWorkDay ? dayjs.utc(employee?.endWorkDay).format("YYYY-MM-DD") : null,
    description: employee.description,
    type: employee.type,
    salary: employee.salary,
    leaveDaysPerYear: employee.leaveDaysPerYear ?? null,
    bank: {
      name: employee.bank?.name || "",
      accountNumber: employee.bank?.accountNumber || "",
      accountHolder: employee.bank?.accountHolder || ""
    }
  };
}
const normalizeExtras = (data) => {
  const result = { ...data };
  if (data.leaveDaysPerYear !== undefined) {
    if (data.leaveDaysPerYear === "" || data.leaveDaysPerYear === null) {
      result.leaveDaysPerYear = null;
    } else {
      const days = Number(data.leaveDaysPerYear);
      if (!Number.isFinite(days) || days < 0 || days > 366) throw new ApiError(400, "Leave days per year must be between 0 and 366");
      result.leaveDaysPerYear = days;
    }
  }
  if (data.bank !== undefined) {
    const bank = data.bank || {};
    result.bank = {
      name: String(bank.name ?? "").trim(),
      accountNumber: String(bank.accountNumber ?? "").trim(),
      accountHolder: String(bank.accountHolder ?? "").trim()
    };
  }
  return result;
}
exports.createEmployee = async (input) => {
  const data = normalizeExtras(input);
  const { firstName, lastName, email, phone, address, description, type, hiredAt, birthdate, startWorkDay, endWorkDay, salary, incentive_weekdays, profileImage, leaveDaysPerYear, bank } = data;
  const user = await userRepo.createUser({
    firstName,
    lastName,
    email,
    phone,
    address,
    password: crypto.randomBytes(18).toString('base64url')
  });
  if (user) {
    const userId = user._id;
    return await employeeRepo.createEmployee({
      userId,
      hiredAt,
      birthdate,
      startWorkDay,
      endWorkDay,
      description,
      type,
      salary,
      incentive_weekdays,
      profileImage,
      leaveDaysPerYear,
      bank
    });
  }
}
exports.updateEmployee = async (id, data) => {
  const updated = await employeeRepo.update(id, normalizeExtras(data));
  if (!updated) throw new ApiError(404, "Employee not found");
  return updated;
}
exports.deleteEmployee = async (id) => {
  const deleted = await employeeRepo.delete(id);
  if (!deleted) throw new ApiError(404, "Employee not found");
  return deleted;
}