import api from "../api";
import type { GetLogsParams } from '../logs.types';
export const fetchLogs = async (params: GetLogsParams) => {
  const logs = await api.getLogs(params);
  return logs;
};
export default {
  fetchLogs
}
