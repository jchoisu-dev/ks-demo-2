import { useState } from 'react';
import { useGetEmployeeAttendance, useDeleteAttendance, useUpdateAttendance } from '../hooks';
import { useAppSelector } from '@/app/store';
import { Trash2, Clock, Pencil, Check, X } from 'lucide-react';
import "../pages/timesheet.css";
import { useTranslation } from "react-i18next";
import type { AttendanceType, EmployeeAttendanceEntry } from '../attendance.types';
const TIMED_TYPES: AttendanceType[] = ["present", "overtime"];
const OTHER_TYPES: AttendanceType[] = ["absent", "leave", "sick"];
type Draft = {
    type: AttendanceType;
    begin: string;
    end: string;
    totalBreakMinutes: number;
    billable: boolean;
}
const toDraft = (entry: EmployeeAttendanceEntry): Draft => ({
    type: entry.type,
    begin: entry.begin || "08:00",
    end: entry.end || "17:00",
    totalBreakMinutes: entry.totalBreakMinutes || 0,
    billable: entry.billable
});
const EmployeeAttendance = () => {
    const { modalProps } = useAppSelector((state) => state.modal);
    const { t } = useTranslation();
    const employeeId = modalProps?.employeeId;
    const date = modalProps?.date;
    const { data, isPending } = useGetEmployeeAttendance(employeeId, date);
    const { mutate: remove } = useDeleteAttendance();
    const { mutate: update, isPending: isSaving } = useUpdateAttendance();
    const [editing, setEditing] = useState<string | null>(null);
    const [draft, setDraft] = useState<Draft | null>(null);
    if (isPending || !data || data.length == 0) return <></>;
    const fieldClass = "rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-2 focus:outline-[#a46023]";
    const startEdit = (entry: EmployeeAttendanceEntry) => {
        setEditing(entry.id);
        setDraft(toDraft(entry));
    };
    const cancel = () => {
        setEditing(null);
        setDraft(null);
    };
    const save = (entry: EmployeeAttendanceEntry) => {
        if (!draft) return;
        const timed = TIMED_TYPES.includes(draft.type);
        update(
            timed
                ? { id: entry.id, type: draft.type, begin: draft.begin, end: draft.end, totalBreakMinutes: Number(draft.totalBreakMinutes) || 0 }
                : { id: entry.id, type: draft.type, billable: draft.billable },
            { onSuccess: cancel }
        );
    };
    return <ul className="mb-4 flex flex-col gap-2" aria-label={t('attendance.time')}>
        {data.map((entry) => {
            const isEditing = editing == entry.id && draft;
            const typeOptions = TIMED_TYPES.includes(entry.type) ? TIMED_TYPES : OTHER_TYPES;
            return <li
                key={entry.id}
                className={`ts-status-${isEditing ? draft.type : entry.type} flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5`}
            >
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: "var(--ts-bar)" }} />

                {isEditing ? <div className="flex flex-1 min-w-0 flex-wrap items-center gap-2">
                    <select
                        aria-label={t('attendance.attendanceType')}
                        className={fieldClass + " cursor-pointer"}
                        value={draft.type}
                        onChange={(e) => setDraft({ ...draft, type: e.target.value as AttendanceType })}
                    >
                        {typeOptions.map(type => <option key={type} value={type}>{t(`attendanceTypes.${type}`)}</option>)}
                    </select>
                    {TIMED_TYPES.includes(draft.type) ? <>
                        <input type="time" aria-label={t('attendance.begin')} className={fieldClass} value={draft.begin} onChange={(e) => setDraft({ ...draft, begin: e.target.value })} />
                        <span className="text-gray-500">–</span>
                        <input type="time" aria-label={t('attendance.end')} className={fieldClass} value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                        <label className="flex items-center gap-1.5 text-xs text-gray-600">
                            {t('attendance.breakMinutes')}
                            <input type="number" min={0} step={5} className={fieldClass + " w-20"} value={draft.totalBreakMinutes} onChange={(e) => setDraft({ ...draft, totalBreakMinutes: Math.max(0, Number(e.target.value) || 0) })} />
                        </label>
                    </> : <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input type="checkbox" className="accent-[#a46023]" checked={draft.billable} onChange={(e) => setDraft({ ...draft, billable: e.target.checked })} />
                        {t('attendance.billable')}
                    </label>}
                </div> : <div className="flex flex-1 min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: "var(--ts-bg)", color: "var(--ts-text)" }}
                    >
                        {t(`attendanceTypes.${entry.type}`)}
                    </span>
                    {(entry.begin || entry.end) && <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900 tabular-nums">
                        <Clock size={14} className="text-gray-500" />
                        {entry.begin}–{entry.end}
                        {entry.totalBreakMinutes > 0 && <span className="text-xs font-normal text-gray-500">({t('attendance.breakShort', { minutes: entry.totalBreakMinutes })})</span>}
                    </span>}
                    <span className="text-xs text-gray-500">
                        {t('attendance.billable')}: {entry.billable ? t('common.yes') : t('common.no')}
                    </span>
                </div>}

                <div className="flex shrink-0 items-center gap-1 ml-auto">
                    {isEditing ? <>
                        <button
                            type="button"
                            aria-label={t('common.save')}
                            title={t('common.save')}
                            disabled={isSaving}
                            onClick={() => save(entry)}
                            className="grid place-items-center size-8 rounded-lg text-green-700 hover:bg-green-50 cursor-pointer disabled:opacity-50"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label={t('common.cancel')}
                            title={t('common.cancel')}
                            onClick={cancel}
                            className="grid place-items-center size-8 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </> : <>
                        <button
                            type="button"
                            aria-label={t('common.edit')}
                            title={t('common.edit')}
                            onClick={() => startEdit(entry)}
                            className="grid place-items-center size-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label={t('common.delete')}
                            title={t('common.delete')}
                            onClick={() => remove(entry.id)}
                            className="grid place-items-center size-8 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>}
                </div>
            </li>;
        })}
    </ul>
}
export default EmployeeAttendance;
