import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Input, Label, NumberField, FieldError, Description } from "@heroui/react";
type NumberInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  ariaLabel?: string;
  description?: string;
  isRequired?: boolean;
}
const NumberInput = <T extends FieldValues>({ control, name, label, ariaLabel, description, isRequired }: NumberInputProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState }) => (
      <NumberField
        value={field.value ?? NaN}
        onChange={field.onChange}
        onBlur={field.onBlur}
        isInvalid={fieldState.invalid}
        isRequired={isRequired}
        aria-label={label ? undefined : ariaLabel}
        minValue={0}
        formatOptions={{ maximumFractionDigits: 2 }}
        className="min-w-0 w-full"
      >
        {label && <Label>{label}</Label>}
        <Input className="min-w-0 w-full" />
        {description && <Description>{description}</Description>}
        <FieldError>{fieldState.error?.message}</FieldError>
      </NumberField>
    )}
  />
);
export default NumberInput;
