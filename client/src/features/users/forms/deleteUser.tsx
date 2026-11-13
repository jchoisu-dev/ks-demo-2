import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppSelector } from '@/app/store';
import { useDeleteUser } from '../hooks';
const DeleteUser = () => {
  const { t } = useTranslation();
  const { modalProps } = useAppSelector((state) => state.modal);
  const { mutate } = useDeleteUser();
  const { handleSubmit } = useForm();
  return <form
    id="DELETE_USER"
    noValidate
    onSubmit={handleSubmit(() => mutate(modalProps?.rowId))}
  >
    {t("users.deleteConfirm", { name: modalProps?.label })}
  </form>;
};
export default DeleteUser;
