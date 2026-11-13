const ATTENDANCES = require("./attendance.model");
const EMPLOYEE = require("../employee/employee.model");
exports.findAll = async ({
  startOfWeek,
  endOfWeek
}) => {
  const employees = await EMPLOYEE.aggregate([
    {
      $match: {
        deleted: false,
        status: "active"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 0,
              firstName: 1,
              lastName: 1
            }
          }
        ],
        as: "userId"
      }
    },
    {
      $unwind: {
        path: "$userId",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "attendances",
        let: {
          employeeId: "$_id"
        },
        pipeline: [
          {
            $match: {
              deleted: false,
              $expr: {
                $and: [
                  {
                    $eq: ["$employeeId", "$$employeeId"]
                  },
                  {
                    $gte: ["$date", new Date(startOfWeek)]
                  },
                  {
                    $lt: ["$date", new Date(endOfWeek)]
                  }
                ]
              }
            }
          },
          {
            $project: {
              _id: 0,
              name:1,
              date: 1,
              begin: 1,
              end: 1,
              totalWorkedMinutes: 1,
              totalBreakMinutes: 1,
              type: 1
            }
          },
          {
            $sort: {
              date: 1,
              begin: 1
            }
          }
        ],
        as: "attendances"
      }
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        attendances: 1
      }
    }
  ]);
  return employees;
}
exports.createAttendance = async (data) => {
  return await ATTENDANCES.create(data);
}
exports.findEmployeeAttendance = async (d) => {
  const { employeeId, date } = d;
  const attendance = await ATTENDANCES
    .find({
      employeeId,
      date,
      deleted: false
    })
  return attendance;
}
exports.findDocument = async (id) => {
  return await ATTENDANCES.findOne({ _id: id, deleted: false }).catch(() => null);
}
exports.findDate = async (id) => {
  return await ATTENDANCES.findOne({ _id: id, deleted: false }, { date: 1 }).lean().catch(() => null);
}
exports.delete = async (id) => {
  const attendance = await ATTENDANCES.findByIdAndUpdate(id, { deleted: true }, { new: true });
  return attendance;
}