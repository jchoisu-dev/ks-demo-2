import { Input, Label, NumberField, FieldError, TimeField, RadioGroup, Radio } from '@heroui/react';
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AttendanceManualSchema, AttendanceManualSchemaType } from '../attendance.schema';
import { shiftTypes } from '../constants';
import { useAppSelector } from '@/app/store';
import { useCreateAttendance } from '../hooks';
import { useTranslation } from 'react-i18next';
const Manual = () => {
    const { modalProps } = useAppSelector((state) => state.modal);
    const { t } = useTranslation();
    const { control, handleSubmit, formState: { errors } } = useForm<AttendanceManualSchemaType>({
        resolver: zodResolver(AttendanceManualSchema),
        mode: "onSubmit",
        defaultValues: {
            begin: null,
            end: null,
            totalBreakMinutes: undefined,
            type: 'present'
        }
    });
    const { mutate } = useCreateAttendance();
    const onSubmit = (data: any) => {
        const { begin, end } = data;
        mutate({
            ...modalProps,
            ...data,
            mode: 'manual',
            begin: begin ? `${String(begin.hour).padStart(2, "0")}:${String(begin.minute).padStart(2, "0")}` : null,
            end: end ? `${String(end.hour).padStart(2, "0")}:${String(end.minute).padStart(2, "0")}` : null
        });
    };
    type ShiftType = keyof typeof shiftTypes;
    return <form
        id="CREATE_ATTENDANCE_FORM"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
    >
        <div className="flex flex-col gap-4">
            <Controller
                name="begin"
                control={control}
                render={({ field: { onChange, value }, fieldState }) => {
                    return <TimeField
                        onChange={onChange}
                        value={value}
                        isRequired
                        fullWidth
                        isInvalid={fieldState?.invalid}
                    >
                        <Label>{t('attendance.beginShift')}</Label>
                        <TimeField.Group>
                            <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
                        </TimeField.Group>
                        <FieldError>{fieldState?.error?.message}</FieldError>
                    </TimeField>
                }}
            />

            <Controller
                name="end"
                control={control}
                render={({ field: { onChange, value }, fieldState }) => {
                    return <TimeField
                        onChange={onChange}
                        value={value}
                        isRequired
                        fullWidth
                        isInvalid={fieldState?.invalid}
                    >
                        <Label>{t('attendance.endShift')}</Label>
                        <TimeField.Group>
                            <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
                        </TimeField.Group>
                        <FieldError>{fieldState?.error?.message}</FieldError>
                    </TimeField>
                }}
            />

            <Controller
                name="totalBreakMinutes"
                control={control}
                render={({ field: { onChange, value }, fieldState }) => {
                    return <NumberField
                        onChange={onChange}
                        value={value}
                        isInvalid={fieldState?.invalid}
                    >
                        <Label>{t('attendance.breakMinutes')}</Label>
                        <Input placeholder={"0"} />
                        <FieldError>{fieldState?.error?.message}</FieldError>
                    </NumberField>
                }}
            />

            <Controller
                name="type"
                control={control}
                render={({ field: { onChange, value }, fieldState }) => {
                    return <RadioGroup
                        onChange={onChange}
                        value={value}
                        isInvalid={fieldState?.invalid}
                        isRequired
                        aria-label="workshift-type"
                    >
                        <Label>{t('attendance.attendanceType')}</Label>
                        {(Object.keys(shiftTypes) as ShiftType[]).map(shift => (
                            <Radio value={shift} key={shift}>
                                <Radio.Content>
                                    <Radio.Control>
                                        <Radio.Indicator />
                                    </Radio.Control>
                                    {t(`attendanceTypes.${shift}`)}
                                </Radio.Content>
                            </Radio>
                        ))}
                    </RadioGroup>
                }}
            />
        </div>
    </form>
}
export default Manual;