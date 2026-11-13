import { useState } from "react";
import dayjs from "dayjs";
import HrDashboard from "./HrDashboard";
const Dashboard = () => {
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  return <HrDashboard month={month} setMonth={setMonth} />;
};
export default Dashboard;
