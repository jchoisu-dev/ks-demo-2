import { RadioGroup, Radio, Label } from '@heroui/react';
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AttendanceOtherSchema, AttendanceOtherSchemaType } from '../attendance.schema';
import { shiftTypesOther } from '../constants';
import { useAppSelector } from '@/app/store';
import { useCreateAttendance } from '../hooks';
import { useTranslation } from 'react-i18next';
const Other = () => 
{
  const { modalProps } = useAppSelector((state) => state.modal);
  const { t } = useTranslation();
  const { control, handleSubmit, formState: { errors } } = useForm<AttendanceOtherSchemaType>({
    resolver: zodResolver(AttendanceOtherSchema),
    mode: "onSubmit",
    defaultValues: {
      type: 'absent',
      billable: "No"
    }
  });
  const { mutate } = useCreateAttendance();
  const onSubmit = (data: any) => {
    const { billable } = data;
    mutate({
      ...modalProps,
      ...data,
      billable: billable == 'Yes' ? true : false,
      mode: 'other'
    });
  };
  type shiftTypesOtherType = keyof typeof shiftTypesOther;
  return <form
    id="CREATE_ATTENDANCE_FORM"
    onSubmit={handleSubmit(onSubmit)}
    noValidate
  >
    <div className="flex flex-col gap-4">

      <div className="grid grid-cols-12">
        <div className="col-span-6 flex flex-col">
          <Controller
            name="type"
            control={control}
            render={({ field: { onChange, value }, fieldState }) => {
              return <RadioGroup
                onChange={onChange}
                value={value}
                isInvalid={fieldState?.invalid}
                isRequired
                aria-label="other-type"
                defaultValue="present"
              >
                <Label>{t('attendance.unproductiveHours')}</Label>
                {(Object.keys(shiftTypesOther) as shiftTypesOtherType[]).map(shift => (
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
        <div className="col-span-6 flex flex-col">
          <Controller
            name="billable"
            control={control}
            render={({ field: { onChange, value }, fieldState }) => {
              return <RadioGroup
                onChange={onChange}
                value={value}
                isInvalid={fieldState?.invalid}
                isRequired
                aria-label="billable-type"
              >
                <Label>{t('attendance.billable')}</Label>
                {['Yes', 'No'].map((v, k) => (
                  <Radio value={v} key={k}>
                    <Radio.Content>
                      <Radio.Control>
                        <Radio.Indicator />
                      </Radio.Control>
                      {v == 'Yes' ? t('common.yes') : t('common.no')}
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
            }}
          />
        </div>

      </div>
    </div>
  </form>
}

export default Other;