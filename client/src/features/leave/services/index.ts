import api from "../api";
import type { GetLeaveParams } from "../leave.types";
export const fetchBalances = async (params: GetLeaveParams) => {
  const balances = await api.getBalances(params);
  return balances;
};
export default {
  fetchBalances
}
