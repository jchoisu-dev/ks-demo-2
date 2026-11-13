import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label, TextField, TextArea, NumberField, FieldError, Typography, Description, Radio, RadioGroup } from '@heroui/react';
import { DatePicker } from '@/shared/components/ui';
import { useAppSelector } from '@/app/store';
import { EmployeeSchema, EmployeeSchemaType } from '../employee.schema';
import { useCreateEmployee, useGetEmployee, useUpdateEmployee } from '../hooks';
import { currencies, payTypes, employeeTypes } from '../employee.constants';
import { parseDate } from "@internationalized/date";
import { uploadFile } from '@/shared/utils';
import { useTranslation } from "react-i18next";
import { useGetWorkHours } from '@/features/settings/hooks';
const EmployeeCreateOrUpdate = () => {
  const { modalProps } = useAppSelector((state) => state.modal);
  const { t } = useTranslation();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<EmployeeSchemaType>({
    resolver: zodResolver(EmployeeSchema),
    mode: "onSubmit",
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      birthdate: null,
      hiredAt: null,
      startWorkDay: null,
      endWorkDay: null,
      description: "",
      type: "full-time",
      salary: {
        currency: "SRD",
        payType: "hourly"
      },
      incentive_weekdays: {
        amount: 0
      },
      profileImage: "",
      leaveDaysPerYear: null,
      bank: {
        name: "",
        accountNumber: "",
        accountHolder: ""
      }
    }
  });
  const payType = useWatch({ control, name: "salary.payType" });
  const employeeId = modalProps?.rowId;
  const { data: workHours } = useGetWorkHours();
  const leaveEnabled = workHours?.leaveEnabled !== false;
  const { mutate } = useCreateEmployee();
  const { data: employee, isPending } = useGetEmployee(employeeId);
  const updateEmployee = useUpdateEmployee();
  const [imagePreview, setImagePreview] = useState<string | null>("");
  const [selectedFile, setSelectedFile] = useState<string | null>("");
  const handleFileChange = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } catch (error) {
    }
  };
  const onSubmit = async (data: any) => {
    let profileImageKey = employee?.profileImage;
    const payload = {
      ...data,
      birthdate: data?.birthdate?.toString() || null,
      startWorkDay: data?.startWorkDay?.toString() || null,
      endWorkDay: data?.endWorkDay?.toString() || null,
      hiredAt: data?.hiredAt?.toString() || null
    };
    payload['profileImage'] = "";
    if (imagePreview) {
      profileImageKey = await uploadFile(selectedFile, employeeId);
      payload['profileImage'] = profileImageKey;
    }
    if (employeeId) {
      return updateEmployee.mutate({
        employeeId,
        ...payload
      });
    }
    mutate(payload);
  }
  useEffect(() => {
    if (!employeeId || isPending) return;
    // @ts-ignore
    reset({
      ...employee,
      leaveDaysPerYear: employee?.leaveDaysPerYear ?? null,
      bank: {
        name: employee?.bank?.name ?? "",
        accountNumber: employee?.bank?.accountNumber ?? "",
        accountHolder: employee?.bank?.accountHolder ?? ""
      },
      birthdate: employee?.birthdate ? parseDate(employee.birthdate) : null,
      hiredAt: employee?.hiredAt ? parseDate(employee.hiredAt) : null,
      startWorkDay: employee?.startWorkDay ? parseDate(employee.startWorkDay) : null,
      endWorkDay: employee?.endWorkDay ? parseDate(employee.endWorkDay) : null
    });
    setImagePreview(employee?.profileImage ?? null)
  }, [employeeId, employee])
  if (employeeId && isPending) return <></>;
  return <div>
    <form
      id="CREATE_OR_EDIT_EMPLOYEE"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4">
        <div className="lg:col-span-4 flex flex-col gap-4">

          <Typography type={'h2'}>{t('employee.personal')}</Typography>

          <div className="flex flex-col sm:flex-row gap-4">
            <Controller
              name="firstName"
              control={control}
              render={({ field, fieldState }) => {
                return <TextField
                  {...field}
                  isInvalid={fieldState?.invalid}
                  isRequired
                  fullWidth
                >
                  <Label>{t('employee.firstName')}</Label>
                  <Input placeholder={t('common.enterField', { field: t('employee.firstName') })} />
                  <FieldError>{fieldState?.error?.message}</FieldError>

                </TextField>
              }}
            />

            <Controller
              name="lastName"
              control={control}
              render={({ field, fieldState }) => {
                return <TextField
                  {...field}
                  isInvalid={fieldState?.invalid}
                  isRequired
                  fullWidth
                >
                  <Label>{t('employee.lastName')}</Label>
                  <Input placeholder={t('common.enterField', { field: t('employee.lastName') })} />
                  <FieldError>{fieldState?.error?.message}</FieldError>

                </TextField>
              }}
            />
          </div>

          <Controller
            name="middleName"
            control={control}
            render={({ field, fieldState }) => {
              return <TextField
                {...field}
                isInvalid={fieldState?.invalid}
              >
                <Label>{t('employee.middleName')}</Label>
                <Input placeholder={t('common.enterField', { field: t('employee.middleName') })} />
                <FieldError>{fieldState?.error?.message}</FieldError>

              </TextField>
            }}
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => {
              return <TextField
                {...field}
                isInvalid={fieldState?.invalid}
              >
                <Label>{t('employee.email')}</Label>
                <Input placeholder={t('common.enterField', { field: t('employee.email') })} />
                <FieldError>{fieldState?.error?.message}</FieldError>

              </TextField>
            }}
          />

          <Controller
            name="birthdate"
            control={control}
            render={({ field: { onChange, value } }) => {
              return <DatePicker
                value={value}
                onChange={onChange}
                label={t('employee.birthDate')}
              />
            }}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => {
              return <TextField
                {...field}
                isInvalid={fieldState?.invalid}
              >
                <Label>{t('employee.phone')}</Label>
                <Input placeholder={t('common.enterField', { field: t('employee.phone') })} />
                <FieldError>{fieldState?.error?.message}</FieldError>

              </TextField>
            }}
          />

          <Controller
            name="address"
            control={control}
            render={({ field, fieldState }) => {
              return <TextField
                {...field}
                isInvalid={fieldState?.invalid}
              >
                <Label>{t('employee.address')}</Label>
                <Input placeholder={t('common.enterField', { field: t('employee.address') })} />
                <FieldError>{fieldState?.error?.message}</FieldError>

              </TextField>
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

        <div className="lg:col-span-4 flex flex-col gap-4">

          <Typography type={'h2'}>{t('employee.employment')}</Typography>

          <Controller
            name="hiredAt"
            control={control}
            render={({ field: { onChange, value } }) => {
              return <DatePicker
                value={value}
                onChange={onChange}
                label={t('employee.hireDate')}
              />
            }}
          />

          <Controller
            name="startWorkDay"
            control={control}
            render={({ field: { onChange, value } }) => {
              return <DatePicker
                value={value}
                onChange={onChange}
                label={t('employee.startWorkDay')}
              />
            }}
          />

          <Controller
            name="endWorkDay"
            control={control}
            render={({ field: { onChange, value } }) => {
              return <DatePicker
                value={value}
                onChange={onChange}
                label={t('employee.endWorkDay')}
              />
            }}
          />

          <Controller
            name="salary.amount"
            control={control}
            render={({ field, fieldState }) => {
              return <NumberField
                {...field}
                isInvalid={fieldState?.invalid}
                isRequired
              >
                <Label>{t('employee.salary')}</Label>
                <Input min="0" placeholder="888" />
                <FieldError>{fieldState?.error?.message}</FieldError>

              </NumberField>
            }}
          />

          {payType != "monthly" && <Controller
            name="incentive_weekdays.amount"
            control={control}
            render={({ field, fieldState }) => {
              return <NumberField
                {...field}
                isInvalid={fieldState?.invalid}
              >
                <Label>{t('employee.attendanceBonus')}</Label>
                <Input min="0" placeholder="888" />
                <FieldError>{fieldState?.error?.message}</FieldError>

              </NumberField>
            }}
          />}

          {leaveEnabled && <Controller
            name="leaveDaysPerYear"
            control={control}
            render={({ field, fieldState }) => {
              return <NumberField
                value={field.value ?? NaN}
                onChange={(value) => field.onChange(Number.isNaN(value) ? null : value)}
                onBlur={field.onBlur}
                isInvalid={fieldState?.invalid}
                minValue={0}
              >
                <Label>{t('employee.leaveDays')}</Label>
                <Input min="0" placeholder={t('employee.leaveDaysPlaceholder')} />
                <Description>{t('employee.leaveDaysHint')}</Description>
                <FieldError>{fieldState?.error?.message}</FieldError>
              </NumberField>
            }}
          />}

          {(["name", "accountNumber", "accountHolder"] as const).map(key => (
            <Controller
              key={key}
              name={`bank.${key}`}
              control={control}
              render={({ field }) => {
                return <TextField {...field}>
                  <Label>{t(`employee.bank.${key}`)}</Label>
                  <Input placeholder={t(`employee.bank.${key}Placeholder`)} />
                </TextField>
              }}
            />
          ))}

          <Controller
            name="salary.currency"
            control={control}
            render={({ field, fieldState }) => {
              return <RadioGroup
                {...field}
                isInvalid={fieldState?.invalid}

                defaultValue="SRD"
                orientation="horizontal"
                aria-label="employee-salary"
              >
                {currencies.map((currency, key) => (
                  <Radio value={currency.id} key={key}>
                    <Radio.Content>
                      <Radio.Control>
                        <Radio.Indicator />
                      </Radio.Control>
                      {currency.symbol}
                    </Radio.Content>
                    <Description>{t(`currencies.${currency.id}`)}</Description>
                  </Radio>
                ))}
              </RadioGroup>
            }}
          />

          <Controller
            name="salary.payType"
            control={control}
            render={({ field, fieldState }) => {
              return <RadioGroup
                {...field}
                isInvalid={fieldState?.invalid}
                isRequired
                defaultValue="hourly"
                orientation="horizontal"
                aria-label="employee-pay"
              >
                {payTypes.map((pay, key) => (
                  <Radio value={pay.id} key={key}>
                    <Radio.Content>
                      <Radio.Control>
                        <Radio.Indicator />
                      </Radio.Control>
                      {t(`payTypes.${pay.id}`)}
                    </Radio.Content>
                  </Radio>
                ))}
                {payType == "monthly" && <Description className="basis-full">{t('employee.monthlyPayHint')}</Description>}
              </RadioGroup>
            }}
          />

          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => {
              return <RadioGroup
                {...field}
                isInvalid={fieldState?.invalid}
                isRequired
                defaultValue="full-time"
                orientation="horizontal"
                aria-label="employee-type"
              >
                {employeeTypes.map((employee, key) => (
                  <Radio value={employee.id} key={key}>
                    <Radio.Content>
                      <Radio.Control>
                        <Radio.Indicator />
                      </Radio.Control>
                      {t(`employeeTypes.${employee.id}`)}
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
            }}
          />

        </div>

        <div className="lg:col-span-4">
          <Typography className="mb-4" type={'h2'}>{t('employee.identification')}</Typography>

          <input
            type="file"
            id="image-upload"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {imagePreview ? (
            <label
              htmlFor="image-upload"
              className="block w-fit m-auto mb-10 cursor-pointer"
            >
              <img
                src={imagePreview}
                alt={imagePreview}
                className="max-w-full object-cover rounded-lg hover:opacity-80 transition"
              />
            </label>
          ) : (
            <label
              htmlFor="image-upload"
              className="image-upload-box"
            >
              <div className="image-upload-icon">＋</div>

              <span className="image-upload-title">
                {t('employee.uploadImage')}
              </span>

              <span className="image-upload-text">
                {t('employee.uploadHint')}
              </span>
            </label>
          )}

        </div>

      </div>

    </form>
  </div>
}
export default EmployeeCreateOrUpdate;