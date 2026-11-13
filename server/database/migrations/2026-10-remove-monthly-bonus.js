require("dotenv").config({ path: `.env.${process.env.ENV || "development"}` });
const mongoose = require("mongoose");
const run = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing");
  await mongoose.connect(process.env.MONGO_URI);
  const employees = mongoose.connection.db.collection("employees");
  const affected = await employees.countDocuments({ incentive_monthly: { $exists: true } });
  const result = await employees.updateMany({ incentive_monthly: { $exists: true } }, { $unset: { incentive_monthly: "" } });
  console.log(`Employees with a monthly bonus: ${affected}. Removed from: ${result.modifiedCount}.`);
  await mongoose.disconnect();
};
run().catch(async (error) => {
  console.error("Migration failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
