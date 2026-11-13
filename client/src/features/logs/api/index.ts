import axios from "@/shared/api/axios";
import type { GetLogsParams, LogsResponse } from '../logs.types';
const getLogs = async ({ page, q, entity, action }: GetLogsParams): Promise<LogsResponse> => {
  const { data } = await axios.get("/logs", {
    params: {
      page,
      q: q || undefined,
      entity: entity || undefined,
      action: action || undefined
    }
  });
  return data;
};
export default {
  getLogs
}
