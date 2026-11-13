import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker, DateField, Calendar, RadioGroup, Radio, Input, Label, TextField, NumberField, FieldError } from '@heroui/react';
import { useAppSelector } from '@/app/store';
import { HolidaySchema, HolidaySchemaType } from '../holiday.schema';
import { useGetHoliday, useCreateHoliday, useUpdateHoliday } from '../hooks';
import { parseDate } from "@internationalized/date";
import { holidayTypes } from '../constants';
import { useTranslation } from "react-i18next";
const HolidayCreateOrUpdate = () => {
  const { modalProps } = useAppSelector((state) => state.modal);
  const { t } = useTranslation();
  const holidayId = modalProps?.rowId;
  const { mutate } = useCreateHoliday();
  const { data: holiday, isPending } = useGetHoliday(holidayId);
  const updateHoliday = useUpdateHoliday();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<HolidaySchemaType>({
    resolver: zodResolver(HolidaySchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      date: null,
      type: "national",
      rate: 0
    }
  });
  const onSubmit = (data: HolidaySchemaType) => {
    const _date = data.date;
    if (!_date) return;
    const { year, month, day } = _date;
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const payload = {
      ...data,
      date,
    }
    if (holidayId) return updateHoliday.mutate({
      holidayId,
      ...payload
    });
    mutate({ ...payload });
  }
  useEffect(() => {
    if (!holidayId || isPending || !holiday) return;
    reset({
      name: holiday.name,
      date: parseDate(holiday.date),
      type: holiday.type as HolidaySchemaType["type"],
      rate: holiday.rate
    });
  }, [holidayId, holiday])
  if (holidayId && isPending) return <></>;
  type HolidayType = keyof typeof holidayTypes;
  return <div>
    <form
      id="CREATE_OR_EDIT_HOLIDAY_FORM"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >

      <div className="flex flex-col gap-4">

        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => {
            return <TextField
              {...field}
              isInvalid={fieldState?.invalid}
              isRequired
            >
              <Label>{t('holiday.name')}</Label>
              <Input placeholder={t('common.enterField', { field: t('holiday.name') })} />
              <FieldError>{fieldState?.error?.message}</FieldError>

            </TextField>
          }}
        />

        <Controller
          name="date"
          control={control}
          render={({ field: { value, onChange }, fieldState }) => {
            return <DatePicker
              name="date"
              isRequired
              value={value}
              isInvalid={fieldState?.invalid}
              aria-label="Date Picker View"
              onChange={onChange}
            >
              <Label>{t('holiday.date')}</Label>
              <DateField.Group fullWidth>
                <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                <DateField.Suffix>
                  <DatePicker.Trigger>
                    <DatePicker.TriggerIndicator />
                  </DatePicker.Trigger>
                </DateField.Suffix>
              </DateField.Group>
              <DatePicker.Popover>
                <Calendar aria-label="Event date">
                  <Calendar.Header>
                    <Calendar.YearPickerTrigger>
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator />
                    </Calendar.YearPickerTrigger>
                    <Calendar.NavButton slot="previous" />
                    <Calendar.NavButton slot="next" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                  </Calendar.Grid>
                  <Calendar.YearPickerGrid>
                    <Calendar.YearPickerGridBody>
                      {({ year }) => <Calendar.YearPickerCell year={year} />}
                    </Calendar.YearPickerGridBody>
                  </Calendar.YearPickerGrid>
                </Calendar>
              </DatePicker.Popover>
              <FieldError>{fieldState?.error?.message}</FieldError>
            </DatePicker>
          }}
        />

         <Controller
          name="rate"
          control={control}
          render={({ field, fieldState }) => {
            return <NumberField
              {...field}
              isInvalid={fieldState?.invalid}
            >
              <Label>{t('holiday.payRate')}</Label>
              <Input min="0" placeholder="1.5" />
              <FieldError>{fieldState?.error?.message}</FieldError>

            </NumberField>
          }}
        />

        <div className="flex flex-col">
          <Controller
            name="type"
            control={control}
            render={({ field: { onChange, value }, fieldState }) => {
              return <RadioGroup
                onChange={onChange}
                value={value}
                isInvalid={fieldState?.invalid}
                isRequired
                aria-label="holiday-type"
              >
                <Label>{t('holiday.typeOfHoliday')}</Label>
                {(Object.keys(holidayTypes) as HolidayType[]).map(holiday => (
                  <Radio value={holiday} key={holiday}>
                    <Radio.Content>
                      <Radio.Control>
                        <Radio.Indicator />
                      </Radio.Control>
                      {t(`holidayTypes.${holiday}`)}
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
            }}
          />
        </div>

       

      </div>

    </form>
  </div>
}
export default HolidayCreateOrUpdate;