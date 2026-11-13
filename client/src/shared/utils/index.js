import axios from "@/shared/api/axios";
import { CalendarDate } from "@internationalized/date";
const uploadFile = async (file, employeeId) => {
    try {
        const { data } = await axios.post("uploads/presigned-url", {
            employeeId,
            fileName: file.name,
            contentType: file.type
        });
        const response = await fetch(data.uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type
            }
        });
        return data.key;
    } catch (error) {
        console.log(error)
    }
};
const formatDate = async (day) =>{
    if(!day) return null;
    const date = new CalendarDate(
        day.year,
        day.month,
        day.day
    );
    const formatted = date.toString();
    return formatted;
}
export {
    uploadFile,
    formatDate
}