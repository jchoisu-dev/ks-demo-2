export type Employee = {
  id: string;
  type: string;
  pay_type: string;
  currency: string;
  amount: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  createdAt: string;
  hiredAt?: string;
  startWorkDay?: string;
  endWorkDay?: string;
  birthdate?: string;
  profileImage?: string;
  leaveDaysPerYear?: number | null;
  bank?: {
    name: string;
    accountNumber: string;
    accountHolder: string;
  };
}
export type EmployeeResponse = {
  data: Employee[];
}
export type EmployeeSearch = {
  q: string;
}

export type getEmployeesParams = {
  page: number;
  search: EmployeeSearch;
};