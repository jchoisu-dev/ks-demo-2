const dotenv = require("dotenv");
dotenv.config({
  path: `.env.${process.env.ENV || "development"}`
});
require('module-alias/register');
require("./database");
const { connectDB, env } = require("./config");
const app = require("./app");
const PORT = env.PORT || 9000;
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});
const startServer = async () => 
{
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};
startServer();
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down...");
  server.close(() => {
    process.exit(0);
  });
});