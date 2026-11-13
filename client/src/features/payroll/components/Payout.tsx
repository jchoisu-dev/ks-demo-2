import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Trash2, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/store';
import { Button, Spinner } from '@/shared/components/ui';
import { getLocale } from '@/app/i18n';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { usePayout, useAddPayoutLine, useDeletePayoutLine } from '../hooks/usePayout';
import type { PayoutLine, PayoutStatus } from '../payroll.types';
const CURRENCIES = ["SRD", "USD", "EUR"];
const METHODS: PayoutLine["method"][] = ["cash", "bank", "other"];
export const PAYOUT_STYLES: Record<PayoutStatus, string> = {
    unpaid: "bg-gray-100 text-gray-700",
    partial: "bg-amber-50 text-amber-800",
    paid: "bg-green-50 text-green-700",
    overpaid: "bg-red-50 text-red-700"
};
const Payout = () => {
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.resolvedLanguage);
    const { canEdit } = usePermissions();
    const { modalProps } = useAppSelector((state) => state.modal);
    const employeeId: string = modalProps?.employeeId;
    const period = modalProps?.period;
    const { data, isPending, isError } = usePayout(employeeId, period);
    const { mutate: add, isPending: isSaving } = useAddPayoutLine();
    const { mutate: remove, isPending: isRemoving } = useDeletePayoutLine();
    const [form, setForm] = useState({ payAmount: "", currency: "", method: "cash" as PayoutLine["method"], date: dayjs().format("YYYY-MM-DD"), note: "" });
    const [error, setError] = useState("");
    useEffect(() => {
        if (data) setForm(current => ({ ...current, payAmount: current.payAmount || (data.outstanding > 0 ? String(data.outstanding) : ""), currency: current.currency || data.payCurrency }));
    }, [data?.outstanding, data?.payCurrency]);
    if (isPending) return <Spinner size="sm" />;
    if (isError || !data) return <p className="text-sm text-gray-500">{t("common.somethingWentWrong")}</p>;
    const money = (currency: string, value: number) => `${currency} ${Number(value || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const date = (value: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
    const pay = data.payCurrency;
    const currency = form.currency || pay;
    const converts = currency != pay;
    const storedRate = converts ? data.rates[`${pay}_${currency}`] : 1;
    const rate = converts ? storedRate ?? 0 : 1;
    const amount = Number(form.payAmount);
    const handed = amount > 0 && rate > 0 ? Math.round(amount * rate * 100) / 100 : 0;
    const fieldClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-[#a46023]";
    const label = "block text-sm text-gray-700";
    const submit = () => {
        if (!(amount > 0)) return setError(t("payroll.payout.amountRequired"));
        if (amount > data.outstanding + 0.005) return setError(t("payroll.payout.tooMuch", { amount: money(pay, data.outstanding) }));
        if (converts && !(rate > 0)) return setError(t("payroll.payout.noRate", { from: pay, to: currency }));
        setError("");
        add({
            employeeId,
            line: {
                ...period,
                payAmount: amount,
                currency,
                method: form.method,
                date: form.date,
                note: form.note.trim()
            }
        }, { onSuccess: (payout) => setForm(current => ({ ...current, payAmount: payout.outstanding > 0 ? String(payout.outstanding) : "", note: "" })) });
    };
    const tile = (title: string, value: string, strong = false) => <div className="rounded-xl border border-gray-200 px-3 py-2.5">
        <p className="text-xs text-gray-500">{title}</p>
        <p className={"tabular-nums " + (strong ? "text-base font-semibold text-gray-900 whitespace-nowrap" : "text-base font-medium text-gray-800 whitespace-nowrap")}>{value}</p>
    </div>;
    return <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{data.employee.name}</span>
            <span>·</span>
            <span>{date(data.period.beginDay)} – {date(data.period.endDay)}</span>
            <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + PAYOUT_STYLES[data.status]}>{t(`payroll.payout.status.${data.status}`)}</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {tile(t("payroll.payout.net"), money(pay, data.net), true)}
            {tile(t("payroll.payout.paid"), money(pay, data.paid))}
            {tile(t("payroll.payout.open"), money(pay, data.outstanding), true)}
        </div>
        {!data.isCalculated && <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{t("payroll.payout.notCalculated")}</p>}

        {data.lines.length == 0
            ? <p className="rounded-xl border border-dashed border-gray-300 py-5 text-center text-sm text-gray-500">{t("payroll.payout.empty")}</p>
            : <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                {data.lines.map(line => <li key={line.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f6ebe1] text-[#a46023]"><Wallet size={15} /></span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium tabular-nums text-gray-900">
                            {money(line.currency, line.amount)}
                            {line.currency != pay && <span className="ml-1.5 text-xs font-normal text-gray-500">({money(pay, line.payAmount)} × {line.rate})</span>}
                        </p>
                        <p className="truncate text-xs text-gray-500">{date(line.date)} · {t(`payroll.payout.methods.${line.method}`)}{line.note ? ` · ${line.note}` : ""}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-gray-900 whitespace-nowrap">{money(pay, line.payAmount)}</span>
                    {canEdit && <button type="button" disabled={isRemoving} title={t("common.delete")} aria-label={t("common.delete")} className="grid size-8 place-items-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer disabled:opacity-40" onClick={() => remove({ employeeId, lineId: line.id, period })}>
                        <Trash2 size={15} />
                    </button>}
                </li>)}
            </ul>}

        {canEdit && data.outstanding > 0 && <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900">{t("payroll.payout.add")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={label}>
                    {t("payroll.payout.payAmount", { currency: pay })}
                    <span className="mt-1 flex gap-2">
                        <input type="number" min={0} step="0.01" inputMode="decimal" className={fieldClass + " min-w-0 flex-1 tabular-nums"} value={form.payAmount} onChange={(e) => setForm({ ...form, payAmount: e.target.value })} />
                        <button type="button" className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer" onClick={() => setForm({ ...form, payAmount: String(data.outstanding) })}>{t("payroll.payout.payRest")}</button>
                    </span>
                </label>
                <label className={label}>
                    {t("payroll.payout.payIn")}
                    <select className={fieldClass + " mt-1 cursor-pointer"} value={currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                        {CURRENCIES.map(code => <option key={code} value={code}>{code}</option>)}
                    </select>
                </label>
                {converts && <p className={"sm:col-span-2 rounded-xl px-3 py-2 text-xs " + (storedRate ? "bg-white border border-gray-200 text-gray-600" : "bg-amber-50 text-amber-800")}>
                    {storedRate ? t("payroll.payout.rateFromSettings", { rate: storedRate, from: pay, to: currency }) : t("payroll.payout.noRate", { from: pay, to: currency })}
                </p>}
                <label className={label}>
                    {t("payroll.payout.date")}
                    <input type="date" className={fieldClass + " mt-1"} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </label>
                <label className={label}>
                    {t("payroll.payout.method")}
                    <select className={fieldClass + " mt-1 cursor-pointer"} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PayoutLine["method"] })}>
                        {METHODS.map(method => <option key={method} value={method}>{t(`payroll.payout.methods.${method}`)}</option>)}
                    </select>
                </label>
                <label className={label + " sm:col-span-2"}>
                    {t("payroll.payout.note")}
                    <input maxLength={200} className={fieldClass + " mt-1"} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </label>
            </div>
            {amount > 0 && <p className="rounded-xl bg-[#f6ebe1] p-3 text-sm text-[#7a4719] tabular-nums">
                {converts
                    ? t("payroll.payout.handOverConverted", { handed: money(currency, handed), amount: money(pay, amount), rate: rate || "—" })
                    : t("payroll.payout.handOver", { handed: money(currency, handed) })}
            </p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end">
                <Button isPending={isSaving} onPress={submit}>{t("payroll.payout.record")}</Button>
            </div>
        </section>}
        {data.status == "paid" && <p className="flex items-center gap-2 text-sm font-medium text-green-700"><CheckCircle2 size={16} /> {t("payroll.payout.fullyPaid")}</p>}
    </div>;
};
export default Payout;
