import axios from "@/shared/api/axios";
import type { Dashboard, Breakdown, BreakdownItem, AdjustmentsPage } from "../dashboard.types";
const getDashboard = async (month: string): Promise<Dashboard> => {
  const { data } = await axios.get("/dashboard", {
    params: {
      month
    }
  });
  return data;
};
const getBreakdown = async ({ month, currency, item, page }: { month: string; currency: string; item: BreakdownItem; page: number }): Promise<Breakdown> => {
  const { data } = await axios.get("/dashboard/breakdown", { params: { month, currency, item, page } });
  return data;
};
const getAdjustments = async ({ month, page }: { month: string; page: number }): Promise<AdjustmentsPage> => {
  const { data } = await axios.get("/dashboard/adjustments", { params: { month, page } });
  return data;
};
export default {
  getDashboard,
  getBreakdown,
  getAdjustments
}
