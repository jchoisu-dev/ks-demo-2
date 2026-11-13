import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/app/i18n";
const LanguageSwitcher = ({ className = "" }: { className?: string }) => {
  const { t, i18n } = useTranslation();
  return <label className={"flex items-center gap-2 " + className}>
    <Languages size={18} className="text-gray-500 shrink-0" />
    <span className="sr-only">{t("common.language")}</span>
    <select
      className="bg-transparent border border-gray-200 rounded-md px-2 py-1 text-sm cursor-pointer"
      value={i18n.resolvedLanguage}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {LANGUAGES.map(language => (
        <option key={language.code} value={language.code}>
          {language.label}
        </option>
      ))}
    </select>
  </label>
}
export default LanguageSwitcher;
