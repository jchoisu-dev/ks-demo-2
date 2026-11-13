import { Input, Label, TextField, Description, FieldError } from '@heroui/react';
const CustomTextField = (props: any) => {
    const { label, placeholder, fieldState, errors, autoComplete, isRequired } = props;
    return <TextField
        isInvalid={fieldState?.invalid}
        isRequired={isRequired}
        {...props}
    >
        <Label>{label}</Label>
        <Input placeholder={placeholder} autoComplete={autoComplete || ""} />
        <FieldError>{fieldState?.error?.message}</FieldError>
        <Description>{errors?.firstName?.message}</Description>
    </TextField>
}
export default CustomTextField;