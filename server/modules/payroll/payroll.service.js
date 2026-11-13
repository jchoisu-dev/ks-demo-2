const path = require("path");
const fs = require("fs");
const { PassThrough } = require("stream");
const mailService = require("../../shared/services/mail.service");
const { ApiError } = require('../../shared/utils');
const repo = require('./payroll.repository');
const { getStartEndOfMonth, getPayrollData, getWorkHours, getRates, toQueryRange, isTaxEnabled, calculateTax, calculateSalary, isFixedPay, getFixedSalary, getMonthlyAttendance, saturdayDayValue, sundayDayValue, overtimeOnBaseRate } = require('./payroll.utils');
const periodService = require('../period/period.service');
const ExcelJS = require('exceljs');
const { payTypes, employeeTypes } = require('@/shared/constants');
const { dayjs, mTh, getWorkdaysMonth, overtimeRateFor } = require('@/shared/utils');
const {
  CONSTANT_COMPANY_NAME,
  CONSTANT_COMPANY_ADDRESS,
  CONSTANT_COMPANY_AREA,
  CONSTANT_CONTACT_PRIMARY,
  CONSTANT_CONTACT_SECONDARY,
  CONSTANT_UTC_OFFSET_MINUTES
} = require('@/shared/constants');
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");
const toDay = (value) => new Date(dayjs.utc(value).format("YYYY-MM-DD"));
const toPeriod = (beginDay, endDay) => ({ beginDay: toDay(beginDay), endDay: toDay(endDay) });
const SIGNATURE_FORMAT = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
const SIGNATURE_MAX_LENGTH = 700 * 1024;
const PNG_MAGIC = "89504e470d0a1a0a";
const LOGO_TIMEOUT_MS = 3000;
const OVERTIME_LABELS = [["WORKDAY", "Overtime weekdays"], ["SATURDAY", "Overtime Saturday"], ["SUNDAY", "Overtime Sunday"]];
const assertPeriod = (beginDay, endDay) => {
  if (!dayjs.utc(beginDay).isValid() || !dayjs.utc(endDay).isValid()) throw new ApiError(400, "Invalid period");
  if (dayjs.utc(endDay).isBefore(dayjs.utc(beginDay), "day")) throw new ApiError(400, "End date must be after the begin date");
};
const loadLogo = async (logoUrl) => {
  if (logoUrl) {
    try {
      const response = await fetch(logoUrl, { signal: AbortSignal.timeout(LOGO_TIMEOUT_MS) });
      const type = response.headers.get("content-type") || "";
      if (response.ok && /image\/(png|jpe?g)/.test(type)) return Buffer.from(await response.arrayBuffer());
    } catch (error) {
    }
  }
  const fallback = path.join(__dirname, "../../assets/logo.png");
  return fs.existsSync(fallback) ? fallback : null;
};
const companyHeader = (company) => {
  const address = company?.address || {};
  const contacts = (company?.contacts || [])
    .filter(contact => contact?.name || contact?.phone)
    .map(contact => [contact.phone, contact.name].filter(Boolean).join(" "));
  const reachable = contacts.length ? contacts : [company?.phone, company?.email].filter(Boolean);
  return {
    name: company?.legalName || company?.name || CONSTANT_COMPANY_NAME,
    lines: [
      address.street,
      [address.postalCode, address.city].filter(Boolean).join(" "),
      [address.district, address.country].filter(Boolean).join(", ")
    ].filter(Boolean),
    contacts: reachable.join("  •  "),
    logoUrl: company?.logoUrl || ""
  };
};
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const money = (value) => {
  const amount = roundMoney(value);
  return Number.isInteger(amount) ? `${amount},-` : amount.toFixed(2);
};
exports.overview = async (query) => {
  let { beginDay, endDay } = query;
  if (!beginDay || !endDay) {
    const month = await getStartEndOfMonth();
    beginDay = month.beginDay;
    endDay = month.endDay;
  }
  assertPeriod(beginDay, endDay);
  const page = parseInt(query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const frozen = await periodService.getFrozenContext(beginDay, endDay);
  const [result] = await repo.findAll({ ...toQueryRange(beginDay, endDay), limit, skip, includeIds: frozen?.employeeIds, fixedIds: frozen?.fixedEmployeeIds });
  if (result) {
    const { data: attendances, count: totalRecords } = result;
    const list = [];

    let totalSalary = 0;
    let salaryRatePerHour = 0;
    let salaryRatePerDay = 0;

    const workHours = frozen ? frozen.workHours : await getWorkHours();
    if (attendances.length > 0) {
      for (const record of attendances) {
        const attendance = frozen ? { ...record, employee: frozen.freeze(record.employee) } : record;
        const fullname = attendance.employee.user.firstName + " " + attendance.employee.user.lastName;
        const payrolls = attendance.payrollRecords;

        const {
          totalWeekDays,
          totalWeekDayMinutes,
          totalOvertimeDays,
          totalOvertimeMinutes,
          totalSundays,
          totalSaturdays,
          totalLeave,
          totalAbsent,
          totalSick
        } = await getPayrollData(payrolls, workHours);

        list.push({
          id: attendance._id,
          employee: fullname.toUpperCase(),
          type: employeeTypes[attendance.employee.type],
          pay_type: payTypes[attendance.employee.salary.payType],
          total_working_days: totalWeekDays,
          total_saturdays: totalSaturdays,
          total_sundays: totalSundays,
          total_regular_hours: roundMoney(await mTh(totalWeekDayMinutes)),
          total_working_overtime_days: totalOvertimeDays,
          total_overtime_hours: roundMoney(await mTh(totalOvertimeMinutes)),
          total_leave: totalLeave,
          total_absent: totalAbsent,
          total_sick: totalSick,
          workdays: isFixedPay(attendance.employee.salary.payType)
            ? getMonthlyAttendance({ employee: attendance.employee, attendances: payrolls, workHours, beginDay, endDay })
            : null,
          amount: attendance.employee.salary.amount,
          currency: attendance.employee.salary.currency
        })
      }
    };
    const nets = await exports.netPayFor({ beginDay, endDay, employeeIds: list.map(row => String(row.id)) });
    const statuses = await require("../payout/payout.service").statusesFor({ nets, beginDay, endDay });
    for (const row of list) row.payout = statuses.get(String(row.id)) || null;
    return {
      period: { beginDay: dayjs.utc(beginDay).format("YYYY-MM-DD"), endDay: dayjs.utc(endDay).format("YYYY-MM-DD") },
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
};
exports.pdf = async ({ res, query }) => {
  const { employeeId } = query;
  let { beginDay, endDay } = query;
  if (!beginDay || !endDay) {
    const month = await getStartEndOfMonth();
    beginDay = month.beginDay;
    endDay = month.endDay;
  }
  assertPeriod(beginDay, endDay);
  if (!mongoose.isValidObjectId(employeeId)) throw new ApiError(400, "Employee is required");
  const signed = await repo.findSignature({ employeeId, ...toPeriod(beginDay, endDay) });
  const range = toQueryRange(beginDay, endDay);
  const [[data], storedEmployee, frozen, company] = await Promise.all([
    repo.generatePDF({ employeeId, ...range }),
    repo.findEmployeeById(employeeId),
    periodService.getFrozenContext(beginDay, endDay),
    repo.findCompany()
  ]);
  if (!storedEmployee) throw new ApiError(404, "Employee not found");
  const { attendances = [] } = data || {};
  const employee = frozen ? frozen.freeze(storedEmployee) : storedEmployee;
  const { amount, currency, payType } = employee.salary;
  const user = employee.userId;
  const fullName = `${user.firstName} ${user.lastName}`;
  const {
    totalWeekDays,
    totalWeekDayMinutes,
    totalOvertimeDays,
    totalOvertimeMinutes,
    totalSundays,
    totalSaturdays,
    effectiveSaturdays,
    effectiveSundays,
    totalLeave,
    totalAbsent,
    absentDates,
    totalSick,
    days,
    workHours,
    overtimeByDayType
  } = await getPayrollData(attendances, frozen?.workHours);
  let totalSalaryNet = 0;
  const { salaryRatePerHour, salaryRatePerDay } = getRates({ amount, payType }, workHours);
  let salaryBonus = 0;
  let salaryDeduction = 0;
  const incentiveFullMonthSingleBonus = employee.incentive_monthly?.amount || 0;
  const incentiveFullAttendanceRate = employee.incentive_weekdays?.amount || 0;
  const getFullMonthDays = await getWorkdaysMonth(beginDay, endDay, { saturday: workHours.saturday > 0 });
  const isFixed = isFixedPay(payType);
  const fixed = isFixed ? await getFixedSalary({ employee, payrollData: { workHours, totalAbsent, absentDates }, beginDay, endDay }) : null;
  const isFullAttendance = isFixed ? fixed.absentDays == 0 && fixed.scheduledDays > 0 : (totalWeekDays + totalSaturdays) == getFullMonthDays;
  const adjustments = await repo.findEmployeeAdjustments({ employeeId, ...range });
  for (const adjustment of adjustments) {
    if (adjustment.type == 'bonus') salaryBonus = salaryBonus + adjustment.amount;
    if (adjustment.type == 'deduction') salaryDeduction = salaryDeduction + adjustment.amount
  }
  let effectiveRatePerDay = isFixed ? fixed.dailyRate : (isFullAttendance && incentiveFullAttendanceRate) ? incentiveFullAttendanceRate : salaryRatePerDay;
  let effectiveRatePerHour = isFixed ? fixed.hourlyRate : (isFullAttendance && incentiveFullAttendanceRate) ? incentiveFullAttendanceRate : salaryRatePerHour;
  const saturdayValue = saturdayDayValue(workHours);
  const sundayValue = sundayDayValue(workHours);
  const onBase = overtimeOnBaseRate(workHours);
  const overtimeRatePerDay = isFixed ? fixed.dailyRate : onBase ? salaryRatePerDay : effectiveRatePerDay;
  const overtimeRatePerHour = isFixed ? fixed.hourlyRate : onBase ? salaryRatePerHour : effectiveRatePerHour;
  const hourlyBaseFor = (baseHours) => payType == 'hourly' ? overtimeRatePerHour : overtimeRatePerDay / baseHours;
  const overtimeTotal = () => Object.values(overtimeByDayType || {})
    .reduce((sum, group) => sum + roundMoney(group.minutes / 60 * hourlyBaseFor(group.baseHours) * group.rate), 0);
  const header = company?.payslip?.showCompanyDetails ? companyHeader(company) : null;
  const logo = header ? await loadLogo(header.logoUrl) : null;
  const doc = new PDFDocument({
    size: "A4",
    margin: 20
  });
  res.setHeader("Content-Type", "application/pdf");
  if (signed) res.setHeader("X-Signed-At", new Date(signed.signedAt).toISOString());
  res.setHeader(
    "Content-Disposition",
    "inline; filename=\"attendance-slip.pdf\""
  );
  doc.pipe(res);

  const COLORS = {
    primary: "#A46023",

    text: "#222222",
    secondary: "#555555",
    muted: "#888888",

    border: "#E5E5E5",
    lightBorder: "#EEEEEE",

    background: "#F8F8F8",
    totalBackground: "#F3F4F6",
    white: "#FFFFFF",

    absent: "#DC2626",
    leave: "#2563EB",
    sick: "#D97706"
  };

  const pageMargin = 15;
  const bottomMargin = 50;

  const logoPath = path.join(__dirname, "../../assets/logo.png");

  const logoWidth = 100;
  const logoX =
    doc.page.width -
    logoWidth -
    pageMargin;

  const contentX = 50;
  const contentWidth =
    doc.page.width - contentX * 2;

  const rowHeight = 22;
  const headerHeight = 25;

  const employeeTitleY = 100;

  if (header) {
    const headerWidth = contentWidth - 110;
    doc
      .fillColor(COLORS.primary)
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(header.name, contentX, 24, { width: headerWidth, lineBreak: false, ellipsis: true });
    doc
      .fillColor(COLORS.secondary)
      .font("Helvetica")
      .fontSize(8);
    let headerY = 44;
    for (const line of [...header.lines, header.contacts].filter(Boolean).slice(0, 4)) {
      doc.text(line, contentX, headerY, { width: headerWidth, lineBreak: false, ellipsis: true });
      headerY += 10.5;
    }
    if (logo) {
      try {
        doc.image(logo, doc.page.width - contentX - 90, 20, { fit: [90, 62], align: "right", valign: "center" });
      } catch (error) {
      }
    }
    doc
      .moveTo(contentX, 90)
      .lineTo(doc.page.width - contentX, 90)
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .stroke();
  }

  doc
    .fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(19)
    .text(
      `${user.firstName} ${user.lastName}`,
      contentX,
      employeeTitleY,
      {
        width: contentWidth,
        align: "center"
      }
    );

  doc
    .fillColor(COLORS.secondary)
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Pay Period  ${dayjs
        .utc(beginDay)
        .format("DD-MM-YYYY")} — ${dayjs
          .utc(endDay)
          .format("DD-MM-YYYY")}`,
      contentX,
      employeeTitleY + 23,
      {
        width: contentWidth,
        align: "center"
      }
    );

  if (frozen) {
    doc
      .fillColor(COLORS.muted)
      .fontSize(7.5)
      .text(
        `Closed payroll period · ${dayjs.utc(frozen.closedAt).utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format("DD-MM-YYYY HH:mm")}`,
        contentX,
        employeeTitleY + 12,
        {
          width: contentWidth,
          align: "right"
        }
      );
  }

  const summaryBoxX = contentX;
  const summaryBoxY = employeeTitleY + 25;
  const summaryBoxWidth = contentWidth;
  const summaryBoxHeight = 189;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(
      "WORK SUMMARY",
      summaryBoxX + 15,
      summaryBoxY + 16
    );

  doc
    .moveTo(
      summaryBoxX + 15,
      summaryBoxY + 32
    )
    .lineTo(
      summaryBoxX + summaryBoxWidth - 15,
      summaryBoxY + 32
    )
    .strokeColor(COLORS.border)
    .lineWidth(0.7)
    .stroke();

  const summaryY = summaryBoxY + 45;
  const summaryLeftX = summaryBoxX + 15;
  const summaryRightX = summaryBoxX + 260;
  const summaryLabelWidth = 130;
  const summaryValueWidth = 60;
  const monthly = isFixed ? getMonthlyAttendance({ employee, attendances, workHours, beginDay, endDay }) : null;
  const summary = monthly ? [
    {
      left: ["Scheduled Workdays: ", monthly.scheduledDays],
      right: ["Overtime Days: ", totalOvertimeDays]
    },
    {
      left: ["Days Worked: ", `${monthly.workedDays} / ${monthly.scheduledDays}`],
      right: ["Overtime Hours: ", roundMoney(await mTh(totalOvertimeMinutes))],
      rightItalic: true
    },
    {
      left: ["Workdays Missed: ", monthly.missedDays],
      right: ["Leave: ", monthly.leave]
    },
    {
      left: ["Not Recorded: ", monthly.notRecorded + monthly.upcoming],
      right: ["Sick: ", monthly.sick]
    },
    {
      left: ["Sundays Worked: ", totalSundays],
      right: ["Absent: ", monthly.absent]
    },
    {
      left: ["ALL WORKDAYS WORKED: ", monthly.complete ? "Yes" : "No"],
      right: ["", ""]
    }
  ] : [
    {
      left: ["Weekdays Worked: ", totalWeekDays],
      right: ["Overtime Days: ", totalOvertimeDays],
    },
    {
      left: ["Saturdays Worked: ", totalSaturdays],
      right: ["Overtime Hours: ", roundMoney(await mTh(totalOvertimeMinutes))],
      rightItalic: true
    },
    {
      left: ["Effective Saturdays: ", effectiveSaturdays],
      right: ["", ""]
    },
    {
      left: ["Sundays Worked: ", totalSundays],
      right: ["Leave: ", totalLeave]
    },
    {
      left: ["Effective Sundays: ", effectiveSundays],
      right: ["", ""]
    },
    {
      left: ["Regular Hours: ", roundMoney(await mTh(totalWeekDayMinutes))],
      right: ["Sick: ", totalSick],
      leftItalic: true
    },
    {
      left: ["TOTAL DAYS WORKED: ", totalWeekDays + totalSaturdays + totalSundays],
      right: ["Absent: ", totalAbsent]
    }
  ];

  summary.forEach((row, index) => {
    const y = summaryY + index * rowHeight;

    const isTotal = row.left[0] === "TOTAL DAYS WORKED: " || row.left[0] === "ALL WORKDAYS WORKED: ";

    doc
      .font(
        row.leftItalic
          ? "Helvetica-Oblique"
          : isTotal
            ? "Helvetica-Bold"
            : "Helvetica"
      )
      .fontSize(9)
      .fillColor(COLORS.secondary)
      .text(
        row.left[0],
        summaryLeftX,
        y,
        {
          width: summaryLabelWidth,
        }
      );

    doc
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(
        String(row.left[1]),
        summaryLeftX +
        summaryLabelWidth,
        y,
        {
          width: summaryValueWidth,
          align: "right",
        }
      );

    doc
      .font(
        row.rightItalic
          ? "Helvetica-Oblique"
          : "Helvetica"
      )
      .fontSize(9)
      .fillColor(COLORS.secondary)
      .text(
        row.right[0],
        summaryRightX,
        y,
        {
          width: summaryLabelWidth,
        }
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(
        String(row.right[1]),
        summaryRightX +
        summaryLabelWidth,
        y,
        {
          width: summaryValueWidth,
          align: "right",
        }
      );
  });

  const payoutLeftX = contentX;
  const payoutRightX =
    contentX + contentWidth;

  let payoutY =
    summaryBoxY +
    summaryBoxHeight +
    30;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.text)
    .text(
      "PAYOUT",
      payoutLeftX,
      payoutY
    );

  payoutY += 20;

  doc
    .moveTo(
      payoutLeftX,
      payoutY
    )
    .lineTo(
      payoutRightX,
      payoutY
    )
    .strokeColor("#eee")
    .lineWidth(1)
    .stroke();

  payoutY += 12;

  let weekDayPayout = 0;
  let weekDayAmount = 0;
  let sundayPayout = 0;
  let sundayAmount = 0;
  let monthlyPayout = 0;
  let monthlyAmount = 0;
  let overtimeAmount = 0;
  let saturdayPayout = "";
  let saturdayAmount = 0;
  if (payType == 'daily') {
    weekDayPayout = `${totalWeekDays} x ${currency}${effectiveRatePerDay},-`;
    weekDayPayout = isFullAttendance ? weekDayPayout + `    (before: ${currency}${salaryRatePerDay})` : weekDayPayout;
    saturdayPayout = `${effectiveSaturdays} x ${currency}${effectiveRatePerDay},-`;
    saturdayAmount = roundMoney(effectiveSaturdays * effectiveRatePerDay);
    weekDayAmount = `${roundMoney(totalWeekDays * effectiveRatePerDay + saturdayAmount)}`;

    sundayPayout = `${effectiveSundays} x ${currency}${effectiveRatePerDay},-`;
    sundayAmount = `${roundMoney(effectiveSundays * effectiveRatePerDay)}`;

    overtimeAmount = `${roundMoney(overtimeTotal())}`
    totalSalaryNet = parseFloat(weekDayAmount) + parseFloat(sundayAmount) + parseFloat(overtimeAmount);
  }
  if (payType == 'hourly') {
    weekDayPayout = `${roundMoney(await mTh(totalWeekDayMinutes))}h x ${currency}${effectiveRatePerHour},-`;
    weekDayPayout = isFullAttendance ? weekDayPayout +  `   (before: ${currency}${salaryRatePerHour})` : weekDayPayout;
    weekDayAmount = `${roundMoney(await mTh(totalWeekDayMinutes) * effectiveRatePerHour)}`;

    sundayPayout = `${effectiveSundays} x ${currency}${effectiveRatePerDay},-`;
    sundayAmount = `${roundMoney(effectiveSundays * effectiveRatePerDay)}`;

    overtimeAmount = `${roundMoney(overtimeTotal())}`

    totalSalaryNet = parseFloat(weekDayAmount) + parseFloat(sundayAmount) + parseFloat(overtimeAmount);
  }
  if (isFixed) {
    weekDayPayout = payType == 'monthly'
      ? `${monthly.workedDays} of ${monthly.scheduledDays} workdays`
      : `${fixed.scheduledDays} days x ${currency}${money(fixed.dailyRate)}`;
    weekDayAmount = `${roundMoney(fixed.base)}`;

    sundayPayout = `${effectiveSundays} x ${currency}${money(effectiveRatePerDay)}`;
    sundayAmount = `${roundMoney(effectiveSundays * effectiveRatePerDay)}`;

    overtimeAmount = `${roundMoney(overtimeTotal())}`

    totalSalaryNet = parseFloat(weekDayAmount) - fixed.absenceDeduction + parseFloat(sundayAmount) + parseFloat(overtimeAmount);
  }
  const fullMonthBonus = (isFullAttendance && incentiveFullMonthSingleBonus) ? incentiveFullMonthSingleBonus : 0;
  const overtimePay = parseFloat(overtimeAmount) || 0;
  const grossWage = totalSalaryNet - overtimePay + salaryBonus + fullMonthBonus;
  const isCalculated = payType == 'daily' || payType == 'hourly' || isFixed;
  const applyTax = frozen ? frozen.applyTax : await isTaxEnabled();
  const tax = isCalculated && applyTax
    ? await calculateTax({ employee, gross: grossWage, overtime: overtimePay, endDay, settings: frozen?.taxSettings })
    : null;
  const taxDeductions = tax?.applied ? tax.totalDeductions : 0;
  totalSalaryNet = roundMoney(grossWage + overtimePay - taxDeductions - salaryDeduction);
  const payoutRows = [
    {
      label: isFixed ? (payType == 'monthly' ? "Monthly salary" : "Weekly salary") : "Weekdays",
      calculation: weekDayPayout,
      amount: isFixed ? currency + money(weekDayAmount) : saturdayPayout ? currency + money(roundMoney(weekDayAmount - saturdayAmount)) : currency + weekDayAmount + ',-'
    }
  ];
  if (saturdayPayout && totalSaturdays > 0) {
    payoutRows.push({
      label: "Saturdays",
      calculation: saturdayPayout,
      amount: currency + money(saturdayAmount)
    });
  }
  if (isFixed && fixed.absenceDeduction > 0) {
    payoutRows.push({
      label: "Unpaid absence",
      calculation: `${fixed.absentDays} x ${currency}${money(fixed.dailyRate)}`,
      amount: '-' + currency + money(fixed.absenceDeduction)
    });
  }
  if (sundayAmount > 0) {
    payoutRows.push({
      label: "Sunday",
      calculation: sundayPayout,
      amount: currency + sundayAmount + ',-'
    })
  }
  if (overtimeAmount > 0) {
    for (const [dayType, label] of OVERTIME_LABELS) {
      const group = overtimeByDayType[dayType];
      if (!group?.minutes) continue;
      const hours = roundMoney(group.minutes / 60);
      const hourly = hourlyBaseFor(group.baseHours);
      payoutRows.push({
        label,
        calculation: `${hours}h x ${currency}${money(hourly * group.rate)} (${group.rate}x)`,
        amount: currency + money(group.minutes / 60 * hourly * group.rate)
      });
    }
  }
  if (salaryBonus > 0) {
    payoutRows.push({
      label: "Bonus",
      calculation: "",
      amount: currency + salaryBonus + ',-'
    })
  }
  if (fullMonthBonus) {
    payoutRows.push({
      label: "Full Month Bonus " + getFullMonthDays + ' days',
      calculation: `1 x ${currency}${incentiveFullMonthSingleBonus},-`,
      amount: `${currency}${incentiveFullMonthSingleBonus},-`,
    })
  }
  if (tax?.applied) {
    payoutRows.push({
      label: "Gross pay",
      calculation: "",
      amount: currency + money(grossWage + overtimePay),
      strong: true
    });
    const taxRows = [
      ["Wage tax", `taxable ${currency}${money(tax.taxableWage)}`, tax.wageTax],
      ["Overtime tax", "", tax.overtimeTax],
      ["AOV", "", tax.aov],
      ["Pension", "employee share", tax.pensionEmployee],
      ["Health insurance", "employee share", tax.healthEmployee]
    ];
    for (const [label, calculation, amount] of taxRows) {
      if (amount > 0) payoutRows.push({ label, calculation, amount: '-' + currency + money(amount) });
    }
  }
  if (tax && !tax.applied) {
    payoutRows.push({
      label: "Tax",
      calculation: `Not calculated for ${currency} salaries`,
      amount: "—"
    });
  }
  if (salaryDeduction > 0) {
    payoutRows.push({
      label: "Deduction",
      calculation: "",
      amount: '-' + currency + salaryDeduction + ',-'
    })
  }

  const payoutRowHeight = 23;

  payoutRows.forEach((row) => {

    doc
      .font(row.strong ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9)
      .fillColor(row.strong ? COLORS.text : COLORS.secondary)
      .text(
        row.label,
        payoutLeftX,
        payoutY,
        {
          width: 130,
        }
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(
        row.calculation,
        payoutLeftX + 130,
        payoutY,
        {
          width: 180,
        }
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(
        row.amount,
        payoutRightX - 100,
        payoutY,
        {
          width: 100,
          align: "right"
        }
      );

    payoutY += payoutRowHeight;
  });

  doc
    .moveTo(
      payoutLeftX,
      payoutY + 2
    )
    .lineTo(
      payoutRightX,
      payoutY + 2
    )
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  payoutY += 12;

  const payoutTotalHeight = 32;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(
      tax?.applied ? "NET PAY" : "TOTAL",
      payoutLeftX + 12,
      payoutY + 1
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(
      `${currency}${money(totalSalaryNet)}`,
      payoutRightX - 140,
      payoutY + 7,
      {
        width: 128,
        align: "right",
      }
    );

  let afterTotalY = payoutY + payoutTotalHeight;
  const payoutRecord = await require("../payout/payout.repository").findOne({
    employeeId,
    beginDay: new Date(dayjs.utc(beginDay).format("YYYY-MM-DD")),
    endDay: new Date(dayjs.utc(endDay).format("YYYY-MM-DD"))
  });
  const paidLines = (payoutRecord?.lines || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  if (paidLines.length) {
    const methodLabel = { cash: "Cash", bank: "Bank transfer", other: "Other" };
    afterTotalY += 10;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text).text("PAID OUT", payoutLeftX, afterTotalY);
    afterTotalY += 18;
    for (const line of paidLines) {
      const handed = `${line.currency}${money(line.amount)}`;
      const detail = line.currency != currency ? `${handed}   (${currency}${money(line.payAmount)} x ${line.rate})` : handed;
      doc.font("Helvetica").fontSize(9).fillColor(COLORS.secondary)
        .text(`${dayjs.utc(line.date).format("DD-MM-YYYY")} · ${methodLabel[line.method] || line.method}`, payoutLeftX, afterTotalY, { width: 150 });
      doc.fillColor(COLORS.text).text(detail, payoutLeftX + 160, afterTotalY, { width: 240 });
      doc.text(`${currency}${money(line.payAmount)}`, payoutRightX - 140, afterTotalY, { width: 128, align: "right" });
      afterTotalY += 16;
    }
    const paidTotal = roundMoney(paidLines.reduce((sum, line) => sum + line.payAmount, 0));
    const open = roundMoney(Math.max(0, totalSalaryNet - paidTotal));
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text)
      .text(open > 0 ? "Still to pay" : "Fully paid", payoutLeftX, afterTotalY + 2);
    doc.text(`${currency}${money(open)}`, payoutRightX - 140, afterTotalY + 2, { width: 128, align: "right" });
    afterTotalY += 18;
  }
  const signatureY = afterTotalY + 45;
  const employeeSignatureX = 320;
  const employeeSignatureWidth = 160;

  const signatureLineY = signatureY + 10;

  doc
    .moveTo(
      employeeSignatureX,
      signatureLineY
    )
    .lineTo(
      employeeSignatureX +
      employeeSignatureWidth,
      signatureLineY
    )
    .strokeColor(COLORS.secondary)
    .lineWidth(0.8)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "Employee Signature",
      employeeSignatureX,
      signatureLineY + 7,
      { align: 'left'}
    );

  doc.text(
    `${fullName}  •  ${dayjs
      .utc()
      .utcOffset(CONSTANT_UTC_OFFSET_MINUTES)
      .format("DD-MM-YYYY")}`,
    employeeSignatureX,
    signatureLineY + 20,
    { align: 'left'}
  );

  if (signed) {
    const image = Buffer.from(signed.signature.split(",")[1], "base64");
    doc.image(image, employeeSignatureX, signatureLineY - 46, {
      fit: [employeeSignatureWidth, 44],
      align: "center",
      valign: "bottom"
    });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text(
        `Signed ${dayjs.utc(signed.signedAt).utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format("DD-MM-YYYY HH:mm")}`,
        employeeSignatureX,
        signatureLineY + 32,
        { align: "left" }
      );
  }

  doc.addPage();

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.text)
    .text(
      "EARNINGS",
      contentX,
      40
    );

  const tableX = 40;
  const tableWidth = 515;

  const col = {
    type: tableX + 5,
    date: tableX + 70,
    begin: tableX + 170,
    end: tableX + 220,
    break: tableX + 270,
    hours: tableX + 315,
    payRate: tableX + 355,
    sum: tableX + 410
  };

  const colWidth = {
    type: 65,
    date: 100,
    begin: 50,
    end: 50,
    break: 45,
    hours: 40,
    payRate: 55,
    sum: 100
};

  const drawTableHeader = (tableY) => {

    doc
      .rect(
        tableX,
        tableY - 5,
        tableWidth,
        headerHeight
      )
      .fillColor(COLORS.primary)
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.white);

    doc.text(
      "STATUS",
      col.type,
      tableY + 3,
      {
        width: colWidth.type,
      }
    );

    doc.text(
      "DATE",
      col.date,
      tableY + 3,
      {
        width: colWidth.date,
      }
    );

    doc.text(
      "BEGIN",
      col.begin,
      tableY + 3,
      {
        width: colWidth.begin,
      }
    );

    doc.text(
      "END",
      col.end,
      tableY + 3,
      {
        width: colWidth.end,
      }
    );

    doc.text(
      "BREAK",
      col.break,
      tableY + 3,
      {
        width: colWidth.break,
        align: 'center'
      }
    );

    doc.text(
      "HOURS",
      col.hours,
      tableY + 3,
      {
        width: colWidth.hours,
        align: 'center'
      }
    );

    doc.text(
      "PAY RATE",
      col.payRate,
      tableY + 3,
      {
        width: colWidth.payRate,
        align: 'center'
      }
    );

    doc.text(
      "SUM",
      col.sum,
      tableY + 3,
      {
        width: colWidth.sum,
        align: "center",
      }
    );

    doc
      .moveTo(
        tableX,
        tableY + headerHeight - 5
      )
      .lineTo(
        tableX + tableWidth,
        tableY + headerHeight - 5
      )
      .strokeColor(COLORS.primary)
      .lineWidth(1)
      .stroke();

    return tableY + headerHeight + 5;
  };

  let y = drawTableHeader(75);

  const dayByDate = Object.fromEntries(days.map(day => [day.date, day]));
  const remainingMinutes = Object.fromEntries(days.map(day => [day.date, day.standardMinutes]));
  const paidDays = new Set();
  for (let index = 0; index < attendances.length; index++) {

    const attendance = attendances[index];
    const hours = roundMoney(await mTh(attendance?.totalWorkedMinutes || 0));
    const date = dayjs.utc(attendance.date).format("YYYY-MM-DD");
    const day = dayByDate[date];
    let dailyPay = 0;
    let dailyRate = payType == 'hourly' ? effectiveRatePerHour : effectiveRatePerDay;
    if (isCalculated && attendance.type == "present" && day?.isWorkday) {
      const regularMinutes = Math.min(attendance.totalWorkedMinutes || 0, remainingMinutes[date]);
      remainingMinutes[date] -= regularMinutes;
      const isFirstEntry = !paidDays.has(date);
      paidDays.add(date);
      if (isFixed && day.dayType != "SUNDAY") {
        dailyRate = "-";
        dailyPay = 0;
      } else if (payType == 'daily' || day.dayType == "SUNDAY") {
        const dayValue = day.dayType == "SUNDAY" ? sundayValue : payType == 'daily' && day.dayType == "SATURDAY" ? saturdayValue : 1;
        dailyRate = roundMoney(effectiveRatePerDay * dayValue);
        dailyPay = isFirstEntry ? effectiveRatePerDay * dayValue : 0;
      } else {
        dailyPay = regularMinutes / 60 * effectiveRatePerHour;
      }
    }
    if (isCalculated && attendance.type == "overtime") {
      const rate = day?.overtimeRate ?? overtimeRateFor(workHours, "WORKDAY");
      const hourly = hourlyBaseFor(day?.baseHours || workHours.weekday);
      dailyRate = roundMoney(hourly * rate);
      dailyPay = (attendance.totalWorkedMinutes || 0) / 60 * hourly * rate;
    }

    if (
      y + rowHeight >
      doc.page.height - bottomMargin
    ) {

      doc.addPage();

      y = 40;

      y = drawTableHeader(y);
    }

    if (index % 2 === 0) {

      doc
        .rect(
          tableX,
          y - 5,
          tableWidth,
          rowHeight
        )
        .fillColor("#FBFBFB")
        .fill();
    }

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.text);

    const type =
      attendance.type?.toLowerCase();

    const statusColor =
      type === "absent"
        ? COLORS.absent
        : type === "leave"
          ? COLORS.leave
          : type === "sick"
            ? COLORS.sick
            : type === "overtime"
              ? COLORS.primary
              : COLORS.text;

    doc
      .fillColor(statusColor)
      .font(
        type === "overtime"
          ? "Helvetica-Bold"
          : "Helvetica"
      )
      .text(
        attendance.type?.toUpperCase() || "-",
        col.type,
        y,
        {
          width: colWidth.type
        }
      );

    doc
      .font("Helvetica")
      .fillColor(COLORS.text)
      .text(
        dayjs
          .utc(attendance.date)
          .format("ddd DD-MM-YYYY"),
        col.date,
        y,
        {
          width: colWidth.date
        }
      );

    doc.text(
      attendance.begin || "-",
      col.begin,
      y,
      {
        width: colWidth.begin,
      }
    );

    doc.text(
      attendance.end || "-",
      col.end,
      y,
      {
        width: colWidth.end
      }
    );

    doc.text(
      attendance.totalBreakMinutes || "-",
      col.break,
      y,
      {
        width: colWidth.break,
        align: 'center'
      }
    );

    doc.text(
      String(hours),
      col.hours,
      y,
      {
        width: colWidth.hours,
        align: 'center'
      }
    );

    doc.text(
      String(dailyRate),
      col.payRate,
      y,
      {
        width: colWidth.payRate,
        align: 'center'
      }
    );

    doc
      .font("Helvetica-Bold")
      .text(
        `${currency}${money(dailyPay)}`,
        col.sum,
        y,
        {
          width: colWidth.sum,
          align: "center"
        }
      );

    doc
      .moveTo(
        tableX,
        y + rowHeight - 5
      )
      .lineTo(
        tableX + tableWidth,
        y + rowHeight - 5
      )
      .strokeColor(COLORS.lightBorder)
      .lineWidth(0.5)
      .stroke();

    y += rowHeight;
  }

  const overtimeRows = isCalculated ? days
    .filter(day => day.extraMinutes > 0)
    .map(day => {
      const hours = roundMoney(day.extraMinutes / 60);
      return {
        label: "OVERTIME",
        reason: dayjs.utc(day.date).format("ddd DD-MM-YYYY"),
        hours,
        rate: `${roundMoney(hourlyBaseFor(day.baseHours) * day.overtimeRate)} (${day.overtimeRate}x)`,
        amount: `${currency}${money(day.extraMinutes / 60 * hourlyBaseFor(day.baseHours) * day.overtimeRate)}`
      };
    }) : [];
  const detailRows = adjustments.map(adjustment => ({
    label: adjustment.type.toUpperCase(),
    reason: adjustment.reason || "-",
    amount: `${adjustment.type == 'bonus' ? '' : '-'}${currency}${Number(adjustment.amount)},-`
  }));
  detailRows.unshift(...overtimeRows);
  if (isFixed) {
    const salaryRows = [{ label: "SALARY", reason: payType == 'monthly' ? "Monthly salary" : "Weekly salary", hours: fixed.scheduledDays + "d", amount: `${currency}${money(fixed.base)}` }];
    if (fixed.absenceDeduction > 0) {
      salaryRows.push({ label: "ABSENCE", reason: "Unpaid absence", hours: fixed.absentDays + "d", rate: money(fixed.dailyRate), amount: `-${currency}${money(fixed.absenceDeduction)}` });
    }
    detailRows.unshift(...salaryRows);
  }
  if (fullMonthBonus) {
    detailRows.push({ label: "BONUS", reason: "Full month bonus", amount: `${currency}${money(fullMonthBonus)}` });
  }
  if (taxDeductions > 0) {
    detailRows.push({ label: "TAX", reason: "Taxes & contributions", amount: `-${currency}${money(taxDeductions)}` });
  }
  for (const detail of detailRows) {

    if (y + rowHeight > doc.page.height - bottomMargin) {
      doc.addPage();

      y = 40;
      y = drawTableHeader(y);
    }

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.text);

    doc.text(
      detail.label,
      col.type,
      y,
      {
        width: colWidth.type
      }
    );

    doc.text(
      detail.reason,
      col.date,
      y,
      {
        width: colWidth.date
      }
    );

    doc.text("-", col.begin, y, {
      width: colWidth.begin
    });

    doc.text("-", col.end, y, {
      width: colWidth.end
    });

    doc.text("-", col.break, y, {
      width: colWidth.break,
      align:'center'
    });

    doc.text(String(detail.hours ?? "-"), col.hours, y, {
      width: colWidth.hours,
      align:'center'
    });

    doc.text(String(detail.rate ?? "-"), col.payRate, y, {
      width: colWidth.payRate,
      align:'center'
    });

    doc
      .font("Helvetica-Bold")
      .text(
        detail.amount,
        col.sum,
        y,
        {
          width: colWidth.sum,
          align: "center"
        }
      );

    doc
      .moveTo(tableX, y + rowHeight - 5)
      .lineTo(tableX + tableWidth, y + rowHeight - 5)
      .strokeColor(COLORS.lightBorder)
      .lineWidth(0.5)
      .stroke();

    y += rowHeight;
  }

  if (
    y + 45 >
    doc.page.height - bottomMargin
  ) {

    doc.addPage();

    y = 40;
  }

  const totalY = y + 8;
  const totalHeight = 32;

  doc
    .roundedRect(
      tableX,
      totalY - 5,
      tableWidth,
      totalHeight,
      4
    )
    .fillColor(COLORS.totalBackground)
    .fill();

  doc
    .moveTo(
      tableX,
      totalY - 5
    )
    .lineTo(
      tableX + tableWidth,
      totalY - 5
    )
    .strokeColor(COLORS.primary)
    .lineWidth(1)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      "TOTAL",
      col.hours,
      totalY + 3,
      {
        width: colWidth.hours
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      `${currency}${money(totalSalaryNet)}`,
      col.sum,
      totalY + 2,
      {
        width: colWidth.sum,
        align: "left"
      }
    );

  doc.y = totalY + 40;
  doc.x = 30;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.text);

  doc.end();
}
exports.signPdf = async ({ res, body = {}, userId }) => {
  const { employeeId, signature } = body;
  let { beginDay, endDay } = body;
  if (!mongoose.isValidObjectId(employeeId)) throw new ApiError(400, "Employee is required");
  const employee = await repo.findEmployeeById(employeeId);
  if (!employee) throw new ApiError(404, "Employee not found");
  if (typeof signature != "string" || signature.length > SIGNATURE_MAX_LENGTH || !SIGNATURE_FORMAT.test(signature)) {
    throw new ApiError(400, "Signature must be a PNG image");
  }
  const bytes = Buffer.from(signature.split(",")[1], "base64");
  if (bytes.subarray(0, 8).toString("hex") != PNG_MAGIC) throw new ApiError(400, "Signature must be a PNG image");
  if (!beginDay || !endDay) {
    const month = await getStartEndOfMonth();
    beginDay = month.beginDay;
    endDay = month.endDay;
  }
  await repo.upsertSignature({ employeeId, ...toPeriod(beginDay, endDay), signature, recordedBy: userId });
  await exports.pdf({ res, query: { employeeId, beginDay: body.beginDay, endDay: body.endDay } });
};
const EXPORT_LIMIT = 100000;
const EXPORT_COLUMNS = [
  { key: "employee", header: "Employee", width: 26 },
  { key: "payType", header: "Pay type", width: 10 },
  { key: "currency", header: "Currency", width: 9 },
  { key: "days", header: "Days worked", width: 11, type: "count" },
  { key: "saturdays", header: "Saturdays worked", width: 15, type: "count" },
  { key: "effectiveSaturdays", header: "Effective Saturdays", width: 17, type: "hours" },
  { key: "sundays", header: "Sundays", width: 9, type: "count" },
  { key: "effectiveSundays", header: "Effective Sundays", width: 16, type: "hours" },
  { key: "regularHours", header: "Regular hours", width: 13, type: "hours" },
  { key: "overtimeHours", header: "Overtime hours", width: 14, type: "hours" },
  { key: "leave", header: "Leave", width: 8, type: "count" },
  { key: "sick", header: "Sick", width: 7, type: "count" },
  { key: "absent", header: "Absent", width: 8, type: "count" },
  { key: "regularPay", header: "Regular pay", width: 13, type: "money", total: true },
  { key: "sundayPay", header: "Sunday pay", width: 12, type: "money", total: true },
  { key: "overtimePay", header: "Overtime pay", width: 13, type: "money", total: true },
  { key: "bonus", header: "Bonus", width: 11, type: "money", total: true },
  { key: "fullMonthBonus", header: "Full month bonus", width: 15, type: "money", total: true },
  { key: "gross", header: "Gross pay", width: 13, type: "money", total: true },
  { key: "wageTax", header: "Wage tax", width: 11, type: "money", total: true, tax: true },
  { key: "overtimeTax", header: "Overtime tax", width: 12, type: "money", total: true, tax: true },
  { key: "aov", header: "AOV", width: 10, type: "money", total: true, tax: true },
  { key: "pensionEmployee", header: "Pension (employee)", width: 17, type: "money", total: true, tax: true },
  { key: "healthEmployee", header: "Health ins. (employee)", width: 19, type: "money", total: true, tax: true },
  { key: "taxDeductions", header: "Total tax & contributions", width: 22, type: "money", total: true, tax: true },
  { key: "deduction", header: "Deductions", width: 12, type: "money", total: true },
  { key: "net", header: "Net pay", width: 13, type: "money", total: true },
  { key: "pensionEmployer", header: "Pension (employer)", width: 17, type: "money", total: true, tax: true },
  { key: "healthEmployer", header: "Health ins. (employer)", width: 19, type: "money", total: true, tax: true },
  { key: "notes", header: "Notes", width: 34 }
];
const NUMBER_FORMATS = { money: "#,##0.00", hours: "0.00", count: "0" };
exports.netPayFor = async ({ beginDay, endDay, employeeIds = null }) => {
  assertPeriod(beginDay, endDay);
  const range = toQueryRange(beginDay, endDay);
  const frozen = await periodService.getFrozenContext(beginDay, endDay);
  const [records, adjustments, liveApplyTax] = await Promise.all([
    repo.findPayrollRecords({ ...range, includeIds: frozen?.employeeIds, fixedIds: frozen?.fixedEmployeeIds }),
    repo.findAdjustments(range),
    frozen ? null : isTaxEnabled()
  ]);
  const applyTax = frozen ? frozen.applyTax : liveApplyTax;
  const workHours = frozen ? frozen.workHours : await getWorkHours();
  const wanted = employeeIds ? new Set(employeeIds.map(String)) : null;
  const result = new Map();
  for (const record of records) {
    if (wanted && !wanted.has(String(record._id))) continue;
    const employee = frozen ? frozen.freeze(record.employee) : record.employee;
    const payrollData = await getPayrollData(record.payrollRecords, workHours);
    const salary = await calculateSalary({
      employee,
      payrollData,
      adjustments: adjustments.filter(adjustment => String(adjustment.employeeId) == String(record._id)),
      beginDay,
      endDay,
      applyTax,
      taxSettings: frozen?.taxSettings
    });
    result.set(String(record._id), {
      name: `${employee.user?.firstName || ""} ${employee.user?.lastName || ""}`.trim(),
      currency: employee.salary?.currency || "SRD",
      net: roundMoney(salary.net),
      isCalculated: salary.isCalculated
    });
  }
  return result;
};
exports.exportXlsx = async ({ res, query }) => {
  let { beginDay, endDay } = query;
  if (!beginDay || !endDay) {
    const month = await getStartEndOfMonth();
    beginDay = month.beginDay;
    endDay = month.endDay;
  }
  assertPeriod(beginDay, endDay);
  const range = toQueryRange(beginDay, endDay);
  const frozen = await periodService.getFrozenContext(beginDay, endDay);
  const [[result], adjustments, company, liveApplyTax] = await Promise.all([
    repo.findAll({ ...range, limit: EXPORT_LIMIT, skip: 0, includeIds: frozen?.employeeIds, fixedIds: frozen?.fixedEmployeeIds }),
    repo.findAdjustments(range),
    repo.findCompany(),
    frozen ? null : isTaxEnabled()
  ]);
  const applyTax = frozen ? frozen.applyTax : liveApplyTax;
  const records = result?.data || [];
  const adjustmentsByEmployee = {};
  for (const adjustment of adjustments) {
    (adjustmentsByEmployee[String(adjustment.employeeId)] ||= []).push(adjustment);
  }
  const workHours = frozen ? frozen.workHours : await getWorkHours();
  const names = {};
  const rows = [];
  for (const record of records) {
    const employee = frozen ? frozen.freeze(record.employee) : record.employee;
    const name = `${employee.user?.firstName || ""} ${employee.user?.lastName || ""}`.trim();
    names[String(record._id)] = name;
    const payrollData = await getPayrollData(record.payrollRecords, workHours);
    const salary = await calculateSalary({
      employee,
      payrollData,
      adjustments: adjustmentsByEmployee[String(record._id)] || [],
      beginDay,
      endDay,
      applyTax,
      taxSettings: frozen?.taxSettings
    });
    const tax = salary.tax?.applied ? salary.tax : {};
    const notes = [];
    if (salary.fixed) notes.push(`${employee.salary.payType} salary for ${salary.fixed.scheduledDays} workdays${salary.fixed.absentDays ? `, ${salary.fixed.absentDays} unpaid absent` : ""}`);
    if (!salary.isCalculated) notes.push(`Salary not calculated for ${employee.salary.payType} pay`);
    if (salary.tax && !salary.tax.applied) notes.push(`Tax not calculated for ${employee.salary.currency} salaries`);
    rows.push({
      employee: name,
      payType: employee.salary.payType,
      currency: employee.salary.currency,
      days: salary.fixed ? getMonthlyAttendance({ employee, attendances: record.payrollRecords, workHours, beginDay, endDay }).workedDays : payrollData.totalWeekDays + payrollData.totalSaturdays,
      saturdays: payrollData.totalSaturdays,
      effectiveSaturdays: salary.effectiveSaturdays,
      sundays: payrollData.totalSundays,
      effectiveSundays: salary.effectiveSundays,
      regularHours: roundMoney(await mTh(payrollData.totalWeekDayMinutes)),
      overtimeHours: roundMoney(await mTh(payrollData.totalOvertimeMinutes)),
      leave: payrollData.totalLeave,
      sick: payrollData.totalSick,
      absent: payrollData.totalAbsent,
      regularPay: salary.regularPay,
      sundayPay: salary.sundayPay,
      overtimePay: salary.overtimePay,
      bonus: salary.bonus,
      fullMonthBonus: salary.fullMonthBonus,
      gross: salary.gross,
      wageTax: tax.wageTax,
      overtimeTax: tax.overtimeTax,
      aov: tax.aov,
      pensionEmployee: tax.pensionEmployee,
      healthEmployee: tax.healthEmployee,
      taxDeductions: salary.taxDeductions,
      deduction: salary.deduction,
      net: salary.net,
      pensionEmployer: tax.pensionEmployer,
      healthEmployer: tax.healthEmployer,
      notes: notes.join("; ")
    });
  }
  const hasFullMonthBonus = rows.some(row => row.fullMonthBonus);
  const columns = EXPORT_COLUMNS.filter(column => (applyTax || !column.tax) && (column.key != "fullMonthBonus" || hasFullMonthBonus));
  const period = `${dayjs.utc(beginDay).format("DD-MM-YYYY")} – ${dayjs.utc(endDay).format("DD-MM-YYYY")}`;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = company?.name || CONSTANT_COMPANY_NAME;
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Payroll", { views: [{ state: "frozen", xSplit: 1, ySplit: 6 }] });
  sheet.columns = columns.map(({ key, width }) => ({ key, width }));
  sheet.getCell("A1").value = company?.legalName || company?.name || CONSTANT_COMPANY_NAME;
  sheet.getCell("A1").font = { bold: true, size: 14 };
  sheet.getCell("A2").value = `Payroll ${period}`;
  sheet.getCell("A3").value = company?.taxNumber ? `Tax number: ${company.taxNumber}` : "";
  sheet.getCell("A4").value = [
    applyTax ? "Taxes and contributions applied (SRD salaries)" : "Taxes and contributions not applied",
    frozen ? `Closed period (${dayjs.utc(frozen.closedAt).utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format("DD-MM-YYYY HH:mm")})` : ""
  ].filter(Boolean).join(" · ");
  sheet.getCell("A4").font = { italic: true, color: { argb: "FF6B7280" } };
  const header = sheet.getRow(6);
  header.values = columns.map(column => column.header);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 30;
  header.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA46023" } };
  });
  for (const row of rows) {
    sheet.addRow(Object.fromEntries(columns.map(({ key, type }) => {
      const value = row[key];
      return [key, type == "money" && value != null ? roundMoney(value) : value ?? null];
    })));
  }
  if (rows.length) {
    sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6 + rows.length, column: columns.length } };
  }
  const currencies = [...new Set(rows.map(row => row.currency))];
  if (currencies.length) sheet.addRow([]);
  for (const currency of currencies) {
    const scoped = rows.filter(row => row.currency == currency);
    const totalRow = sheet.addRow(Object.fromEntries(columns.map(({ key, total }) => {
      if (key == "employee") return [key, `Total ${currency} (${scoped.length})`];
      if (key == "currency") return [key, currency];
      if (!total) return [key, null];
      return [key, roundMoney(scoped.reduce((sum, row) => sum + (row[key] || 0), 0))];
    })));
    totalRow.font = { bold: true };
    totalRow.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6EBE1" } };
    });
  }
  columns.forEach(({ type }, index) => {
    if (NUMBER_FORMATS[type]) sheet.getColumn(index + 1).numFmt = NUMBER_FORMATS[type];
  });
  const adjustmentSheet = workbook.addWorksheet("Adjustments", { views: [{ state: "frozen", ySplit: 1 }] });
  adjustmentSheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Employee", key: "employee", width: 26 },
    { header: "Type", key: "type", width: 11 },
    { header: "Reason", key: "reason", width: 34 },
    { header: "Amount", key: "amount", width: 13, style: { numFmt: NUMBER_FORMATS.money } }
  ];
  adjustmentSheet.getRow(1).font = { bold: true };
  for (const adjustment of adjustments) {
    const employeeId = String(adjustment.employeeId);
    if (!(employeeId in names)) continue;
    adjustmentSheet.addRow({
      date: dayjs.utc(adjustment.date).format("DD-MM-YYYY"),
      employee: names[employeeId],
      type: adjustment.type,
      reason: adjustment.reason || "",
      amount: roundMoney(adjustment.type == "deduction" ? -adjustment.amount : adjustment.amount)
    });
  }
  const fileName = `payroll_${dayjs.utc(beginDay).format("YYYY-MM-DD")}_${dayjs.utc(endDay).format("YYYY-MM-DD")}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  await workbook.xlsx.write(res);
  res.end();
};
const resolvePeriod = async ({ beginDay, endDay }) => {
  if (!beginDay || !endDay) {
    const month = await getStartEndOfMonth();
    beginDay = dayjs.utc(month.beginDay).format("YYYY-MM-DD");
    endDay = dayjs.utc(month.endDay).format("YYYY-MM-DD");
  }
  assertPeriod(beginDay, endDay);
  return { beginDay, endDay };
};
const periodLabel = (beginDay, endDay) => `${dayjs.utc(beginDay).format("DD-MM-YYYY")} – ${dayjs.utc(endDay).format("DD-MM-YYYY")}`;
const slug = (value) => String(value || "").normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
exports.renderPayslip = async ({ employeeId, beginDay, endDay }) => {
  const stream = new PassThrough();
  stream.setHeader = () => {};
  stream.headersSent = false;
  const chunks = [];
  stream.on("data", (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  await exports.pdf({ res: stream, query: { employeeId, beginDay, endDay } });
  await finished;
  return Buffer.concat(chunks);
};
exports.deliveryOptions = async () => ({
  email: mailService.isConfigured()
});
const emailOne = async ({ employee, beginDay, endDay, company, userId }) => {
  const user = employee.user || employee.userId || {};
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const to = String(user.email || "").trim();
  if (!to) return { status: "skipped", name, reason: "no email address" };
  const range = toPeriod(beginDay, endDay);
  try {
    const pdf = await exports.renderPayslip({ employeeId: String(employee._id), beginDay, endDay });
    const companyName = company?.name || CONSTANT_COMPANY_NAME;
    const label = periodLabel(beginDay, endDay);
    await mailService.sendMail({
      to,
      subject: `Payslip ${label} – ${companyName}`,
      text: `Dear ${user.firstName || name},\n\nAttached is your payslip for ${label}.\n\nKind regards,\n${companyName}`,
      attachments: [{
        filename: `payslip_${dayjs.utc(beginDay).format("YYYY-MM-DD")}_${dayjs.utc(endDay).format("YYYY-MM-DD")}_${slug(name) || "employee"}.pdf`,
        content: pdf,
        contentType: "application/pdf"
      }]
    });
    await repo.createDelivery({ employeeId: employee._id, ...range, to, status: "sent", sentBy: userId });
    return { status: "sent", name, to };
  } catch (error) {
    if (error?.isOperational) throw error;
    await repo.createDelivery({ employeeId: employee._id, ...range, to, status: "failed", error: String(error?.message || error).slice(0, 300), sentBy: userId });
    return { status: "failed", name, to, reason: "the email could not be sent" };
  }
};
exports.emailPayslip = async (body = {}, userId) => {
  if (!mailService.isConfigured()) throw new ApiError(400, "Email is not set up on the server yet");
  if (!mongoose.isValidObjectId(body.employeeId)) throw new ApiError(400, "Employee is required");
  const { beginDay, endDay } = await resolvePeriod(body);
  const [employee, company] = await Promise.all([repo.findEmployeeContact(body.employeeId), repo.findCompany()]);
  if (!employee) throw new ApiError(404, "Employee not found");
  const result = await emailOne({ employee, beginDay, endDay, company, userId });
  if (result.status == "skipped") throw new ApiError(400, "This employee has no email address");
  if (result.status == "failed") throw new ApiError(502, "The email could not be sent. Check the email settings and try again.");
  return result;
};
exports.emailAllPayslips = async (body = {}, userId) => {
  if (!mailService.isConfigured()) throw new ApiError(400, "Email is not set up on the server yet");
  const { beginDay, endDay } = await resolvePeriod(body);
  const frozen = await periodService.getFrozenContext(beginDay, endDay);
  const [[result], company] = await Promise.all([
    repo.findAll({ ...toQueryRange(beginDay, endDay), limit: EXPORT_LIMIT, skip: 0, includeIds: frozen?.employeeIds, fixedIds: frozen?.fixedEmployeeIds }),
    repo.findCompany()
  ]);
  const summary = { sent: [], skipped: [], failed: [] };
  for (const record of result?.data || []) {
    const outcome = await emailOne({ employee: record.employee, beginDay, endDay, company, userId });
    summary[outcome.status].push(outcome);
  }
  return {
    period: periodLabel(beginDay, endDay),
    sent: summary.sent.length,
    skipped: summary.skipped,
    failed: summary.failed
  };
};
const BANK_CURRENCIES = ["SRD", "USD", "EUR"];
const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
exports.bankFile = async ({ res, query }) => {
  const { beginDay, endDay } = await resolvePeriod(query);
  const format = query.format == "csv" ? "csv" : "xlsx";
  const currency = query.currency ? String(query.currency).toUpperCase() : "";
  if (currency && !BANK_CURRENCIES.includes(currency)) throw new ApiError(400, "Choose SRD, USD or EUR");
  if (format == "csv" && !currency) throw new ApiError(400, "Choose one currency for a CSV bank file");
  const range = toQueryRange(beginDay, endDay);
  const frozen = await periodService.getFrozenContext(beginDay, endDay);
  const [[result], adjustments, company, liveApplyTax] = await Promise.all([
    repo.findAll({ ...range, limit: EXPORT_LIMIT, skip: 0, includeIds: frozen?.employeeIds, fixedIds: frozen?.fixedEmployeeIds }),
    repo.findAdjustments(range),
    repo.findCompany(),
    frozen ? null : isTaxEnabled()
  ]);
  const applyTax = frozen ? frozen.applyTax : liveApplyTax;
  const workHours = frozen ? frozen.workHours : await getWorkHours();
  const adjustmentsByEmployee = {};
  for (const adjustment of adjustments) {
    (adjustmentsByEmployee[String(adjustment.employeeId)] ||= []).push(adjustment);
  }
  const description = `Salary ${periodLabel(beginDay, endDay)}`;
  const payments = [];
  for (const record of result?.data || []) {
    const employee = frozen ? frozen.freeze(record.employee) : record.employee;
    if (currency && employee.salary?.currency != currency) continue;
    const payrollData = await getPayrollData(record.payrollRecords, workHours);
    const salary = await calculateSalary({
      employee,
      payrollData,
      adjustments: adjustmentsByEmployee[String(record._id)] || [],
      beginDay,
      endDay,
      applyTax,
      taxSettings: frozen?.taxSettings
    });
    const amount = roundMoney(salary.net);
    if (amount <= 0) continue;
    const name = `${employee.user?.firstName || ""} ${employee.user?.lastName || ""}`.trim();
    payments.push({
      employee: name,
      accountHolder: employee.bank?.accountHolder || name,
      bank: employee.bank?.name || "",
      accountNumber: employee.bank?.accountNumber || "",
      amount,
      currency: employee.salary.currency,
      description
    });
  }
  const ready = payments.filter(payment => payment.accountNumber);
  const missing = payments.filter(payment => !payment.accountNumber);
  const fileBase = `bank_payments_${dayjs.utc(beginDay).format("YYYY-MM-DD")}_${dayjs.utc(endDay).format("YYYY-MM-DD")}${currency ? "_" + currency : ""}`;
  res.setHeader("X-Missing-Accounts", String(missing.length));
  if (format == "csv") {
    const lines = [["account_holder", "bank", "account_number", "amount", "currency", "description"].join(",")];
    for (const payment of ready) {
      lines.push([payment.accountHolder, payment.bank, payment.accountNumber, payment.amount.toFixed(2), payment.currency, payment.description].map(csvCell).join(","));
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.csv"`);
    return res.send("\uFEFF" + lines.join("\r\n") + "\r\n");
  }
  const workbook = new ExcelJS.Workbook();
  workbook.creator = company?.name || CONSTANT_COMPANY_NAME;
  workbook.created = new Date();
  const columns = [
    { header: "Account holder", key: "accountHolder", width: 28 },
    { header: "Bank", key: "bank", width: 18 },
    { header: "Account number", key: "accountNumber", width: 20 },
    { header: "Amount", key: "amount", width: 14, style: { numFmt: NUMBER_FORMATS.money } },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Description", key: "description", width: 34 }
  ];
  for (const code of (currency ? [currency] : BANK_CURRENCIES)) {
    const rows = ready.filter(payment => payment.currency == code);
    if (!rows.length && !currency) continue;
    const sheet = workbook.addWorksheet(code, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };
    rows.forEach(row => sheet.addRow(row));
    const total = sheet.addRow({ accountHolder: `Total (${rows.length})`, amount: roundMoney(rows.reduce((sum, row) => sum + row.amount, 0)), currency: code });
    total.font = { bold: true };
  }
  if (missing.length) {
    const sheet = workbook.addWorksheet("Missing bank details");
    sheet.columns = [
      { header: "Employee", key: "employee", width: 28 },
      { header: "Amount", key: "amount", width: 14, style: { numFmt: NUMBER_FORMATS.money } },
      { header: "Currency", key: "currency", width: 10 }
    ];
    sheet.getRow(1).font = { bold: true };
    missing.forEach(row => sheet.addRow(row));
  }
  if (!workbook.worksheets.length) {
    const sheet = workbook.addWorksheet("Payments");
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };
  }
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};
