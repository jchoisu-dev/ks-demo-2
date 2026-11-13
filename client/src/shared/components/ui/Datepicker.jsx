import { Calendar, DatePicker, DateField, Label } from '@heroui/react';
const CustomDatePicker = props => {
    const { value, onChange, label } = props;
    return <DatePicker
        value={value}
        onChange={onChange}
    >
        <Label>{label}</Label>
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
    </DatePicker>
}
export default CustomDatePicker;