import React, { useState } from "react";
import { DatePicker, Calendar, DateField } from "@heroui/react";
import { today } from "@internationalized/date";
import { I18nProvider } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { getLocale } from "@/app/i18n";
const WeekView = (props: any) => {
    const { setCalendarWeek } = props;
    const [value, setValue] = useState(today("America/Paramaribo"));
    const { i18n } = useTranslation();
    return <div className="flex flex-wrap items-center justify-between gap-3 md:gap-6">
    <I18nProvider locale={`${getLocale(i18n.resolvedLanguage)}-u-fw-mon`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
        <DatePicker 
            className="min-w-0 flex-1 sm:flex-none sm:w-56 lg:w-64"
            value={value}
            aria-label="Date Picker View"
            onChange={(e: any)=>{
                setValue(e);
                const { year, month, day } = e;
                const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                setCalendarWeek(date);
        }}>
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
    

        <Calendar
            className="min-w-0 flex-1 sm:flex-none sm:w-auto sm:max-w-none"
            aria-label="Calendar Week Next Prev"
            visibleDuration={{ weeks: 1 }}
            focusedValue={value}
            onFocusChange={(e: any) => {
                setValue(e);
                const { year, month, day } = e;
                const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                setCalendarWeek(date);
            }}
        >
            <Calendar.Header className="pb-0 gap-2"
            >
                <Calendar.Heading className="sm:whitespace-nowrap" />
                    <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
                
            </Calendar.Header>
        </Calendar>
        </div>

        <Calendar
            isReadOnly
            className="hidden md:block"
            aria-label="Calendar Week View"
            visibleDuration={{ weeks: 1 }}
            focusedValue={value}
        >
            <Calendar.Grid>
                <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
            </Calendar.Grid>
        </Calendar>
    </I18nProvider>
    </div>
};
export default React.memo(WeekView);