import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppSelector } from '@/app/store';
import { useSaveUser } from '../hooks';
import type { StaffRole, StaffUser } from '../users.types';
const ROLES: StaffRole[] = ["admin", "payroll", "viewer"];
const MIN_PASSWORD = 8;
type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  password: string;
}
const UserForm = () => {
  const { t } = useTranslation();
  const { modalProps } = useAppSelector((state) => state.modal);
  const user: StaffUser | undefined = modalProps?.user;
  const id: string | null = user?.id ?? null;
  const { mutate } = useSaveUser();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      role: (user?.role == "manager" ? "payroll" : user?.role) ?? "payroll",
      password: ""
    }
  });
  const fieldClass = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-[#a46023]";
  const error = (message?: string) => message && <span className="mt-1 block text-xs text-red-600">{message}</span>;
  return <form
    id="USER_FORM"
    noValidate
    className="flex flex-col gap-4"
    onSubmit={handleSubmit(({ password, ...values }) => mutate({ id, payload: id ? values : { ...values, password } }))}
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="block text-sm text-gray-700">
        {t("employee.firstName")}
        <input className={fieldClass} {...register("firstName", { validate: value => value.trim() ? true : t("validation.firstNameRequired") })} />
        {error(errors.firstName?.message)}
      </label>
      <label className="block text-sm text-gray-700">
        {t("employee.lastName")}
        <input className={fieldClass} {...register("lastName")} />
      </label>
    </div>
    <label className="block text-sm text-gray-700">
      {t("users.email")}
      <input type="email" autoComplete="off" className={fieldClass} {...register("email", { validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? true : t("validation.emailInvalid") })} />
      {error(errors.email?.message)}
    </label>
    <label className="block text-sm text-gray-700">
      {t("users.role")}
      <select className={fieldClass + " cursor-pointer"} {...register("role")}>
        {ROLES.map(role => <option key={role} value={role}>{t(`roles.${role}`)} — {t(`users.roleHints.${role}`)}</option>)}
      </select>
    </label>
    {!id && <label className="block text-sm text-gray-700">
      {t("users.temporaryPassword")}
      <input type="text" autoComplete="new-password" className={fieldClass} {...register("password", { validate: value => value.length >= MIN_PASSWORD ? true : t("account.passwordMin", { count: MIN_PASSWORD }) })} />
      <span className="mt-1 block text-xs text-gray-500">{t("users.temporaryPasswordHint")}</span>
      {error(errors.password?.message)}
    </label>}
  </form>;
};
export default UserForm;
