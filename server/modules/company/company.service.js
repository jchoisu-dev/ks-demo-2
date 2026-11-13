const repo = require("./company.repository");
const { ApiError } = require('../../shared/utils');
const {
  CONSTANT_COMPANY_NAME,
  CONSTANT_COMPANY_ADDRESS,
  CONSTANT_COMPANY_AREA,
  CONSTANT_CONTACT_PRIMARY,
  CONSTANT_CONTACT_SECONDARY
} = require('@/shared/constants');
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const EDITABLE_FIELDS = [
  "name",
  "legalName",
  "registrationNumber",
  "taxNumber",
  "description",
  "email",
  "phone",
  "website",
  "logoUrl",
  "address",
  "contacts",
  "openingHours",
  "currency",
  "timezone",
  "payslip"
];
const parseContact = (value) => {
  const parts = value.trim().split(" ");
  const name = parts.pop();
  return {
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    phone: parts.join(" ")
  };
}
const [area, country] = CONSTANT_COMPANY_AREA.split(",").map(value => value.trim());
const DEFAULTS = {
  name: CONSTANT_COMPANY_NAME,
  address: {
    street: CONSTANT_COMPANY_ADDRESS,
    district: area,
    country: country || "Suriname"
  },
  contacts: [
    parseContact(CONSTANT_CONTACT_PRIMARY),
    parseContact(CONSTANT_CONTACT_SECONDARY)
  ],
  logoUrl: ""
};
const serialize = (company, configured) => ({
  name: company.name,
  legalName: company.legalName,
  registrationNumber: company.registrationNumber,
  taxNumber: company.taxNumber,
  description: company.description,
  email: company.email,
  phone: company.phone,
  website: company.website,
  logoUrl: company.logoUrl,
  address: {
    street: company.address?.street || "",
    city: company.address?.city || "",
    district: company.address?.district || "",
    postalCode: company.address?.postalCode || "",
    country: company.address?.country || ""
  },
  contacts: (company.contacts || []).map(({ name, role, phone, email }) => ({ name, role, phone, email })),
  openingHours: WEEKDAYS.map(day => {
    const hours = (company.openingHours || []).find(item => item.day == day);
    return {
      day,
      open: Boolean(hours?.open),
      begin: hours?.begin || "",
      end: hours?.end || ""
    };
  }),
  currency: company.currency,
  timezone: company.timezone,
  payslip: {
    showCompanyDetails: company.payslip?.showCompanyDetails === true
  },
  updatedAt: company.updatedAt || null,
  configured
});
const normalizeOpeningHours = (openingHours) => {
  if (openingHours === undefined) return undefined;
  if (!Array.isArray(openingHours)) throw new ApiError(400, "Opening hours must be a list");
  return WEEKDAYS.map(day => {
    const hours = openingHours.find(item => item?.day == day) || {};
    const open = Boolean(hours.open);
    const begin = hours.begin || "";
    const end = hours.end || "";
    if (open && (!begin || !end)) {
      throw new ApiError(400, `Opening hours for ${day} need an opening and closing time`);
    }
    if (open && begin >= end) {
      throw new ApiError(400, `Closing time for ${day} must be after the opening time`);
    }
    return { day, open, begin, end };
  });
}
exports.getCompany = async () => {
  const company = await repo.findOne();
  if (!company) return serialize(repo.build(DEFAULTS).toObject(), false);
  return serialize(company, true);
}
exports.updateCompany = async (body = {}, userId) => {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (data.payslip !== undefined) {
    data.payslip = { showCompanyDetails: data.payslip?.showCompanyDetails === true };
  }
  const openingHours = normalizeOpeningHours(data.openingHours);
  if (openingHours) data.openingHours = openingHours;
  if (data.contacts !== undefined && !Array.isArray(data.contacts)) {
    throw new ApiError(400, "Contacts must be a list");
  }
  const current = await repo.findOne();
  const candidate = repo.build({ ...(current || {}), ...data });
  const error = candidate.validateSync();
  if (error) {
    const [first] = Object.values(error.errors);
    throw new ApiError(400, first.message);
  }
  const company = await repo.upsert({ ...data, updatedBy: userId });
  return serialize(company, true);
}
exports.updateSettings = async (data, userId) => {
  return await repo.upsertWithDefaults({ ...data, updatedBy: userId }, DEFAULTS);
}
