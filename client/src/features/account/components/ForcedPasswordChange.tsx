import { ShieldAlert, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLogout } from "@/features/auth/hooks/useLogOut";
import ChangePasswordForm from "./ChangePasswordForm";
const ForcedPasswordChange = () => {
  const { t } = useTranslation();
  const { logout } = useLogout();
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-white p-4" role="dialog" aria-modal="true" aria-labelledby="forced-password-title">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      <div>
        <h1 id="forced-password-title" className="text-xl font-semibold text-gray-900">{t("account.changePassword")}</h1>
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        {t("account.mustChange")}
      </p>
      <ChangePasswordForm formId="FORCED_CHANGE_PASSWORD" />
      <button type="button" onClick={() => logout()} className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-600 cursor-pointer">
        <LogOut size={16} /> {t("common.logout")}
      </button>
    </div>
  </div>;
};
export default ForcedPasswordChange;
