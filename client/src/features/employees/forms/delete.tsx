import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Spinner } from '@/shared/components/ui';
import { useAppSelector } from '@/app/store';
import { useDeleteEmployee } from '../hooks';
const EmployeeDelete = () => {
  const { modalProps } = useAppSelector((state) => state.modal);
  const employeeId = modalProps?.rowId;
  const { mutate, isPending } = useDeleteEmployee();
  const { handleSubmit } = useForm();
  const { t } = useTranslation();
  if (isPending) return <Spinner size="sm" />;
  return <div>
    <form
      id="DELETE_EMPLOYEE"
      onSubmit={handleSubmit(()=>mutate(employeeId))}
      noValidate
    >
      {t('employee.deleteConfirm')}
    </form>
  </div>
}
export default EmployeeDelete;