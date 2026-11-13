import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label, TextField, NumberField, FieldError, TextArea, TimeField, Radio, RadioGroup, Description } from '@heroui/react';
import { useAppSelector } from '@/app/store';
import { ShiftSchema, ShiftSchemaType } from '../shifts.schema';
import { useGetShift, useCreateShift, useUpdateShift } from '../hooks';
import { parseTime } from "@internationalized/date";
import { useTranslation } from "react-i18next";
const ShiftCreateOrUpdate = () => {
  const { modalProps } = useAppSelector((state) => state.modal);
  const { t } = useTranslation();
  const shiftId = modalProps?.rowId;
  const { mutate } = useCreateShift();
  const { data: shift, isPending } = useGetShift(shiftId);
  const updateShift = useUpdateShift();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ShiftSchemaType>({
    resolver: zodResolver(ShiftSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      begin: null,
      end: null,
      break: undefined,
      type: "work",
      description: ""
    }
  });
  const onSubmit = (data: ShiftSchemaType) => {
    const end = { ...data.end };
    const begin = { ...data.begin };
    const payload = {
      ...data,
      begin: `${String(begin.hour).padStart(2, "0")}:${String(begin.minute).padStart(2, "0")}`,
      end: `${String(end.hour).padStart(2, "0")}:${String(end.minute).padStart(2, "0")}`
    };
    if (shiftId) return updateShift.mutate({
      shiftId,
      ...payload
    });
    mutate(payload);
  }
  useEffect(() => {
    if (!shiftId || isPending) return;
    // @ts-ignore
    reset({
      ...shift,
      begin: shift?.begin ? parseTime(shift.begin) : null,
      end: shift?.end ? parseTime(shift.end) : null,
      type: shift?.type == "overtime" ? "overtime" : "work"
    });
  }, [shiftId, shift])
  if (shiftId && isPending) return <></>;
  return <div>
    <form
      id="CREATE_OR_EDIT_SHIFT_FORM"
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
              <Label>{t('shift.name')}</Label>
              <Input placeholder={t('common.enterField', { field: t('shift.name') })} />
              <FieldError>{fieldState?.error?.message}</FieldError>

            </TextField>
          }}
        />

        <Controller
          name="type"
          control={control}
          render={({ field: { value, onChange } }) => {
            return <RadioGroup value={value} onChange={onChange} orientation="horizontal" isRequired>
              <Label>{t('shift.type')}</Label>
              {(["work", "overtime"] as const).map(type => (
                <Radio value={type} key={type}>
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    {t(`shift.types.${type}`)}
                  </Radio.Content>
                </Radio>
              ))}
              <Description className="basis-full">{t(value == "overtime" ? 'shift.typeHintOvertime' : 'shift.typeHintWork')}</Description>
            </RadioGroup>
          }}
        />

        <div className="flex justify-between gap-3">
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
                <Label>{t('shift.begin')}</Label>
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
                <Label>{t('shift.end')}</Label>
                <TimeField.Group>
                  <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
                </TimeField.Group>
                <FieldError>{fieldState?.error?.message}</FieldError>
              </TimeField>
            }}
          />

        </div>

        <Controller
          name="break"
          control={control}
          render={({ field: { onChange, value }, fieldState }) => {
            return <NumberField
              onChange={onChange}
              value={value}
              isInvalid={fieldState?.invalid}
            >
              <Label>{t('shift.break')}</Label>
              <Input placeholder={"0"} />
              <FieldError>{fieldState?.error?.message}</FieldError>

            </NumberField>
          }}
        />

        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => {
            return <TextArea
              {...field}
              fullWidth
              aria-label="Employee Notes"
              className="h-48"
              placeholder={t('common.notes')}
            />
          }}
        />

      </div>

    </form>
  </div>
}
export default ShiftCreateOrUpdate;