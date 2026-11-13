const express = require("express");
const cors = require('cors');
const helmet = require('helmet');
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  next();
});
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /\n");
});
app.use(express.json({ limit: "1mb" }));
app.use(cors({
  origin: (process.env.CORS_ORIGINS || "http://localhost:3000").split(",").map(origin => origin.trim()).filter(Boolean),
  credentials: true,
  exposedHeaders: ["X-Signed-At", "X-Missing-Accounts"]
}));
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/dashboard", require("./modules/dashboard/dashboard.routes"));
app.use("/api/employee", require("./modules/employee/employee.routes"));
app.use("/api/attendance", require("./modules/attendance/attendance.routes"));
app.use("/api/payroll/payouts", require("./modules/payout/payout.routes"));
app.use("/api/payroll", require("./modules/payroll/payroll.routes"));
app.use("/api/adjustment", require("./modules/adjustment/adjustment.routes"));
app.use("/api/holiday", require("./modules/holiday/holiday.routes"));
app.use("/api/settings/currencies", require("./modules/currency/currency.routes"));
app.use("/api/settings", require("./modules/settings/settings.routes"));
app.use("/api/settings/shifts", require("./modules/shift/shift.routes"));
app.use("/api/settings/company", require("./modules/company/company.routes"));
app.use("/api/settings/tax", require("./modules/tax/tax.routes"));
app.use("/api/settings/work-hours", require("./modules/workhours/workhours.routes"));
app.use("/api/logs", require("./modules/log/log.routes"));
app.use("/api/users", require("./modules/user/user.routes"));
app.use("/api/payroll-periods", require("./modules/period/period.routes"));
app.use("/api/leave", require("./modules/leave/leave.routes"));
app.use("/api/uploads/presigned-url", require("./modules/r2/r2.routes"));
app.use(require("./shared/middleware/error.middleware"));
module.exports = app;