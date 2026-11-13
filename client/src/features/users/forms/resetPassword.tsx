import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppSelector } from '@/app/store';
import { useResetPassword } from '../hooks';
const MIN_PASSWORD = 8;
const ResetPassword = () => {
  const { t } = useTranslation();
  const { modalProps } = useAppSelector((state) => state.modal);
  const { mutate } = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<{ password: string }>({ defaultValues: { password: "" } });
  return <form
    id="USER_RESET_PASSWORD"
    noValidate
    className="flex flex-col gap-3"
    onSubmit={handleSubmit(({ password }) => mutate({ id: modalProps?.rowId, password }))}
  >
    <p className="text-sm text-gray-600">{t("users.resetHint", { name: modalProps?.label })}</p>
    <label className="block text-sm text-gray-700">
      {t("users.temporaryPassword")}
      <input type="text" autoComplete="new-password" className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-[#a46023]" {...register("password", { validate: value => value.length >= MIN_PASSWORD ? true : t("account.passwordMin", { count: MIN_PASSWORD }) })} />
      {errors.password?.message && <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>}
    </label>
  </form>;
};
export default ResetPassword;
