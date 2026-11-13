import { Controller, useFieldArray, useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label, TextField, TextArea, FieldError, Description, TimeField, Radio, RadioGroup } from "@heroui/react";
import { parseTime, type Time } from "@internationalized/date";
import { Plus, Trash2, Building2, Phone, MapPin, SlidersHorizontal, Clock, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button, Spinner } from "@/shared/components/ui";
import { getLocale } from "@/app/i18n";
import Section from "../components/Section";
import { useGetCompany, useUpdateCompany } from "../hooks";
import { CompanySchema, type CompanySchemaType } from "../company.schema";
import type { Company as CompanyData, CompanyPayload, Weekday } from "../company.types";
const CURRENCIES = ["SRD", "USD", "EUR"] as const;
const DEFAULT_OPENING = "08:00";
const DEFAULT_CLOSING = "17:00";
const EMPTY_CONTACT = { name: "", role: "", phone: "", email: "" };
const toTime = (value: string) => value ? parseTime(value) : null;
const fromTime = (value: Time | null) => value
  ? `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`
  : "";
const toForm = (company: CompanyData): CompanySchemaType => ({
  name: company.name,
  legalName: company.legalName,
  registrationNumber: company.registrationNumber,
  taxNumber: company.taxNumber,
  description: company.description,
  email: company.email,
  phone: company.phone,
  website: company.website,
  logoUrl: company.logoUrl,
  address: { ...company.address },
  contacts: company.contacts.map(contact => ({ ...contact })),
  openingHours: company.openingHours.map(hours => ({
    day: hours.day,
    open: hours.open,
    begin: toTime(hours.begin),
    end: toTime(hours.end)
  })),
  currency: company.currency,
  timezone: company.timezone,
  payslip: { showCompanyDetails: Boolean(company.payslip?.showCompanyDetails) }
});
const toPayload = (values: CompanySchemaType): CompanyPayload => ({
  ...values,
  openingHours: values.openingHours.map(hours => ({
    day: hours.day as Weekday,
    open: hours.open,
    begin: fromTime(hours.begin),
    end: fromTime(hours.end)
  }))
});
const weekdayName = (index: number, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date(2024, 0, 1 + index));
type TextInputProps = {
  control: Control<CompanySchemaType>;
  name: any;
  label: string;
  placeholder?: string;
  description?: string;
  type?: string;
  isRequired?: boolean;
}
const TextInput = ({ control, name, label, placeholder, description, type, isRequired }: TextInputProps) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState }) => (
      <TextField
        {...field}
        value={field.value ?? ""}
        type={type}
        isInvalid={fieldState.invalid}
        isRequired={isRequired}
        fullWidth
      >
        <Label>{label}</Label>
        <Input placeholder={placeholder} />
        {description && <Description>{description}</Description>}
        <FieldError>{fieldState.error?.message}</FieldError>
      </TextField>
    )}
  />
);
const Company = () => {
  const { data: company, isPending } = useGetCompany();
  if (isPending || !company) return <Spinner />;
  return <CompanyForm company={company} />;
}
const CompanyForm = ({ company }: { company: CompanyData }) => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const { mutate, isPending: isSaving } = useUpdateCompany();
  const { control, handleSubmit, setValue, getValues, watch, formState: { isDirty } } = useForm<CompanySchemaType>({
    resolver: zodResolver(CompanySchema),
    mode: "onSubmit",
    defaultValues: toForm(company),
    values: toForm(company)
  });
  const contacts = useFieldArray({ control, name: "contacts" });
  const logoUrl = watch("logoUrl");
  const openingHours = watch("openingHours") || [];
  const name = watch("name");
  const address = watch("address");
  const addressLine = [address?.street, address?.city, address?.district, address?.country].filter(Boolean).join(", ");
  return <form
    id="COMPANY_FORM"
    onSubmit={handleSubmit((values) => mutate(toPayload(values)))}
    noValidate
    className="flex flex-col gap-4 sm:gap-5"
  >

    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{t("company.title")}</h1>
        <p className="text-sm text-gray-500">{t("company.subtitle")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {isDirty && <span className="hidden sm:inline text-sm text-gray-500">{t("company.unsavedChanges")}</span>}
        <Button type="submit" isPending={isSaving}>
          {isSaving ? t("common.loading") + "..." : t("common.save")}
        </Button>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="grid place-items-center size-16 shrink-0 rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {logoUrl
          ? <img src={logoUrl} alt="" className="size-14 object-contain" />
          : <Building2 size={28} className="text-[#a46023]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-semibold text-gray-900 truncate">{name || t("company.name")}</p>
        <p className="text-sm text-gray-500 truncate">{addressLine || "—"}</p>
      </div>
      <div className="flex flex-col sm:items-end gap-1">
        {company.configured
          ? <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            <CheckCircle2 size={14} /> {t("company.saved")}
          </span>
          : <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <AlertCircle size={14} /> {t("company.notSavedShort")}
          </span>}
        <span className="text-xs text-gray-500">
          {company.configured && company.updatedAt
            ? t("company.lastUpdated", { date: dayjs(company.updatedAt).format("LLL") })
            : t("company.showingDefaults")}
        </span>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

      <Section title={t("company.general")} description={t("company.generalHint")} icon={Building2}>
        <TextInput control={control} name="name" label={t("company.name")} isRequired />
        <TextInput control={control} name="legalName" label={t("company.legalName")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput control={control} name="registrationNumber" label={t("company.registrationNumber")} />
          <TextInput control={control} name="taxNumber" label={t("company.taxNumber")} />
        </div>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextArea
              {...field}
              value={field.value ?? ""}
              fullWidth
              aria-label={t("company.description")}
              className="h-28"
              placeholder={t("company.descriptionPlaceholder")}
            />
          )}
        />
      </Section>

      <Section title={t("company.contact")} description={t("company.contactHint")} icon={Phone}>
        <TextInput control={control} name="email" type="email" label={t("company.email")} placeholder="info@example.com" />
        <TextInput control={control} name="phone" type="tel" label={t("company.phone")} placeholder="+597 ..." />
        <TextInput control={control} name="website" label={t("company.website")} placeholder="https://" />
        <TextInput control={control} name="logoUrl" label={t("company.logoUrl")} placeholder="https://" />
      </Section>

      <Section title={t("company.address")} description={t("company.addressHint")} icon={MapPin}>
        <TextInput control={control} name="address.street" label={t("company.street")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput control={control} name="address.city" label={t("company.city")} />
          <TextInput control={control} name="address.district" label={t("company.district")} />
          <TextInput control={control} name="address.postalCode" label={t("company.postalCode")} />
          <TextInput control={control} name="address.country" label={t("company.country")} />
        </div>
      </Section>

      <Section title={t("company.preferences")} description={t("company.preferencesHint")} icon={SlidersHorizontal}>
        <Controller
          name="currency"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onChange={field.onChange}
              orientation="horizontal"
              aria-label={t("company.currency")}
            >
              <Label>{t("company.currency")}</Label>
              {CURRENCIES.map(currency => (
                <Radio value={currency} key={currency}>
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    {currency}
                  </Radio.Content>
                  <Description>{t(`currencies.${currency}`)}</Description>
                </Radio>
              ))}
            </RadioGroup>
          )}
        />
        <TextInput
          control={control}
          name="timezone"
          label={t("company.timezone")}
          description={t("company.timezoneHint")}
          isRequired
        />
        <Controller
          name="payslip.showCompanyDetails"
          control={control}
          render={({ field }) => (
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex-1 min-w-0">
                <p id="payslip-header-label" className="text-sm font-medium text-gray-900">{t("company.payslipHeader")}</p>
                <p className="text-xs text-gray-500">{t("company.payslipHeaderHint")}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(field.value)}
                aria-labelledby="payslip-header-label"
                onClick={() => field.onChange(!field.value)}
                className="flex items-center gap-2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a46023]"
              >
                <span className={"relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors " + (field.value ? "bg-[#a46023]" : "bg-gray-300")}>
                  <span className={"absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform " + (field.value ? "translate-x-4" : "")} />
                </span>
              </button>
            </div>
          )}
        />
      </Section>

      <Section title={t("company.openingHours")} description={t("company.openingHoursHint")} icon={Clock} className="lg:col-span-2">
        <ul className="flex flex-col gap-1">
          {openingHours.map((hours, index) => (
            <li key={hours.day} className={"grid grid-cols-2 sm:grid-cols-[10rem_8rem_1fr_1fr] items-start gap-3 rounded-xl px-3 py-2.5 transition-colors " + (hours.open ? "hover:bg-gray-50" : "bg-gray-50/70")}>
              <span className={"font-medium pt-2 capitalize " + (hours.open ? "text-gray-900" : "text-gray-500")}>{weekdayName(index, locale)}</span>

              <Controller
                name={`openingHours.${index}.open`}
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(field.value)}
                    aria-label={`${weekdayName(index, locale)}: ${field.value ? t("company.open") : t("company.closed")}`}
                    onClick={() => {
                      const open = !field.value;
                      field.onChange(open);
                      if (open && !getValues(`openingHours.${index}.begin`)) setValue(`openingHours.${index}.begin`, parseTime(DEFAULT_OPENING));
                      if (open && !getValues(`openingHours.${index}.end`)) setValue(`openingHours.${index}.end`, parseTime(DEFAULT_CLOSING));
                    }}
                    className="mt-2 justify-self-end sm:justify-self-start flex items-center gap-2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a46023]"
                  >
                    <span className={"relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors " + (field.value ? "bg-[#a46023]" : "bg-gray-300")}>
                      <span className={"absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform " + (field.value ? "translate-x-4" : "")} />
                    </span>
                    <span className="text-sm">{field.value ? t("company.open") : t("company.closed")}</span>
                  </button>
                )}
              />

              {(["begin", "end"] as const).map(key => (
                <Controller
                  key={key}
                  name={`openingHours.${index}.${key}`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <TimeField
                      value={field.value}
                      onChange={field.onChange}
                      isDisabled={!hours.open}
                      isInvalid={fieldState.invalid}
                      fullWidth
                    >
                      <Label className="sm:sr-only">{key == "begin" ? t("company.opens") : t("company.closes")}</Label>
                      <TimeField.Group>
                        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
                      </TimeField.Group>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </TimeField>
                  )}
                />
              ))}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("company.contacts")} description={t("company.contactsHint")} icon={Users} className="lg:col-span-2">
        {contacts.fields.length == 0 && <p className="text-sm text-gray-500">{t("company.noContacts")}</p>}

        {contacts.fields.map((contact, index) => (
          <div key={contact.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4">
            <TextInput control={control} name={`contacts.${index}.name`} label={t("company.contactName")} isRequired />
            <TextInput control={control} name={`contacts.${index}.role`} label={t("company.contactRole")} />
            <TextInput control={control} name={`contacts.${index}.phone`} type="tel" label={t("company.phone")} />
            <TextInput control={control} name={`contacts.${index}.email`} type="email" label={t("company.email")} />
            <button
              type="button"
              aria-label={t("company.removeContact")}
              title={t("company.removeContact")}
              className="lg:mt-6 justify-self-start p-2 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
              onClick={() => contacts.remove(index)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <div>
          <Button
            className="bg-white text-black border"
            onPress={() => contacts.append({ ...EMPTY_CONTACT })}
          >
            <Plus size={16} />
            {t("company.addContact")}
          </Button>
        </div>
      </Section>

    </div>

  </form>
}
export default Company;
