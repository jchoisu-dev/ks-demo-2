const EMPLOYEE = require("../employee/employee.model");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
exports.findBalances = async ({ beginDay, endDay, q, skip, limit }) => {
  const search = q ? new RegExp(escapeRegex(q), "i") : null;
  const [result] = await EMPLOYEE.aggregate([
    { $match: { deleted: false, status: "active" } },
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ...(search ? [{ $match: { $or: [{ "user.firstName": search }, { "user.lastName": search }] } }] : []),
    {
      $lookup: {
        from: "attendances",
        let: { employeeId: "$_id" },
        pipeline: [
          {
            $match: {
              deleted: false,
              type: { $in: ["leave", "sick"] },
              $expr: {
                $and: [
                  { $eq: ["$employeeId", "$$employeeId"] },
                  { $gte: ["$date", beginDay] },
                  { $lt: ["$date", endDay] }
                ]
              }
            }
          },
          { $group: { _id: { type: "$type", date: "$date" } } },
          { $group: { _id: "$_id.type", days: { $sum: 1 } } }
        ],
        as: "absences"
      }
    },
    { $sort: { "user.firstName": 1, "user.lastName": 1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              firstName: "$user.firstName",
              lastName: "$user.lastName",
              hiredAt: 1,
              endWorkDay: 1,
              leaveDaysPerYear: 1,
              absences: 1
            }
          }
        ],
        count: [{ $count: "count" }]
      }
    }
  ]);
  return { data: result?.data || [], count: result?.count?.[0]?.count || 0 };
}
