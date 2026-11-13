import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";
import { useAppDispatch, closeModal, setModalPending } from "@/app/store";
import { useChangePassword } from "@/features/auth/hooks/useProfile";
const MIN_LENGTH = 8;
type ChangePasswordFormProps = {
  formId: string;
  inModal?: boolean;
}
const ChangePasswordForm = ({ formId, inModal = false }: ChangePasswordFormProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { mutate, isPending } = useChangePassword();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (inModal) dispatch(setModalPending(isPending));
  }, [inModal, isPending, dispatch]);
  const errors = {
    currentPassword: !form.currentPassword ? t("account.currentRequired") : "",
    newPassword: form.newPassword.length < MIN_LENGTH ? t("account.passwordMin", { count: MIN_LENGTH }) : form.newPassword == form.currentPassword ? t("account.passwordSame") : "",
    confirmPassword: form.confirmPassword != form.newPassword ? t("account.passwordMismatch") : ""
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const fieldClass = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-[#a46023]";
  const field = (name: keyof typeof form, label: string, autoComplete: string) => <label className="block text-sm text-gray-700">
    {label}
    <input
      type="password"
      name={name}
      autoComplete={autoComplete}
      className={fieldClass + (submitted && errors[name] ? " border-red-400" : "")}
      value={form[name]}
      aria-invalid={Boolean(submitted && errors[name])}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
    />
    {submitted && errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]}</span>}
  </label>;
  return <form
    id={formId}
    noValidate
    className="flex flex-col gap-4"
    onSubmit={(e) => {
      e.preventDefault();
      setSubmitted(true);
      if (hasErrors) return;
      mutate(
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        { onSuccess: () => inModal && dispatch(closeModal()) }
      );
    }}
  >
    <p className="text-sm text-gray-500">{t("account.changePasswordHint", { count: MIN_LENGTH })}</p>
    {field("currentPassword", t("account.currentPassword"), "current-password")}
    {field("newPassword", t("account.newPassword"), "new-password")}
    {field("confirmPassword", t("account.confirmPassword"), "new-password")}
    {!inModal && <div className="flex justify-end">
      <Button type="submit" isPending={isPending}>{isPending ? t("common.loading") + "..." : t("account.savePassword")}</Button>
    </div>}
  </form>;
};
export default ChangePasswordForm;
