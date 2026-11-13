export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type CompanyContact = {
  name: string;
  role: string;
  phone: string;
  email: string;
}
export type CompanyOpeningHour = {
  day: Weekday;
  open: boolean;
  begin: string;
  end: string;
}
export type Company = {
  name: string;
  legalName: string;
  registrationNumber: string;
  taxNumber: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string;
  address: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };
  contacts: CompanyContact[];
  openingHours: CompanyOpeningHour[];
  currency: "SRD" | "USD" | "EUR";
  timezone: string;
  payslip: {
    showCompanyDetails: boolean;
  };
  updatedAt: string | null;
  configured: boolean;
}
export type CompanyPayload = Omit<Company, "updatedAt" | "configured">;
