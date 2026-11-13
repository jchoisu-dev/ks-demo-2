const ATTENDANCE = require("../attendance/attendance.model");
const EMPLOYEE = require('../employee/employee.model');
const ADJUSTMENT = require('../adjustment/adjustment.model')
const PAYSLIP_SIGNATURE = require('./payslipSignature.model');
const COMPANY = require('../company/company.model');
const PAYSLIP_DELIVERY = require('./payslipDelivery.model');
const mongoose = require('mongoose')
const FIXED_PAY_TYPES = ['monthly', 'weekly'];
const payrollRecordsPipeline = ({ beginDay, endDay, includeIds = [], fixedIds = null }) => [
  {
    $match: {
      $or: [
        { deleted: false },
        { _id: { $in: includeIds.map(id => new mongoose.Types.ObjectId(id)) } }
      ]
    }
  },
  {
    $lookup: {
      from: "attendances",
      let: { employeeId: "$_id" },
      pipeline: [
        {
          $match: {
            deleted: false,
            $expr: {
              $and: [
                { $eq: ["$employeeId", "$$employeeId"] },
                { $gte: ["$date", new Date(beginDay)] },
                { $lt: ["$date", new Date(endDay)] }
              ]
            }
          }
        },
        {
          $project: {
            _id: 0,
            date: 1,
            totalWorkedMinutes: 1,
            overtimeMinutes: 1,
            billable: 1,
            type: 1
          }
        }
      ],
      as: "payrollRecords"
    }
  },
  {
    $match: {
      $or: [
        { "payrollRecords.0": { $exists: true } },
        fixedIds
          ? { _id: { $in: fixedIds.map(id => new mongoose.Types.ObjectId(id)) } }
          : { status: "active", deleted: false, "salary.payType": { $in: FIXED_PAY_TYPES } }
      ]
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
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $project: {
      _id: 1,
      payrollRecords: 1,
      employee: { $mergeObjects: ["$$ROOT", { user: "$user" }] }
    }
  },
  {
    $project: {
      "employee.payrollRecords": 0
    }
  },
  {
    $addFields: {
      hireSort: { $ifNull: ["$employee.hiredAt", new Date("9999-12-31")] }
    }
  },
  {
    $sort: {
      hireSort: 1,
      "employee.user.firstName": 1,
      _id: 1
    }
  },
  {
    $project: {
      hireSort: 0
    }
  }
];
exports.findPayrollRecords = async ({ beginDay, endDay, includeIds, fixedIds }) => {
  return await EMPLOYEE.aggregate(payrollRecordsPipeline({ beginDay, endDay, includeIds, fixedIds }));
};
exports.findAll = async (query) => {
  const { beginDay, endDay, limit, skip, includeIds, fixedIds } = query;
  const result = await EMPLOYEE.aggregate([
    ...payrollRecordsPipeline({ beginDay, endDay, includeIds, fixedIds }),
    {
      $facet: {
        data: [
          {
            $skip: skip
          },
          {
            $limit: limit
          }
        ],
        count: [
          {
            $count: "count"
          }
        ]
      }
    },
    {
      $project: {
        data: 1,
        count: {
          $ifNull: [
            {
              $arrayElemAt: ["$count.count", 0]
            },
            0
          ]
        }
      }
    }
  ]);
  return result;
};
exports.generatePDF = async (query) => {
  const { employeeId, beginDay, endDay } = query;
  const employees = await EMPLOYEE.aggregate([
    {
      $match: {
        deleted: false,
        status: "active",
        _id: new mongoose.Types.ObjectId(employeeId),
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
                    $gte: ["$date", new Date(beginDay)]
                  },
                  {
                    $lt: ["$date", new Date(endDay)]
                  }
                ]
              }
            }
          },
          {
            $project: {
              _id: 0,
              name: 1,
              date: 1,
              begin: 1,
              end: 1,
              totalWorkedMinutes: 1,
              totalBreakMinutes: 1,
              type: 1,
              billable:1 
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
        _id: 0,
        attendances: 1
      }
    }
  ]);
  return employees;
}

exports.findEmployeeById = async (id) => {
  const employee = await EMPLOYEE
    .findById(id)
    .populate({
      path: 'userId',
    })
    .lean();
  return employee;
}

exports.findEmployeeAdjustments = async ({employeeId, beginDay, endDay }) => {
  const adjustments = await ADJUSTMENT.find({
    employeeId,
    deleted: false,
    date: {
      $gte: beginDay,
      $lt: endDay,
    }
  })
  return adjustments;
}
exports.findSignature = async ({ employeeId, beginDay, endDay }) => {
  return await PAYSLIP_SIGNATURE.findOne({ employeeId, beginDay, endDay }).lean();
}
exports.upsertSignature = async ({ employeeId, beginDay, endDay, signature, recordedBy }) => {
  return await PAYSLIP_SIGNATURE.findOneAndUpdate(
    { employeeId, beginDay, endDay },
    { $set: { signature, recordedBy, signedAt: new Date() } },
    { new: true, upsert: true }
  ).lean();
}
exports.findAdjustments = async ({ beginDay, endDay }) => {
  return await ADJUSTMENT.find({
    deleted: false,
    date: {
      $gte: beginDay,
      $lt: endDay
    }
  }).sort({ date: 1 }).lean();
}
exports.findCompany = async () => {
  return await COMPANY.findOne({}, { name: 1, legalName: 1, taxNumber: 1, address: 1, contacts: 1, phone: 1, email: 1, logoUrl: 1, payslip: 1 }).lean();
}
exports.createDelivery = async (data) => {
  return await PAYSLIP_DELIVERY.create(data);
}
exports.findEmployeeContact = async (id) => {
  return await EMPLOYEE.findOne({ _id: id }).populate({ path: "userId", select: { firstName: 1, lastName: 1, email: 1, phone: 1 } }).lean();
}
