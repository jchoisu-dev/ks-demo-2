import React from "react";
import { DatePicker, Calendar, DateField, Label } from "@heroui/react";
import type { CalendarDaySelectProps } from '../payroll.types';
const CalendarDaySelect = (props: CalendarDaySelectProps) => {
    const { setCalendarDay, value, label } = props;
    return <div className="flex flex-1 min-w-0 sm:flex-none">
        
        <div className="flex flex-1 min-w-0 items-center gap-2">
            <Label className="hidden sm:inline">{label}</Label>
            <DatePicker 
                className="w-full min-w-0 sm:w-48"
                value={value}
                aria-label={label}
                onChange={e=>setCalendarDay(e)}
            >
                <DateField.Group fullWidth>
                    <DateField.Input className="px-1.5 text-sm sm:px-3">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                    <DateField.Suffix className="mr-1.5 sm:mr-3">
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
        </div>

    </div>
};
export default React.memo(CalendarDaySelect);