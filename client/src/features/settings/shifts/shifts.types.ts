export type ShiftRows = {
  id: string;
  name: string;
  begin: string;
  end: string;
  break?: number;
  type: "work" | "overtime";
  notes?: string;
};
export type ShiftSearch = {
  name: string;
}
export type getShiftsParams = {
  page: number;
  search: ShiftSearch;
}