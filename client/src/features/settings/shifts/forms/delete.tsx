import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Spinner } from '@/shared/components/ui';
import { useAppSelector } from '@/app/store';
import { useDeleteShift } from '../hooks';
const EmployeeDelete = () => {
  const { modalProps } = useAppSelector((state) => state.modal);
  const shiftId = modalProps?.rowId;
  const { mutate, isPending } = useDeleteShift();
  const { handleSubmit } = useForm();
  const { t } = useTranslation();
  if (isPending) return <Spinner size="sm" />;
  return <div>
    <form
      id="DELETE_SHIFT"
      onSubmit={handleSubmit(()=>mutate(shiftId))}
      noValidate
    >
      {t('shift.deleteConfirm')}
    </form>
  </div>
}
export default EmployeeDelete;