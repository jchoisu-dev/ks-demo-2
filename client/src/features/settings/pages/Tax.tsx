import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label, TextField, TextArea, FieldError, Alert } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { CalendarClock, Landmark, Timer, Gift, ShieldCheck, HeartPulse, Plus, Trash2, CheckCircle2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button, Spinner, DatePicker } from "@/shared/components/ui";
import { getLocale } from "@/app/i18n";
import { openModal, useAppDispatch } from "@/app/store";
import { useGetTaxVersions, useSaveTaxVersion } from "../hooks";
import { TaxSchema, type TaxSchemaType } from "../tax.schema";
import type { TaxVersion, TaxPayload } from "../tax.types";
import Section from "../components/Section";
import NumberInput from "../components/NumberInput";
import BracketsEditor from "../components/BracketsEditor";
import HealthBandsEditor from "../components/HealthBandsEditor";
import TaxCalculator from "../components/TaxCalculator";
import PayrollTaxToggle from "../components/PayrollTaxToggle";
const toForm = (version: TaxVersion): TaxSchemaType => ({
  effectiveFrom: version.effectiveFrom ? parseDate(version.effectiveFrom) : null,
  reference: version.reference,
  notes: version.notes,
  wageTax: { ...version.wageTax, brackets: version.wageTax.brackets.map(b => ({ ...b })) },
  overtimeTax: { brackets: version.overtimeTax.brackets.map(b => ({ ...b })) },
  specialPayments: { brackets: version.specialPayments.brackets.map(b => ({ ...b })) },
  exemptions: { ...version.exemptions },
  aov: { ...version.aov },
  pension: { ...version.pension },
  healthInsurance: { ...version.healthInsurance, bands: version.healthInsurance.bands.map(b => ({ ...b })) }
});
const toPayload = (values: TaxSchemaType): TaxPayload => {
  const closeBrackets = (brackets: TaxSchemaType["wageTax"]["brackets"] = []) =>
    brackets.map((bracket, index) => ({ ...bracket, upTo: index == brackets.length - 1 ? null : bracket.upTo }));
  const bands = values.healthInsurance?.bands || [];
  return {
    ...values,
    effectiveFrom: values.effectiveFrom ? values.effectiveFrom.toString() : "",
    wageTax: { ...values.wageTax, brackets: closeBrackets(values.wageTax?.brackets) },
    overtimeTax: { brackets: closeBrackets(values.overtimeTax?.brackets) },
    specialPayments: { brackets: closeBrackets(values.specialPayments?.brackets) },
    healthInsurance: {
      ...values.healthInsurance,
      bands: bands.map((band, index) => ({
        ...band,
        fromAge: index == 0 ? 0 : (Number(bands[index - 1].toAge) || 0) + 1,
        toAge: index == bands.length - 1 ? null : band.toAge
      }))
    }
  } as TaxPayload;
};
const today = () => dayjs().format("YYYY-MM-DD");
const inForceId = (versions: TaxVersion[]) => versions.find(version => version.effectiveFrom <= today())?.id ?? null;
const Tax = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const dispatch = useAppDispatch();
  const { data, isPending } = useGetTaxVersions();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaxVersion | null>(null);
  const versions = data?.versions || [];
  const currentId = inForceId(versions);
  useEffect(() => {
    if (!data) return;
    if (selected == "new") return;
    if (selected && versions.some(version => version.id == selected)) return;
    if (versions.length) setSelected(currentId ?? versions[0].id);
    else {
      setDraft({ ...data.defaults, id: null });
      setSelected("new");
    }
  }, [data, selected]);
  if (isPending || !data || !selected) return <Spinner />;
  const version = selected == "new" ? draft! : versions.find(item => item.id == selected)!;
  if (!version) return <Spinner />;
  const formatDate = (date: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
  const startNewVersion = () => {
    setDraft({ ...version, id: null, effectiveFrom: today(), updatedAt: null });
    setSelected("new");
  };
  const versionBar = <>
    <PayrollTaxToggle />

    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="grid place-items-center size-9 shrink-0 rounded-xl bg-[#f6ebe1] text-[#a46023]">
          <CalendarClock size={18} />
        </span>
        <label className="flex-1 min-w-0">
          <span className="block text-xs text-gray-500">{t("tax.version")}</span>
          <select
            className="mt-0.5 w-full md:w-80 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {selected == "new" && <option value="new">{t("tax.newVersionOption")}</option>}
            {versions.map(item => (
              <option key={item.id} value={item.id!}>
                {t("tax.effectiveFromOption", { date: formatDate(item.effectiveFrom) })}{item.id == currentId ? ` · ${t("tax.inForce")}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {version.id && version.id == currentId && <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          <CheckCircle2 size={14} /> {t("tax.inForce")}
        </span>}
        {version.id && version.effectiveFrom > today() && <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          <Info size={14} /> {t("tax.upcoming")}
        </span>}
        {selected != "new" && <Button className="bg-white text-black border" onPress={startNewVersion}>
          <Plus size={16} /> {t("tax.newVersion")}
        </Button>}
        {selected == "new" && versions.length > 0 && <Button className="bg-white text-black border" onPress={() => setSelected(currentId ?? versions[0].id)}>
          {t("common.cancel")}
        </Button>}
        {version.id && <button
          type="button"
          aria-label={t("tax.deleteVersion")}
          title={t("tax.deleteVersion")}
          onClick={() => dispatch(openModal({
            title: t("tax.deleteVersion"),
            size: "sm",
            modalComponent: "DELETE_TAX_VERSION",
            modalProps: { rowId: version.id, label: formatDate(version.effectiveFrom) }
          }))}
          className="grid place-items-center size-10 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
        >
          <Trash2 size={17} />
        </button>}
      </div>
    </div>

    {versions.length == 0 && <Alert status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("tax.noVersionsTitle")}</Alert.Title>
        <Alert.Description>{t("tax.noVersionsDescription")}</Alert.Description>
      </Alert.Content>
    </Alert>}
  </>;
  return <div>
    <TaxForm
      key={`${selected}-${version.updatedAt ?? ""}-${version.effectiveFrom}`}
      version={version}
      locale={locale}
      versionBar={versionBar}
      onSaved={(saved) => { setDraft(null); setSelected(saved.id); }}
    />
  </div>
}
const TextInput = ({ control, name, label, placeholder }: { control: Control<TaxSchemaType>; name: "reference"; label: string; placeholder?: string }) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState }) => (
      <TextField {...field} value={field.value ?? ""} isInvalid={fieldState.invalid} fullWidth>
        <Label>{label}</Label>
        <Input placeholder={placeholder} />
        <FieldError>{fieldState.error?.message}</FieldError>
      </TextField>
    )}
  />
);
type TaxFormProps = {
  version: TaxVersion;
  locale: string;
  versionBar: ReactNode;
  onSaved: (saved: TaxVersion) => void;
}
const TaxForm = ({ version, locale, versionBar, onSaved }: TaxFormProps) => {
  const { t } = useTranslation();
  const { mutate, isPending: isSaving } = useSaveTaxVersion();
  const { control, handleSubmit, formState: { isDirty } } = useForm<TaxSchemaType>({
    resolver: zodResolver(TaxSchema),
    mode: "onSubmit",
    defaultValues: toForm(version)
  });
  const editorControl = control as unknown as Control<any>;
  const values = useWatch({ control }) as TaxSchemaType;
  const srd = (value: number) => `SRD ${value.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
  const monthly = (value?: number) => typeof value == "number" && !isNaN(value) ? `≈ ${srd(value / 12)} ${t("tax.perMonthShort")}` : undefined;
  return <form
    id="TAX_FORM"
    onSubmit={handleSubmit((form) => mutate({ id: version.id, payload: toPayload(form) }, { onSuccess: onSaved }))}
    noValidate
    className="flex flex-col gap-4 sm:gap-5"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{t("tax.title")}</h1>
        <p className="text-sm text-gray-500">{t("tax.subtitle")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden sm:inline text-sm text-gray-500">
          {isDirty || !version.id ? t("tax.unsavedChanges") : version.updatedAt ? t("company.lastUpdated", { date: dayjs(version.updatedAt).format("LLL") }) : ""}
        </span>
        <Button type="submit" isPending={isSaving}>
          {isSaving ? t("common.loading") + "..." : version.id ? t("common.save") : t("tax.saveVersion")}
        </Button>
      </div>
    </div>

    {versionBar}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">

      <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5 min-w-0">

        <Section title={t("tax.general")} description={t("tax.generalHint")} icon={CalendarClock}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="effectiveFrom"
              control={control}
              render={({ field, fieldState }) => <div>
                <DatePicker value={field.value} onChange={field.onChange} label={t("tax.effectiveFrom")} />
                {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
              </div>}
            />
            <TextInput control={control} name="reference" label={t("tax.reference")} placeholder="S.B. 2024 no. 2" />
          </div>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => <TextArea {...field} value={field.value ?? ""} fullWidth aria-label={t("tax.notes")} className="h-20" placeholder={t("tax.notesPlaceholder")} />}
          />
        </Section>

        <Section title={t("tax.wageTax")} description={t("tax.wageTaxHint")} icon={Landmark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput control={control} name="wageTax.taxFreeAllowance" label={t("tax.taxFreeAllowance")} description={monthly(values?.wageTax?.taxFreeAllowance)} isRequired />
            <NumberInput control={control} name="wageTax.taxCredit" label={t("tax.taxCredit")} description={t("tax.taxCreditHint")} />
            <NumberInput control={control} name="wageTax.deductibleCostsRate" label={t("tax.deductibleCostsRate")} isRequired />
            <NumberInput control={control} name="wageTax.deductibleCostsMax" label={t("tax.deductibleCostsMax")} description={monthly(values?.wageTax?.deductibleCostsMax)} isRequired />
            <NumberInput control={control} name="wageTax.medicalAddition" label={t("tax.medicalAddition")} description={t("tax.medicalAdditionHint")} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-900">{t("tax.brackets")}</p>
            <p className="mb-3 text-xs text-gray-500">{t("tax.wageBracketsHint")}</p>
            <BracketsEditor control={editorControl} name="wageTax.brackets" period="yearly" locale={locale} />
          </div>
        </Section>

        <Section title={t("tax.overtimeTax")} description={t("tax.overtimeTaxHint")} icon={Timer}>
            <BracketsEditor control={editorControl} name="overtimeTax.brackets" period="monthly" locale={locale} />
          </Section>

          <Section title={t("tax.specialPayments")} description={t("tax.specialPaymentsHint")} icon={Gift}>
            <BracketsEditor control={editorControl} name="specialPayments.brackets" period="yearly" locale={locale} />
          </Section>

        <Section title={t("tax.exemptions")} description={t("tax.exemptionsHint")} icon={ShieldCheck}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput control={control} name="exemptions.holidayAllowance" label={t("tax.holidayAllowance")} description={t("tax.perYear")} />
            <NumberInput control={control} name="exemptions.bonus" label={t("tax.bonus")} description={t("tax.perYear")} />
            <NumberInput control={control} name="exemptions.childAllowancePerChild" label={t("tax.childAllowancePerChild")} description={t("tax.perMonth")} />
            <NumberInput control={control} name="exemptions.childAllowanceMax" label={t("tax.childAllowanceMax")} description={t("tax.perMonth")} />
          </div>
        </Section>

        <Section title={t("tax.premiums")} description={t("tax.premiumsHint")} icon={HeartPulse}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput control={control} name="aov.rate" label={t("tax.aovRate")} description={t("tax.aovHint")} isRequired />
            <NumberInput control={control} name="aov.maxAge" label={t("tax.aovMaxAge")} description={t("tax.aovMaxAgeHint")} />
            <NumberInput control={control} name="pension.rate" label={t("tax.pensionRate")} description={t("tax.pensionHint")} />
            <NumberInput control={control} name="pension.employerShare" label={t("tax.employerShare")} description={t("tax.employerShareHint")} />
          </div>
          <div className="border-t border-gray-200 pt-4">
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <p className="text-sm font-medium text-gray-900">{t("tax.healthInsurance")}</p>
                <p className="text-xs text-gray-500">{t("tax.healthInsuranceHint")}</p>
              </div>
              <NumberInput control={control} name="healthInsurance.employerShare" label={t("tax.employerShare")} />
            </div>
            <HealthBandsEditor control={editorControl} name="healthInsurance.bands" />
          </div>
        </Section>

        <p className="flex gap-2 text-xs text-gray-500">
          <Info size={14} className="shrink-0 mt-0.5" /> {t("tax.sourceNote")}
        </p>
      </div>

      <div className="lg:sticky lg:top-0 min-w-0">
        <TaxCalculator settings={toPayload(values)} locale={locale} />
      </div>
    </div>
  </form>
}
export default Tax;
