import type { TFunction } from 'i18next';
import { Attendance } from '../attendance.types';
const renderAttendanceInfo = (props: Attendance, t: TFunction) => {

    const { status, begin, end } = props;
    switch (status) {
        case "present":
            return <span className="cell-entry">
                <span className="cell-time"><span>{begin}–</span><span>{end}</span></span>
            </span>;

        case "overtime":
            return <span className="cell-entry">
                <span className="cell-tag">OT</span>
                <span className="cell-time"><span>{begin}–</span><span>{end}</span></span>
            </span>;

        case "sick":
        case "leave":
        case "absent":
        case "holiday":
            return <span className="cell-entry">
                <span className="cell-label">{t(`attendanceTypes.${status}`)}</span>
            </span>;

        default:
            return null;
    }
};

export default renderAttendanceInfo;
