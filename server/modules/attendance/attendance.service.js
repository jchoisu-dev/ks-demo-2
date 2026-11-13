const attendanceRepos = require("./attendance.repository");
const { getStartEndOfWeek, getWeekDays } = require("./attendance.utils");
const { ApiError, minutesToHours } = require('../../shared/utils');
const { dayjs, mTh, summarizeWorkdays } = require('../../shared/utils');
const shiftService = require('../shift/shift.service');
const workHoursService = require('../workhours/workhours.service');
const periodService = require('../period/period.service');
exports.getAttendances = async (query) => {
  const calendarWeek = query?.calendarWeek;
  const { startOfWeek, endOfWeek, currentWeekState } = await getStartEndOfWeek(calendarWeek);
  const weekdays = await getWeekDays(startOfWeek);
  const fetchEmployeeAttendances = await attendanceRepos.findAll({ startOfWeek, endOfWeek });
  const workHours = await workHoursService.getWorkHours();
  const employees = [];
  const employeeTotalWorkedHours= {};
  const employeetotalOvertimeMinutes= {};
  for (const employeeAttendance of fetchEmployeeAttendances) {
    const employeeId = employeeAttendance._id;
    const fullname = employeeAttendance.userId.firstName + " " + employeeAttendance.userId.lastName;
    const attendances = {};
    const attendanceStatus = {};
    for (const attendance of employeeAttendance.attendances) {
      const date = dayjs.utc(attendance.date).format("YYYY-MM-DD");
      if (!attendances[date]) {
        attendances[date] = [];
      }
      const totalWorkedMinutes = attendance?.type === "present" && attendance?.totalWorkedMinutes ? attendance?.totalWorkedMinutes : 0;
      const totalBreakMinutes = attendance?.type === "present" && attendance?.totalBreakMinutes ? attendance?.totalBreakMinutes : 0;
      attendances[date].push({
        _id: attendance._id,
        name: attendance?.name || null,
        date,
        begin: attendance?.begin || null,
        end: attendance?.end || null,
        shift: (attendance?.begin || null) + " - " + (attendance?.end || null),
        totalWorkedMinutes,
        totalBreakMinutes,
        status: attendance?.type || null
      })
      attendanceStatus[date] = attendance?.type;
    }
    let regularMinutes = 0;
    let overtimeMinutes = 0;
    for (const day of Object.values(summarizeWorkdays(employeeAttendance.attendances, workHours))) {
      regularMinutes += day.regularMinutes;
      overtimeMinutes += day.overtimeMinutes;
      if (day.extraMinutes > 0) attendanceStatus[day.date] = "overtime";
    }
    employeeTotalWorkedHours[employeeId] = regularMinutes;
    employeetotalOvertimeMinutes[employeeId] = overtimeMinutes;
    employees.push({
      employeeId,
      name: fullname.toUpperCase(),
      attendances,
      attendanceStatus
    })
  }
  for(const i in employeeTotalWorkedHours){
    employeeTotalWorkedHours[i] = Math.round(await mTh(employeeTotalWorkedHours[i]) * 100) / 100
  }
  for(const i in employeetotalOvertimeMinutes){
    employeetotalOvertimeMinutes[i] = Math.round(await mTh(employeetotalOvertimeMinutes[i]) * 100) / 100
  }
  return {
    employees,
    currentWeekState,
    weekdays,
    employeeTotalWorkedHours,
    employeetotalOvertimeMinutes
  };
}
exports.getEmployeeAttendance = async(d) => {
  const result = await attendanceRepos.findEmployeeAttendance(d);
  const attendances = [];
  for(const i in result){
    const attendance = result[i];
    attendances.push({
      id: attendance._id,
      name: attendance.name,
      begin: attendance.begin,
      end: attendance.end,
      totalWorkedMinutes: attendance?.totalWorkedMinutes ? await minutesToHours(attendance?.totalWorkedMinutes) : 0,
      type: attendance.type,
      billable: attendance.billable,
      totalBreakMinutes: attendance.totalBreakMinutes || 0,
      date: dayjs.utc(attendance.date).format("YYYY-MM-DD")
    })
  }
  return attendances;
}
const TIMED_TYPES = ["present", "overtime"];
const OTHER_TYPES = ["absent", "leave", "sick", "holiday"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const serializeEntry = (attendance) => ({
  id: String(attendance._id),
  name: attendance.name || "",
  date: dayjs.utc(attendance.date).format("YYYY-MM-DD"),
  begin: attendance.begin || "",
  end: attendance.end || "",
  totalBreakMinutes: attendance.totalBreakMinutes || 0,
  totalWorkedMinutes: attendance.totalWorkedMinutes || 0,
  type: attendance.type,
  billable: attendance.billable !== false
});
const workedMinutes = (begin, end, breakMinutes) => {
  const [beginHours, beginMinutes] = begin.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  let span = (endHours * 60 + endMinutes) - (beginHours * 60 + beginMinutes);
  if (span <= 0) span += 1440;
  return span - breakMinutes;
};
const validateTimes = ({ begin, end, totalBreakMinutes }) => {
  if (!TIME.test(begin || "") || !TIME.test(end || "")) throw new ApiError(400, "Enter a start and end time (HH:mm)");
  const breakMinutes = Number(totalBreakMinutes || 0);
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) throw new ApiError(400, "The break must be 0 minutes or more");
  if (workedMinutes(begin, end, breakMinutes) <= 0) throw new ApiError(400, "The worked time must be longer than the break");
  return breakMinutes;
};
exports.createAttendance = async (data = {}) => {
  await periodService.assertOpen(data?.date);
  const { shiftId, employeeId, date, begin, end, totalBreakMinutes, type, billable, mode } = data;
  let attendance;
  switch (mode) {
    case "standard":
      const shift = await shiftService.getShiftById(shiftId);
      attendance = await attendanceRepos.createAttendance({
        employeeId,
        name: shift.name,
        date,
        begin: shift.begin,
        end: shift.end,
        totalBreakMinutes: shift.break,
        billable: true,
        type: shift.type == "overtime" ? "overtime" : "present"
      });
      break;
    case "manual":
      attendance = await attendanceRepos.createAttendance({
        employeeId,
        date,
        begin: begin,
        end: end,
        totalBreakMinutes: validateTimes({ begin, end, totalBreakMinutes }),
        billable: true,
        type
      });
      break;
    case "other":
      attendance = await attendanceRepos.createAttendance({
        employeeId,
        date,
        begin: "",
        end: "",
        totalBreakMinutes: 0,
        billable,
        type
      });
      break;
    default:
      throw new ApiError(400, "Choose how to add the attendance");
  }
  return serializeEntry(attendance.toObject ? attendance.toObject() : attendance);
};
exports.updateAttendance = async (id, body = {}) => {
  const attendance = await attendanceRepos.findDocument(id);
  if (!attendance) throw new ApiError(404, "Attendance entry not found");
  await periodService.assertOpen(attendance.date);
  const type = body.type ?? attendance.type;
  if (![...TIMED_TYPES, ...OTHER_TYPES].includes(type)) throw new ApiError(400, "Choose a valid attendance type");
  if (TIMED_TYPES.includes(type)) {
    const begin = body.begin ?? attendance.begin;
    const end = body.end ?? attendance.end;
    const totalBreakMinutes = validateTimes({ begin, end, totalBreakMinutes: body.totalBreakMinutes ?? attendance.totalBreakMinutes });
    const timesChanged = begin != attendance.begin || end != attendance.end || totalBreakMinutes != attendance.totalBreakMinutes;
    attendance.set({
      type,
      begin,
      end,
      totalBreakMinutes,
      totalWorkedMinutes: workedMinutes(begin, end, totalBreakMinutes),
      billable: true,
      ...(timesChanged ? { name: "" } : {})
    });
  } else {
    attendance.set({
      type,
      name: "",
      begin: "",
      end: "",
      totalBreakMinutes: 0,
      totalWorkedMinutes: 0,
      billable: body.billable === undefined ? attendance.billable : Boolean(body.billable)
    });
  }
  await attendance.save();
  return serializeEntry(attendance.toObject());
};
exports.deleteAttendance = async (id) => {
  const existing = await attendanceRepos.findDate(id);
  await periodService.assertOpen(existing?.date);
  const deleted = await attendanceRepos.delete(id);
  if (!deleted) throw new ApiError(404, "Attendance entry not found");
  return deleted;
}