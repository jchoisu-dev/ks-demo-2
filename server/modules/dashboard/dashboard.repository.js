const EMPLOYEE = require("../employee/employee.model");
const ATTENDANCE = require("../attendance/attendance.model");
const HOLIDAY = require("../holiday/holiday.model");
const ADJUSTMENT = require("../adjustment/adjustment.model");
exports.countEmployeesBy = async (field, match = {}) => {
  return await EMPLOYEE.aggregate([
    {
      $match: {
        deleted: false,
        ...match
      }
    },
    {
      $group: {
        _id: `$${field}`,
        count: { $sum: 1 }
      }
    }
  ]);
}
exports.countNewHires = async ({ beginDay, endDay }) => {
  return await EMPLOYEE.countDocuments({
    deleted: false,
    hiredAt: {
      $gte: beginDay,
      $lt: endDay
    }
  });
}
exports.findBirthdays = async (month) => {
  return await EMPLOYEE.aggregate([
    {
      $match: {
        deleted: false,
        status: "active",
        birthdate: { $ne: null },
        $expr: {
          $eq: [{ $month: "$birthdate" }, month]
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $addFields: {
        day: { $dayOfMonth: "$birthdate" }
      }
    },
    {
      $sort: {
        day: 1
      }
    },
    {
      $project: {
        firstName: "$user.firstName",
        lastName: "$user.lastName",
        birthdate: 1
      }
    }
  ]);
}
exports.countAttendanceStatusByDay = async (date) => {
  return await ATTENDANCE.aggregate([
    {
      $match: {
        deleted: false,
        date
      }
    },
    {
      $lookup: {
        from: "employees",
        localField: "employeeId",
        foreignField: "_id",
        as: "employee"
      }
    },
    {
      $unwind: "$employee"
    },
    {
      $match: {
        "employee.deleted": false,
        "employee.status": "active"
      }
    },
    {
      $sort: {
        createdAt: 1
      }
    },
    {
      $group: {
        _id: "$employeeId",
        type: { $last: "$type" }
      }
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 }
      }
    }
  ]);
}
exports.countAttendanceByType = async ({ beginDay, endDay }) => {
  return await ATTENDANCE.aggregate([
    {
      $match: {
        deleted: false,
        date: {
          $gte: beginDay,
          $lt: endDay
        }
      }
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 }
      }
    }
  ]);
}
exports.findUpcomingHolidays = async (fromDate, limit) => {
  return await HOLIDAY
    .find({
      deleted: false,
      active: true,
      date: { $gte: fromDate }
    })
    .sort({ date: 1 })
    .limit(limit)
    .lean();
}
const adjustmentsPipeline = ({ beginDay, endDay }) => [
    {
      $match: {
        deleted: false,
        date: {
          $gte: beginDay,
          $lt: endDay
        }
      }
    },
    {
      $lookup: {
        from: "employees",
        localField: "employeeId",
        foreignField: "_id",
        as: "employee"
      }
    },
    {
      $unwind: {
        path: "$employee",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "employee.userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $sort: {
        date: -1,
        createdAt: -1
      }
    },
    {
      $project: {
        employeeId: 1,
        date: 1,
        type: 1,
        amount: 1,
        reason: 1,
        currency: "$employee.salary.currency",
        originalCurrency: "$currency",
        originalAmount: 1,
        scope: 1,
        firstName: "$user.firstName",
        lastName: "$user.lastName"
      }
    }
];
exports.findAdjustments = async ({ beginDay, endDay }) => {
  return await ADJUSTMENT.aggregate(adjustmentsPipeline({ beginDay, endDay }));
}
exports.findAdjustmentsPage = async ({ beginDay, endDay, skip, limit }) => {
  const [result] = await ADJUSTMENT.aggregate([
    ...adjustmentsPipeline({ beginDay, endDay }),
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        count: [{ $count: "count" }]
      }
    }
  ]);
  return { data: result?.data || [], count: result?.count?.[0]?.count || 0 };
}
