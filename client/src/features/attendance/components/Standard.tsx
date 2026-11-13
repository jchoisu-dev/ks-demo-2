import { FieldError, RadioGroup, Radio, Label } from '@heroui/react';
import { useState } from 'react';
import { Controller, useForm } from "react-hook-form";
import { Shift } from '../attendance.types';
import { zodResolver } from "@hookform/resolvers/zod";
import { AttendanceStandardSchemaType, AttendanceStandardSchema } from '../attendance.schema';
import { useGetAllShifts, useCreateAttendance } from '../hooks';
import { useAppSelector } from '@/app/store';
import { useTranslation } from 'react-i18next';
import '../pages/timesheet.css';
const Standard = () => 
{
    const { modalProps } = useAppSelector((state) => state.modal);
    const { t } = useTranslation();
    const [type, setType] = useState<"work" | "overtime">("work");
    const { control, handleSubmit, setValue, formState: { errors } } = useForm<AttendanceStandardSchemaType>({
        resolver: zodResolver(AttendanceStandardSchema),
        mode: "onSubmit",
        defaultValues: {
            shiftId: ""
        }
    });
    const { mutate } = useCreateAttendance();
    const onSubmit = (data: any) => {
        mutate({
            ...modalProps,
            ...data,
            mode: 'standard'
        });
    }
    const { isPending, data } = useGetAllShifts();
    const shifts: Shift[] = data || [];
    if (isPending) return <></>;
    return <form
        id="CREATE_ATTENDANCE_FORM"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
    >
        <Controller
            name="shiftId"
            control={control}
            render={({ field: { value, onChange }, fieldState }) => {
                return <RadioGroup
                    value={value}
                    onChange={onChange}
                    isInvalid={fieldState?.invalid}
                    isRequired
                    aria-label="standard-shift"
                    className="gap-2"
                >
                    <Label>{t('attendance.selectShift')}</Label>
                    <div role="tablist" aria-label={t('shift.type')} className="flex w-fit rounded-full border border-gray-200 bg-white p-1">
                        {(["work", "overtime"] as const).map(option => <button
                            key={option}
                            type="button"
                            role="tab"
                            aria-selected={type == option}
                            onClick={() => {
                                if (option == type) return;
                                setType(option);
                                setValue("shiftId", "");
                            }}
                            className={"rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer " + (type == option ? "bg-[#a46023] text-white" : "text-gray-600 hover:bg-gray-100")}
                        >
                            {t(`shift.types.${option}`)}
                        </button>)}
                    </div>
                    {(() => {
                        const group = shifts.filter(shift => (shift.type == "overtime" ? "overtime" : "work") == type);
                        const status = type == "overtime" ? "overtime" : "present";
                        if (group.length == 0) return <p className="rounded-xl border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">
                            {t(type == "overtime" ? 'attendance.noOvertimeShifts' : 'attendance.noNormalShifts')}
                        </p>;
                        return group.map((shift) => (
                            <Radio
                                key={shift.id}
                                value={shift.id}
                                className={`ts-status-${status} rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300 data-[selected=true]:border-[#a46023] data-[selected=true]:bg-[#fdf8f3]`}
                            >
                                <Radio.Content className="w-full items-start gap-3 p-3">
                                    <Radio.Control className="mt-0.5">
                                        <Radio.Indicator />
                                    </Radio.Control>
                                    <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: "var(--ts-bar)" }} />
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="font-medium text-gray-900">{shift.name}</span>
                                        <span className="text-xs text-gray-500">{shift.shift} ({shift.totalShiftMinutes}) - {t('attendance.breakInfo', { minutes: shift.break })}</span>
                                    </span>
                                </Radio.Content>
                            </Radio>
                        ));
                    })()}
                    <FieldError className="mt-4">{fieldState.error?.message}</FieldError>
                </RadioGroup>
            }}
        />
    </form>
}
export default Standard;