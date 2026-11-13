import { Label, TimeField, Description, FieldError } from '@heroui/react';
const CustomTimeField = props => {
    console.log(props)
    return <TimeField
        {...props}
    >
        <Label>{props.label}</Label>
        <TimeField.Group>
            <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
        <FieldError>{props?.fieldState?.error?.message}</FieldError>
    </TimeField>
}

export default CustomTimeField;