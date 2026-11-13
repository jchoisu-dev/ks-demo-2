import './timesheet.css'
import { useState } from "react";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useGetAttendances } from '../hooks';
import type { Employee, Weekday } from '../attendance.types';
import WeekPicker from '../components/WeekPicker';
import { openModal } from "@/app/store";
import { useAppDispatch } from "@/app/store";
import renderAttendanceInfo from '../components/AttendanceInfo';
import { useTranslation } from 'react-i18next';
import { Spinner } from "@/shared/components/ui";
import { getLocale } from "@/app/i18n";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
const LEGEND = ["present", "overtime", "absent", "leave", "sick", "holiday"];
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("");
const Timesheet = () => {
  const [calendarWeek, setCalendarWeek] = useState('');
  const dispatch = useAppDispatch();
  const { canEdit } = usePermissions();
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const { isPending, isPlaceholderData, data } = useGetAttendances(calendarWeek);
  const weekdays = data?.weekdays || [];
  const employees = data?.employees || [];
  const employeeTotalWorkedHours = data?.employeeTotalWorkedHours || {};
  const employeetotalOvertimeMinutes = data?.employeetotalOvertimeMinutes || {};
  if (isPending) return <Spinner />;
  const todayKey = dayjs().format("YYYY-MM-DD");
  const format = (key: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(new Date(`${key}T12:00:00`));
  const weekRange = weekdays.length
    ? `${format(weekdays[0].key, { day: "numeric", month: "short" })} – ${format(weekdays[weekdays.length - 1].key, { day: "numeric", month: "short", year: "numeric" })}`
    : "";
  const isWeekend = (key: string) => [0, 6].includes(new Date(`${key}T12:00:00`).getDay());
  const hours = (value?: number | string) => value ? `${value}h` : "—";
  return <div className="flex flex-col gap-4 sm:gap-5">

    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{t('navigation.timesheet')}</h1>
        <p className="text-sm text-gray-500">{weekRange}</p>
      </div>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-label={t('attendance.attendanceType')}>
        {LEGEND.map(status => (
          <li key={status} className={`ts-status-${status} flex items-center gap-1.5 text-xs text-gray-600`}>
            <span className="size-2.5 rounded-full" style={{ background: "var(--ts-bar)" }} />
            {t(`attendanceTypes.${status}`)}
          </li>
        ))}
      </ul>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
      <WeekPicker setCalendarWeek={setCalendarWeek} />
    </div>

    <div className={"rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-opacity " + (isPlaceholderData ? "opacity-60" : "")}>
      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th className="employee-column text-xs uppercase tracking-wide">
                {t('attendance.employee')}
              </th>

              {weekdays.map((day: Weekday) => (
                <th key={day.key} className={(day.key == todayKey ? "today" : "") + (isWeekend(day.key) ? " weekend" : "")}>
                  <span className="block text-[11px] font-medium uppercase tracking-wide">{format(day.key, { weekday: "short" })}</span>
                  <span className={"block text-lg font-semibold leading-tight " + (day.key == todayKey ? "text-[#7a4719]" : "text-gray-900")}>
                    {format(day.key, { day: "numeric" })}
                  </span>
                </th>
              ))}

              <th className="total-column text-xs uppercase tracking-wide">
                {t('attendance.hours')}
              </th>

              <th className="total-column text-xs uppercase tracking-wide">
                {t('attendance.overtime')}
              </th>
            </tr>
          </thead>

          <tbody>
            {employees.map((employee: Employee) => {
              const employeeId = employee.employeeId;
              const employeeName = employee.name;
              return <tr key={employeeId}>
                <td className="employee">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span aria-hidden="true" className="hidden sm:grid place-items-center size-8 shrink-0 rounded-full bg-[#f6ebe1] text-[#7a4719] text-[11px] font-semibold">
                      {initials(employeeName)}
                    </span>
                    <span className="truncate text-sm font-medium text-gray-900 capitalize" title={employeeName}>
                      {employeeName.toLowerCase()}
                    </span>
                  </div>
                </td>

                {weekdays.map((day: Weekday) => {
                  const date = day.key;
                  const attendance = employee.attendances?.[date];
                  const attendanceStatus = employee.attendanceStatus?.[date] || "empty";
                  return (
                    <td key={date} className={(date == todayKey ? "today" : "") + (isWeekend(date) ? " weekend" : "")}>
                      <button
                        type="button"
                        disabled={!canEdit}
                        className={`attendance-cell ts-status-${attendanceStatus} ${attendanceStatus}` + (canEdit ? "" : " cursor-default")}
                        aria-label={t('attendance.modalTitle', { name: employeeName, date })}
                        onClick={() => canEdit && dispatch(
                          openModal({
                            title: t('attendance.modalTitle', { name: employeeName, date }),
                            size: 'lg',
                            modalComponent: "CREATE_ATTENDANCE_FORM",
                            modalProps: {
                              employeeId,
                              employeeName,
                              date
                            }
                          })
                        )}
                      >
                        {attendance && attendance.length > 0 ? (
                          attendance.map((v, k) => (
                            <div key={k}>
                              {renderAttendanceInfo(v, t)}
                            </div>
                          ))
                        ) : canEdit ? <Plus size={16} className="cell-add" /> : null}
                      </button>
                    </td>
                  );
                })}

                <td className="text-center text-sm font-semibold text-gray-900 tabular-nums">
                  {hours(employeeTotalWorkedHours[employeeId])}
                </td>

                <td className={"text-center text-sm font-semibold tabular-nums " + (employeetotalOvertimeMinutes[employeeId] ? "text-[#b54708]" : "text-gray-500")}>
                  {hours(employeetotalOvertimeMinutes[employeeId])}
                </td>

              </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
}
export default Timesheet;
