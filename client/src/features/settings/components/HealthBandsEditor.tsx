import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import NumberInput from "./NumberInput";
const HealthBandsEditor = ({ control, name }: { control: Control<any>; name: string }) => {
  const { t } = useTranslation();
  const { fields, insert, remove } = useFieldArray({ control, name });
  const values: { fromAge: number; toAge: number | null; monthly: number }[] = useWatch({ control, name }) || [];
  const addBand = () => {
    const beforeLast = values[values.length - 2]?.toAge ?? -1;
    insert(Math.max(fields.length - 1, 0), { fromAge: beforeLast + 1, toAge: beforeLast + 5, monthly: values[values.length - 1]?.monthly ?? 0 });
  };
  return <div className="flex flex-col gap-2">
    <div className="grid grid-cols-[3rem_1fr_1.2fr_2rem] sm:grid-cols-[4.5rem_1fr_1.2fr_2.25rem] gap-2 sm:gap-3 px-1 text-xs font-medium uppercase tracking-wide text-gray-500">
      <span>{t("tax.fromAge")}</span>
      <span>{t("tax.toAge")}</span>
      <span>{t("tax.monthlyPremium")}</span>
      <span />
    </div>

    {fields.map((field, index) => {
      const isLast = index == fields.length - 1;
      const fromAge = index == 0 ? 0 : (Number(values[index - 1]?.toAge) || 0) + 1;
      return <div key={field.id} className="grid grid-cols-[3rem_1fr_1.2fr_2rem] sm:grid-cols-[4.5rem_1fr_1.2fr_2.25rem] items-start gap-2 sm:gap-3 rounded-xl bg-gray-50/70 p-2 [&>*]:min-w-0">
        <span className="pt-2 text-sm text-gray-600 tabular-nums">{fromAge}</span>
        {isLast
          ? <span className="pt-2 text-sm text-gray-500">{t("tax.andOlder")}</span>
          : <NumberInput control={control} name={`${name}.${index}.toAge`} ariaLabel={t("tax.toAge")} />}
        <NumberInput control={control} name={`${name}.${index}.monthly`} ariaLabel={t("tax.monthlyPremium")} />
        <button
          type="button"
          aria-label={t("tax.removeBand")}
          title={t("tax.removeBand")}
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
      onClick={addBand}
      className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
    >
      <Plus size={15} /> {t("tax.addBand")}
    </button>
  </div>
}
export default HealthBandsEditor;
