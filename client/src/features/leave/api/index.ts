import axios from "@/shared/api/axios";
import type { GetLeaveParams, LeaveBalances } from "../leave.types";
const getBalances = async ({ page, year, q }: GetLeaveParams): Promise<LeaveBalances> => {
  const { data } = await axios.get("/leave", { params: { page, year, q: q || undefined } });
  return data;
};
export default {
  getBalances
}
