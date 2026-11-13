import { useState } from 'react';
import CalendarDaySelect from '../components/CalendarDaySelect';
import PeriodBar from '../components/PeriodBar';
import PayrollActions from '../components/PayrollActions';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { useGetOverview } from '../hooks';
import Table from '@/shared/components/table';
import { Button } from '@/shared/components/ui';
import { useGeneratePDF, useExportPayroll } from '../hooks';
import type { DateValue } from "@internationalized/date";
import { openModal } from "@/app/store";
import { useAppDispatch } from "@/app/store";
import { useTranslation } from "react-i18next";
import { RotateCcw, FileSpreadsheet, Wallet } from "lucide-react";
import { PAYOUT_STYLES } from '../components/Payout';
import { translateLabel } from "@/app/i18n";
const Overview = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { canEdit } = usePermissions();
    const [page, setPage] = useState(1);
    const [beginDay, setCalendarDayBegin] = useState<DateValue | null>(null);
    const [endDay, setCalendarDayEnd] = useState<DateValue | null>(null);
    const { isLoading, data } = useGetOverview({ page, beginDay, endDay });
    const { mutateAsync: onPrint } = useGeneratePDF({ beginDay, endDay });
    const { mutate: onExport, isPending: isExporting } = useExportPayroll();
    const hasPeriod = Boolean(beginDay) == Boolean(endDay);
    const onGift = ({ employeeId }: { employeeId: string }) => {
        dispatch(
            openModal({
                title: t('payroll.adjustmentTitle'),
                size: 'lg',
                modalComponent: "EMPLOYEE_PAYROLL_GIFT",
                modalProps: { employeeId },
                hideFooter: true
            })
        )
    }
    const columns = [
        { id: 'id', name: 'ID', hidden: true },
        { id: "employee", name: t("payroll.employee") },
        { id: "type", name: t("payroll.type") },
        { id: "pay_type", name: t("payroll.payType") },
        { id: 'currency', name: t('payroll.currency') },
        { id: 'amount', name: t('payroll.rate') },
        { id: "total_working_days", name: t("payroll.weekdays") },
        { id: "total_regular_hours", name: t("payroll.weekdayHours") },
        { id: "total_overtime_hours", name: t("payroll.overtimeHours") },
        { id: 'payout', name: t('payroll.payout.column') },
        { id: 'print', name: t('payroll.print') },
        { id: 'adjust', name: t('payroll.bonus'), hidden: !canEdit }
    ];
    if (isLoading) return <></>;
    return <div className='flex flex-col gap-3'>

        <div className='flex items-center gap-2'>
            <CalendarDaySelect label={t('payroll.begin')} value={beginDay} setCalendarDay={setCalendarDayBegin} />
            <CalendarDaySelect label={t('payroll.end')} value={endDay} setCalendarDay={setCalendarDayEnd} />
            <Button
                aria-label={t('common.reset')}
                className="bg-[#a46023] text-white shrink-0 min-w-0 px-3 sm:px-4"
                onPress={() => {
                    setPage(1);
                    setCalendarDayBegin(null);
                    setCalendarDayEnd(null);
                }}
            >
                <RotateCcw className="sm:hidden" size={16} />
                <span className="hidden sm:inline">{t('common.reset')}</span>
            </Button>
            <Button
                aria-label={t('payroll.export')}
                className="bg-white text-black border shrink-0 min-w-0 px-3 sm:px-4 sm:ml-auto"
                isDisabled={!hasPeriod || isExporting}
                onPress={() => onExport({ beginDay, endDay })}
            >
                <FileSpreadsheet size={16} />
                <span className="hidden sm:inline">{isExporting ? t('payroll.exporting') : t('payroll.export')}</span>
            </Button>
            {canEdit && <PayrollActions beginDay={beginDay} endDay={endDay} isDisabled={!hasPeriod} />}
        </div>

        <PeriodBar beginDay={beginDay} endDay={endDay} />

        <Table
            columns={columns}
            rows={(data?.data || []).map((row: any) => ({
                ...row,
                type: translateLabel('employeeTypes', row.type),
                pay_type: translateLabel('payTypes', row.pay_type)
            }))}
            onPrint={onPrint}
            onGift={onGift}
            renderCell={(row: any, columnId: string) => {
                if (columnId == "payout") {
                    if (!row.payout) return <span className="text-gray-400">—</span>;
                    const money = (value: number) => `${row.payout.currency} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    return <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-gray-50 cursor-pointer"
                        title={t('payroll.payout.openList')}
                        onClick={() => dispatch(openModal({
                            title: t('payroll.payout.title'),
                            size: 'lg',
                            modalComponent: "PAYROLL_PAYOUT",
                            modalProps: { employeeId: row.id, period: data?.period },
                            hideFooter: true
                        }))}
                    >
                        <Wallet size={16} className="shrink-0 text-[#a46023]" />
                        <span className="flex flex-col">
                            <span className={"w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold " + PAYOUT_STYLES[row.payout.status as keyof typeof PAYOUT_STYLES]}>{t(`payroll.payout.status.${row.payout.status}`)}</span>
                            <span className="text-[11px] tabular-nums text-gray-500">{money(row.payout.paid)} / {money(row.payout.net)}</span>
                        </span>
                    </button>;
                }
                if (columnId != "total_working_days" || !row.workdays) return undefined;
                const { workedDays, scheduledDays, missedDays, complete, absent, sick, leave } = row.workdays;
                const details = [
                    absent ? t('payroll.monthly.absent', { count: absent }) : "",
                    sick ? t('payroll.monthly.sick', { count: sick }) : "",
                    leave ? t('payroll.monthly.leave', { count: leave }) : ""
                ].filter(Boolean).join(" · ");
                return <span className="flex flex-wrap items-center gap-1.5" title={details || undefined}>
                    <span className="tabular-nums font-medium text-gray-900">{workedDays} / {scheduledDays}</span>
                    {complete && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">{t('payroll.monthly.complete')}</span>}
                    {missedDays > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{t('payroll.monthly.missed', { count: missedDays })}</span>}
                </span>;
            }}
            pagination={{
                page: data?.meta?.page || 1,
                limit: data?.meta?.limit || 15,
                totalRecords: data?.meta?.totalRecords || 0,
                totalPages: data?.meta?.totalPages || 0,
                hasNextPage: data?.meta?.hasNextPage || false,
                hasPreviousPage: data?.meta?.hasPreviousPage || false,
                onPageChange: setPage
            }}
        />

    </div>
}
export default Overview;