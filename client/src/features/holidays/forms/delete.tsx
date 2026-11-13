import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Spinner } from '@/shared/components/ui';
import { useAppSelector } from '@/app/store';
import { useDeleteHoliday } from '../hooks';
const EmployeeDelete = () => {
  const { modalProps } = useAppSelector((state) => state.modal);
  const holidayId = modalProps?.rowId;
  const { mutate, isPending } = useDeleteHoliday();
  const { handleSubmit } = useForm();
  const { t } = useTranslation();
  if (isPending) return <Spinner size="sm" />;
  return <div>
    <form
      id="DELETE_HOLIDAY"
      onSubmit={handleSubmit(()=>mutate(holidayId))}
      noValidate
    >
      {t('holiday.deleteConfirm')}
    </form>
  </div>
}
export default EmployeeDelete;