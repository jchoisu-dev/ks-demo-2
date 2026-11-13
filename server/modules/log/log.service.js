const repo = require("./log.repository");
const requestContext = require("../../shared/utils/requestContext");
const { ApiError, dayjs } = require('../../shared/utils');
const { CONSTANT_UTC_OFFSET_MINUTES: CONTEXT_OFFSET_MINUTES } = require('@/shared/constants');
const ENTITIES = ["employee", "user", "attendance", "adjustment", "holiday", "shift", "company", "tax", "payslip", "period", "delivery", "payout"];
const ACTIONS = ["CREATE", "UPDATE", "DELETE"];
const IGNORED_FIELDS = new Set(["_id", "__v", "createdAt", "updatedAt", "updatedBy", "recordedBy", "password", "signature", "deleted", "lastLoginAt", "totalShiftMinutes", "employees", "settings"]);
const MAX_VALUE_LENGTH = 300;
const isPlainObject = (value) => value && typeof value == "object" && !Array.isArray(value) && !(value instanceof Date) && value._bsontype == null;
const normalize = (value) => {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (value._bsontype == "ObjectId" || value._bsontype == "ObjectID") return String(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  return value;
};
const flatten = (value, prefix = "", result = {}) => {
  for (const [key, item] of Object.entries(value || {})) {
    if (IGNORED_FIELDS.has(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(item) && Object.keys(item).length) flatten(item, path, result);
    else result[path] = normalize(item);
  }
  return result;
};
const shorten = (value) => {
  if (value == null || typeof value != "object") return typeof value == "string" && value.length > MAX_VALUE_LENGTH ? value.slice(0, MAX_VALUE_LENGTH) + "…" : value;
  const text = JSON.stringify(value);
  return text.length > MAX_VALUE_LENGTH ? text.slice(0, MAX_VALUE_LENGTH) + "…" : value;
};
const diff = (before, after) => {
  const from = flatten(before);
  const to = flatten(after);
  const changes = { before: {}, after: {} };
  for (const field of new Set([...Object.keys(from), ...Object.keys(to)])) {
    if (JSON.stringify(from[field] ?? null) == JSON.stringify(to[field] ?? null)) continue;
    changes.before[field] = shorten(from[field] ?? null);
    changes.after[field] = shorten(to[field] ?? null);
  }
  return changes;
};
const day = (value) => value ? dayjs.utc(value).format("DD-MM-YYYY") : "";
const describe = async (entity, doc) => {
  switch (entity) {
    case "employee":
      return doc.firstName != null ? [doc.firstName, doc.lastName].filter(Boolean).join(" ") : await repo.findUserName(doc.userId);
    case "attendance":
      return [await repo.findEmployeeName(doc.employeeId), day(doc.date), doc.begin && doc.end ? `${doc.begin}–${doc.end}` : doc.type].filter(Boolean).join(" · ");
    case "adjustment":
      return [await repo.findEmployeeName(doc.employeeId), doc.type, doc.amount, day(doc.date)].filter(value => value != null && value !== "").join(" · ");
    case "holiday":
      return [doc.name, day(doc.date)].filter(Boolean).join(" · ");
    case "shift":
      return [doc.name, doc.begin && doc.end ? `${doc.begin}–${doc.end}` : ""].filter(Boolean).join(" · ");
    case "user":
      return [[doc.firstName, doc.lastName].filter(Boolean).join(" "), doc.email].filter(Boolean).join(" · ");
    case "company":
      return doc.name || "Company";
    case "tax":
      return `Tax rules from ${day(doc.effectiveFrom)}`;
    case "period":
      return `Payroll ${day(doc.beginDay)} – ${day(doc.endDay)}`;
    case "delivery":
      return [await repo.findEmployeeName(doc.employeeId), `${day(doc.beginDay)} – ${day(doc.endDay)}`, doc.to].filter(Boolean).join(" · ");
    case "payslip":
      return [await repo.findEmployeeName(doc.employeeId), `${day(doc.beginDay)} – ${day(doc.endDay)}`].filter(Boolean).join(" · ");
    case "payout":
      return [await repo.findEmployeeName(doc.employeeId), `${day(doc.beginDay)} – ${day(doc.endDay)}`].filter(Boolean).join(" · ");
    default:
      return "";
  }
};
const actor = async (context) => {
  if (!context?.userId) return { changedBy: null, changedByName: "System" };
  if (context.userName == null) context.userName = await repo.findUserName(context.userId);
  return { changedBy: context.userId, changedByName: context.userName || "Unknown user" };
};
exports.record = async ({ entity, modelName, before, after }) => {
  const isSoftDelete = before && after && !before.deleted && after.deleted;
  const action = !before ? "CREATE" : (!after || isSoftDelete) ? "DELETE" : "UPDATE";
  const doc = after || before;
  let documentId = doc._id;
  if (entity == "user" && doc.role == "employee") {
    if (action != "UPDATE") return;
    const employee = await repo.findEmployeeByUserId(doc._id);
    if (!employee) return;
    entity = "employee";
    documentId = employee._id;
  }
  const changes = action == "UPDATE" ? diff(before, after) : action == "CREATE" ? { before: {}, after: diff({}, after).after } : { before: {}, after: {} };
  if (action == "UPDATE" && !Object.keys(changes.after).length) return;
  const context = requestContext.get();
  const key = `${entity}:${documentId}:${action}`;
  const existing = context?.entries.get(key);
  if (existing) {
    await repo.merge(existing, changes, modelName == "User" ? await describe(entity, doc) : null);
    return;
  }
  const created = await repo.create({
    model: entity,
    documentId,
    action,
    label: await describe(entity, doc),
    changes,
    ...(await actor(context))
  });
  context?.entries.set(key, created._id);
  if (entity == "employee" && modelName == "Employee" && action != "UPDATE") {
    context?.entries.set(`employee:${documentId}:UPDATE`, created._id);
  }
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const serialize = (log) => {
  const before = log.changes?.before || {};
  const after = log.changes?.after || {};
  return {
    id: String(log._id),
    createdAt: log.createdAt,
    action: log.action,
    entity: log.model,
    documentId: String(log.documentId),
    label: log.label || "",
    user: log.changedByName || "System",
    changes: [...new Set([...Object.keys(before), ...Object.keys(after)])].map(field => ({
      field,
      from: before[field] ?? null,
      to: after[field] ?? null
    }))
  };
};
exports.getLogs = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = 10;
  const filter = { deleted: false };
  if (query.entity) {
    if (!ENTITIES.includes(query.entity)) throw new ApiError(400, "Unknown log type");
    filter.model = query.entity;
  }
  if (query.action) {
    if (!ACTIONS.includes(query.action)) throw new ApiError(400, "Unknown action");
    filter.action = query.action;
  }
  if (query.beginDay || query.endDay) {
    const begin = query.beginDay ? dayjs.utc(query.beginDay) : null;
    const end = query.endDay ? dayjs.utc(query.endDay) : null;
    if ((begin && !begin.isValid()) || (end && !end.isValid())) throw new ApiError(400, "Invalid date");
    filter.createdAt = {};
    if (begin) filter.createdAt.$gte = begin.startOf("day").subtract(CONTEXT_OFFSET_MINUTES, "minute").toDate();
    if (end) filter.createdAt.$lt = end.startOf("day").add(1, "day").subtract(CONTEXT_OFFSET_MINUTES, "minute").toDate();
  }
  const q = String(query.q || "").trim();
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ label: pattern }, { changedByName: pattern }];
  }
  const { data, count } = await repo.findAll({ filter, skip: (page - 1) * limit, limit });
  return {
    data: data.map(serialize),
    meta: {
      page,
      limit,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      hasNextPage: page * limit < count,
      hasPreviousPage: page > 1
    }
  };
};
