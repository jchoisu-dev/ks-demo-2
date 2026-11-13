import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import NumberInput from "./NumberInput";
type BracketsEditorProps = {
  control: Control<any>;
  name: string;
  period: "yearly" | "monthly";
  locale: string;
}
const BracketsEditor = ({ control, name, period, locale }: BracketsEditorProps) => {
  const { t } = useTranslation();
  const { fields, insert, remove } = useFieldArray({ control, name });
  const values: { upTo: number | null; rate: number }[] = useWatch({ control, name }) || [];
  const srd = (value: number) => `SRD ${value.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
  const step = period == "yearly" ? 10000 : 1000;
  const addBracket = () => {
    const beforeLast = values[values.length - 2]?.upTo ?? 0;
    insert(Math.max(fields.length - 1, 0), { upTo: beforeLast + step, rate: values[values.length - 1]?.rate ?? 0 });
  };
  return <div className="flex flex-col gap-2">
    <div className="grid grid-cols-[5.25rem_1fr_4.25rem_2rem] sm:grid-cols-[1fr_1.2fr_5.5rem_2.25rem] gap-2 sm:gap-3 px-1 text-xs font-medium uppercase tracking-wide text-gray-500">
      <span>{t("tax.from")}</span>
      <span>{t("tax.upTo")} ({period == "yearly" ? t("tax.perYear") : t("tax.perMonth")})</span>
      <span>{t("tax.rate")}</span>
      <span />
    </div>

    {fields.map((field, index) => {
      const isLast = index == fields.length - 1;
      const from = index == 0 ? 0 : (values[index - 1]?.upTo ?? 0);
      const upTo = values[index]?.upTo;
      return <div key={field.id} className="grid grid-cols-[5.25rem_1fr_4.25rem_2rem] sm:grid-cols-[1fr_1.2fr_5.5rem_2.25rem] items-start gap-2 sm:gap-3 rounded-xl bg-gray-50/70 p-2 [&>*]:min-w-0">
        <span className="pt-2 text-xs sm:text-sm text-gray-600 tabular-nums whitespace-nowrap">{srd(from)}</span>

        {isLast
          ? <span className="pt-2 text-xs sm:text-sm text-gray-500">{t("tax.noUpperLimit")}</span>
          : <div className="min-w-0">
            <NumberInput control={control} name={`${name}.${index}.upTo`} ariaLabel={t("tax.upTo")} />
            {period == "yearly" && typeof upTo == "number" && !isNaN(upTo) && <p className="mt-1 text-[11px] text-gray-500">≈ {srd(upTo / 12)} {t("tax.perMonthShort")}</p>}
          </div>}

        <NumberInput control={control} name={`${name}.${index}.rate`} ariaLabel={t("tax.rate")} />

        <button
          type="button"
          aria-label={t("tax.removeBracket")}
          title={t("tax.removeBracket")}
          disabled={isLast || fields.length <= 1}
          onClick={() => remove(index)}
          className="mt-1 grid place-items-center size-8 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
        >
          <Trash2 size={16} />
        </button>
      </div>
    })}

    <button
      type="button"
      onClick={addBracket}
      className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
    >
      <Plus size={15} /> {t("tax.addBracket")}
    </button>
  </div>
}
export default BracketsEditor;
