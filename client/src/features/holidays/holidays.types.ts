export type HolidayRows = {
  id: string;
  name: string;
  date: string;
  type: string;
  rate: number;
  paid?: string;
  description?: string;
  createdAt?: string;
};
export type HolidaySearch = {
  name: string;
}
export type getHolidaysParams = {
  page: number;
  search: HolidaySearch;
}