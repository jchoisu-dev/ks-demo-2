const EMPLOYEES = require("./employee.model");
const USER = require("../user/user.model");
const { findFilter } = require('./employee.utils');
exports.findAll = async (query) => {
  const { limit, skip } = query;
  const where = await findFilter({ ...query });
  const employees = await EMPLOYEES.aggregate([
    {
      $match: {
        status: "active",
        deleted: false
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      },
    },
    {
      $unwind: "$user"
    },
    {
      $match: where
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        count: [
          { $count: "count" }
        ]
      }
    },
    {
      $project: {
        data: 1,
        count: {
          $ifNull: [
            { $arrayElemAt: ["$count.count", 0] },
            0
          ]
        }
      }
    }
  ]);
  return employees;
}
exports.createEmployee = async (data) => {
  return await EMPLOYEES.create(data);
}
exports.findById = async (id) => {
  const employee = await EMPLOYEES
    .findById(id)
    .populate({
      path: 'userId',
      select: {
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        address: 1,
        profileImage: 1,
        updatedAt: 1
      }
    });
  return employee;
}
exports.update = async (id, data) => {
  const employee = await EMPLOYEES.findByIdAndUpdate(id, data, { new: true });
  const user = await USER.findByIdAndUpdate(employee.userId, data, { new: true });
  return {
    employee,
    user
  }
}
exports.delete = async (id) => {
  const employee = await EMPLOYEES.findByIdAndUpdate(id, { deleted: true }, { new: true });
  const userId = employee.userId;
  return await USER.findByIdAndUpdate(userId, { deleted: true }, { new: true });
}

exports.findEmployees = async () => {
  const employees = await EMPLOYEES.aggregate([
    {
      $match: {
        status: "active",
        deleted: false
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $sort: {
        "user.firstName": 1
      }
    },
    {
      $project: {
        userId: {
          firstName: "$user.firstName",
          lastName: "$user.lastName"
        },
        status: 1,
        deleted: 1
      }
    }
  ]);
  return employees;
}