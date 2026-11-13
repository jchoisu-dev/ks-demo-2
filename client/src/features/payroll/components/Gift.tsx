import { useEffect, useState } from 'react';
import { Pagination } from '@heroui/react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Trash2, Lock, Plus, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/store';
import { Button, Spinner } from '@/shared/components/ui';
import { formatMonth, getLocale } from '@/app/i18n';
import { useGetAdjustment, useCreateAdjustment, useDeleteAdjustment } from '../hooks';
import { useExchangeRates } from '@/features/settings/hooks';
import type { AdjustmentItem } from '../payroll.types';
type AdjustmentType = AdjustmentItem["type"];
const TYPE_STYLES: Record<AdjustmentType, { icon: typeof TrendingUp; badge: string; amount: string }> = {
    bonus: { icon: TrendingUp, badge: "bg-green-50 text-green-700", amount: "text-green-700" },
    deduction: { icon: TrendingDown, badge: "bg-red-50 text-red-700", amount: "text-red-700" }
};
const defaultDate = (month: string) => {
    const today = dayjs();
    return today.format("YYYY-MM") == month ? today.format("YYYY-MM-DD") : `${month}-01`;
};
const EmployeeGift = () => {
    const { modalProps } = useAppSelector((state) => state.modal);
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.resolvedLanguage);
    const employeeId: string = modalProps?.employeeId;
    const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
    const [page, setPage] = useState(1);
    const { data, isPending, isPlaceholderData } = useGetAdjustment({ employeeId, month, page });
    const { mutate: create, isPending: isSaving } = useCreateAdjustment();
    const { mutate: remove, isPending: isRemoving, variables: removing } = useDeleteAdjustment();
    const [form, setForm] = useState({ type: "bonus" as AdjustmentType, amount: "", currency: "", scope: "date" as "date" | "month", date: defaultDate(month), reason: "" });
    const { data: exchange } = useExchangeRates();
    const [submitted, setSubmitted] = useState(false);
    useEffect(() => {
        if (data?.meta && data.meta.page != page) setPage(data.meta.page);
    }, [data?.meta?.page]);
    if (isPending || !data) return <Spinner size="sm" />;
    const meta = data.meta;
    const first = (meta.page - 1) * meta.limit + 1;
    const last = Math.min(meta.page * meta.limit, meta.totalRecords);
    const pageNumbers = Array.from({ length: meta.totalPages }, (_, index) => index + 1).filter(p => Math.abs(p - meta.page) <= 2);
    const currency = data.employee.currency;
    const money = (value: number, code: string = currency) => `${code} ${Number(value || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const entryCurrency = form.currency || currency;
    const needsRate = entryCurrency != currency;
    const rate = needsRate ? exchange?.rates?.[`${entryCurrency}_${currency}` as keyof typeof exchange.rates] ?? null : 1;
    const date = (value: string) => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
    const changeMonth = (step: number) => {
        const next = dayjs(`${month}-01`).add(step, "month").format("YYYY-MM");
        setMonth(next);
        setPage(1);
        setForm(current => ({ ...current, date: defaultDate(next) }));
        setSubmitted(false);
    };
    const amount = Number(form.amount);
    const errors = {
        amount: !form.amount || !Number.isFinite(amount) || amount <= 0 ? t("payroll.adjustments.amountRequired") : needsRate && !rate ? t("payroll.adjustments.noRate", { from: entryCurrency, to: currency }) : "",
        date: form.scope == "date" && (!form.date || !form.date.startsWith(month)) ? t("payroll.adjustments.dateInMonth", { month: formatMonth(month, locale) }) : ""
    };
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        if (errors.amount || errors.date) return;
        create(
            { employeeId, type: form.type, amount, currency: entryCurrency, scope: form.scope, month, date: form.scope == "month" ? `${month}-01` : form.date, reason: form.reason.trim() },
            {
                onSuccess: () => {
                    setForm(current => ({ ...current, amount: "", reason: "" }));
                    setSubmitted(false);
                }
            }
        );
    };
    const initials = data.employee.name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("");
    const fieldClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-[#a46023]";
    const lastDay = dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD");
    return <div className={"flex flex-col gap-4 transition-opacity " + (isPlaceholderData ? "opacity-60" : "")}>

        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <span aria-hidden="true" className="grid place-items-center size-10 shrink-0 rounded-full bg-[#f6ebe1] text-sm font-semibold uppercase text-[#7a4719]">{initials}</span>
                <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{data.employee.name}</p>
                    <p className="text-xs text-gray-500">{t("payroll.adjustments.paidIn", { currency })}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1">
                <button type="button" aria-label={t("payroll.adjustments.previousMonth")} onClick={() => changeMonth(-1)} className="grid place-items-center size-8 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer">
                    <ChevronLeft size={16} />
                </button>
                <span className="min-w-32 text-center text-sm font-medium text-gray-900 capitalize">{formatMonth(month, locale)}</span>
                <button type="button" aria-label={t("payroll.adjustments.nextMonth")} onClick={() => changeMonth(1)} className="grid place-items-center size-8 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {([
                ["bonus", TrendingUp, "text-green-700 bg-green-50", data.totals.bonus, "+"],
                ["deduction", TrendingDown, "text-red-700 bg-red-50", data.totals.deduction, "−"],
                ["net", Scale, "text-[#7a4719] bg-[#f6ebe1]", data.totals.net, data.totals.net > 0 ? "+" : data.totals.net < 0 ? "−" : ""]
            ] as const).map(([key, Icon, tone, value, sign]) => (
                <div key={key} className="flex sm:block items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:p-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={"grid place-items-center size-7 shrink-0 rounded-lg " + tone}><Icon size={14} /></span>
                        <span className="text-xs text-gray-500">{t(`payroll.adjustments.total.${key}`)}</span>
                    </div>
                    <p className="sm:mt-2 text-sm sm:text-base font-semibold tabular-nums text-gray-900 whitespace-nowrap">{sign}{money(Math.abs(value))}</p>
                </div>
            ))}
        </div>

        <div className="flex flex-col gap-4">
            <section className="min-w-0" aria-label={t("payroll.adjustments.listTitle")}>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">{t("payroll.adjustments.listTitle")}</h3>
                {data.items.length == 0
                    ? <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">{t("payroll.adjustments.empty", { month: formatMonth(month, locale) })}</div>
                    : <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                        {data.items.map(item => {
                            const style = TYPE_STYLES[item.type];
                            const Icon = style.icon;
                            return <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                                <span className={"grid place-items-center size-8 shrink-0 rounded-full " + style.badge}><Icon size={15} /></span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate" title={item.reason}>{item.reason || t(`payroll.adjustmentTypes.${item.type}`)}</p>
                                    <p className="text-xs text-gray-500">{t(`payroll.adjustmentTypes.${item.type}`)} · {item.scope == "month" ? t("payroll.adjustments.wholeMonth") : date(item.date)}</p>
                                </div>
                                <span className="flex flex-col items-end">
                                    <span className={"text-sm font-semibold tabular-nums whitespace-nowrap " + style.amount}>{item.type == "bonus" ? "+" : "−"}{money(item.amount)}</span>
                                    {item.converted && <span className="text-[11px] tabular-nums text-gray-500 whitespace-nowrap">{money(item.originalAmount, item.currency)} × {item.exchangeRate}</span>}
                                </span>
                                {!data.closed && <button
                                    type="button"
                                    aria-label={t("payroll.adjustments.delete")}
                                    title={t("payroll.adjustments.delete")}
                                    disabled={isRemoving && removing?.adjustmentId == item.id}
                                    onClick={() => remove({ adjustmentId: item.id })}
                                    className="grid place-items-center size-8 shrink-0 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer disabled:opacity-40"
                                >
                                    <Trash2 size={15} />
                                </button>}
                            </li>;
                        })}
                    </ul>}
                {meta.totalPages > 1 && <div className="mt-3">
                    <Pagination size="sm">
                        <Pagination.Summary>
                            {t("common.paginationSummary", { start: first, end: last, total: meta.totalRecords })}
                        </Pagination.Summary>
                        <Pagination.Content className="flex-wrap">
                            {meta.hasPreviousPage && <Pagination.Item>
                                <Pagination.Previous onPress={() => setPage(Math.max(1, meta.page - 1))}>
                                    <Pagination.PreviousIcon />
                                    {t("common.prev")}
                                </Pagination.Previous>
                            </Pagination.Item>}
                            {pageNumbers.map(p => (
                                <Pagination.Item key={p}>
                                    <Pagination.Link isActive={p == meta.page} onPress={() => setPage(p)}>{p}</Pagination.Link>
                                </Pagination.Item>
                            ))}
                            {meta.hasNextPage && <Pagination.Item>
                                <Pagination.Next onPress={() => setPage(meta.page + 1)}>
                                    {t("common.next")}
                                    <Pagination.NextIcon />
                                </Pagination.Next>
                            </Pagination.Item>}
                        </Pagination.Content>
                    </Pagination>
                </div>}
            </section>

            <section aria-label={t("payroll.adjustments.addTitle")}>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">{t("payroll.adjustments.addTitle")}</h3>
                {data.closed
                    ? <p className="flex items-start gap-2 rounded-xl border border-green-100 bg-green-50/60 p-3 text-sm text-gray-700">
                        <Lock size={16} className="mt-0.5 shrink-0 text-green-700" />
                        {t("payroll.adjustments.closed")}
                    </p>
                    : <form noValidate onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                        <div role="radiogroup" aria-label={t("payroll.type")} className="sm:col-span-2 grid grid-cols-2 gap-1 rounded-xl bg-white p-1 border border-gray-200">
                            {(["bonus", "deduction"] as const).map(type => {
                                const selected = form.type == type;
                                return <button
                                    key={type}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setForm({ ...form, type })}
                                    className={"rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer " + (selected ? (type == "bonus" ? "bg-green-600 text-white" : "bg-red-600 text-white") : "text-gray-600 hover:bg-gray-50")}
                                >
                                    {t(`payroll.adjustmentTypes.${type}`)}
                                </button>;
                            })}
                        </div>
                        <label className="block text-sm text-gray-700">
                            {t("payroll.amount")}
                            <span className="mt-1 flex gap-2">
                                <select
                                    aria-label={t("payroll.adjustments.currency")}
                                    className={fieldClass.replace("w-full ", "") + " w-24 shrink-0 cursor-pointer"}
                                    value={entryCurrency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                >
                                    {["SRD", "USD", "EUR"].map(code => <option key={code} value={code}>{code}</option>)}
                                </select>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step="0.01"
                                    className={fieldClass + " min-w-0 flex-1 tabular-nums" + (submitted && errors.amount ? " border-red-400" : "")}
                                    value={form.amount}
                                    placeholder="0.00"
                                    aria-invalid={Boolean(submitted && errors.amount)}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                />
                            </span>
                            {needsRate && (rate
                                ? <span className="mt-1 block text-xs text-gray-600 tabular-nums">{t("payroll.adjustments.converted", { amount: money(amount > 0 ? amount * rate : 0), rate, from: entryCurrency, to: currency })}</span>
                                : <span className="mt-1 block text-xs text-amber-700">{t("payroll.adjustments.noRate", { from: entryCurrency, to: currency })}</span>)}
                            {submitted && errors.amount && !(needsRate && !rate) && <span className="mt-1 block text-xs text-red-600">{errors.amount}</span>}
                        </label>
                        <div className="block text-sm text-gray-700">
                            <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                <span className="whitespace-nowrap">{t("payroll.adjustments.appliesTo")}</span>
                                <span className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs" role="tablist" aria-label={t("payroll.adjustments.appliesTo")}>
                                    {(["date", "month"] as const).map(scope => <button
                                        key={scope}
                                        type="button"
                                        role="tab"
                                        aria-selected={form.scope == scope}
                                        onClick={() => setForm({ ...form, scope })}
                                        className={"whitespace-nowrap rounded-md px-2 py-0.5 font-medium transition-colors cursor-pointer " + (form.scope == scope ? "bg-[#a46023] text-white" : "text-gray-600 hover:bg-gray-50")}
                                    >
                                        {t(scope == "date" ? "payroll.adjustments.specificDate" : "payroll.adjustments.wholeMonth")}
                                    </button>)}
                                </span>
                            </span>
                            {form.scope == "date"
                                ? <input
                                    type="date"
                                    aria-label={t("payroll.date")}
                                    min={`${month}-01`}
                                    max={lastDay}
                                    className={fieldClass + " mt-1" + (submitted && errors.date ? " border-red-400" : "")}
                                    value={form.date}
                                    aria-invalid={Boolean(submitted && errors.date)}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                />
                                : <span className={fieldClass + " mt-1 block bg-gray-50 text-gray-700"}>{formatMonth(month, locale)}</span>}
                            {submitted && errors.date && form.scope == "date" && <span className="mt-1 block text-xs text-red-600">{errors.date}</span>}
                        </div>
                        <label className="sm:col-span-2 block text-sm text-gray-700">
                            {t("payroll.adjustments.reason")}
                            <input
                                type="text"
                                maxLength={200}
                                className={fieldClass + " mt-1"}
                                value={form.reason}
                                placeholder={t(form.type == "bonus" ? "payroll.adjustments.reasonBonus" : "payroll.adjustments.reasonDeduction")}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            />
                        </label>
                        <Button type="submit" isPending={isSaving} className="sm:col-span-2 w-full">
                            <Plus size={16} /> {isSaving ? t("common.loading") + "..." : t(form.type == "bonus" ? "payroll.adjustments.addBonus" : "payroll.adjustments.addDeduction")}
                        </Button>
                    </form>}
            </section>
        </div>
    </div>;
};
export default EmployeeGift;
