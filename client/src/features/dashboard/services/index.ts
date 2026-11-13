import api from "../api";
export const fetchDashboard = async (month: string) => {
  const dashboard = await api.getDashboard(month);
  return dashboard;
};
export const fetchBreakdown = async (params: Parameters<typeof api.getBreakdown>[0]) => {
  const breakdown = await api.getBreakdown(params);
  return breakdown;
};
export const fetchAdjustments = async (params: { month: string; page: number }) => {
  const adjustments = await api.getAdjustments(params);
  return adjustments;
};
export default {
  fetchDashboard,
  fetchBreakdown,
  fetchAdjustments
}
